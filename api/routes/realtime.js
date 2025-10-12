/**
 * Realtime API Routes
 * Handles WebSocket proxy connections to OpenAI Realtime API
 */

const { logger } = require('../core/Logger');
const WebSocket = require('ws');
const { createServer } = require('http');

// Store active connections
const activeConnections = new Map();

/**
 * Register realtime routes
 */
async function registerRealtimeRoutes(fastify, options) {
  // WebSocket upgrade endpoint for realtime connections
  fastify.get('/connect', { websocket: true }, (connection, req) => {
connection.binaryType = 'arraybuffer';

    const { model = 'gpt-realtime' } = req.query;

    try {
      // Create connection to OpenAI Realtime API
      const openaiWs = new WebSocket(
        `wss://api.openai.com/v1/realtime?model=${encodeURIComponent(model)}`,
        'realtime',
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
          }
        }
      );
      openaiWs.binaryType = 'arraybuffer';

      // Store the connection pair
      activeConnections.set(connection, openaiWs);
      activeConnections.set(openaiWs, connection);

      // Handle messages from client to OpenAI
      connection.on('message', (data, isBinary) => {
        try {
          if (isBinary) {
if (openaiWs.readyState === WebSocket.OPEN) {
              openaiWs.send(data, { binary: true });
            }
          } else {
            const text = typeof data === 'string' ? data : data.toString('utf8');
if (openaiWs.readyState === WebSocket.OPEN) {
              openaiWs.send(text, { binary: false });
            }
          }
        } catch (error) {
          logger.error('Error forwarding message to OpenAI:', error);
        }
      });

      // Handle messages from OpenAI to client
      openaiWs.on('message', (data, isBinary) => {
        try {
          if (isBinary) {
if (connection.readyState === WebSocket.OPEN) {
              connection.send(data, { binary: true });
            }
          } else {
            const text = typeof data === 'string' ? data : data.toString('utf8');
            try {
              const msg = JSON.parse(text);
              if (msg.type === 'error') {
                logger.error('❌ OpenAI error:', JSON.stringify(msg, null, 2));
              } else if (msg.type === 'session.created' || msg.type === 'response.created' || msg.type === 'response.done') {
}
            } catch (_) {
              // Non-JSON text
}
            if (connection.readyState === WebSocket.OPEN) {
              connection.send(text, { binary: false });
            }
          }
        } catch (error) {
          logger.error('Error forwarding message to client:', error);
        }
      });

      // Handle OpenAI connection open
      openaiWs.on('open', () => {
logger.debug('🔗 OpenAI WebSocket URL:', `wss://api.openai.com/v1/realtime?model=${model}`);
      });

      // Handle OpenAI connection errors
      openaiWs.on('error', (error) => {
        logger.error('❌ OpenAI Realtime API error:', error);
        if (connection.readyState === WebSocket.OPEN) {
          connection.send(JSON.stringify({
            type: 'error',
            error: {
              type: 'openai_connection_error',
              message: 'Failed to connect to OpenAI Realtime API'
            }
          }));
        }
      });

      // Handle client disconnection
      connection.on('close', () => {
if (openaiWs.readyState === WebSocket.OPEN) {
          openaiWs.close();
        }
        activeConnections.delete(connection);
        activeConnections.delete(openaiWs);
      });

      // Handle OpenAI disconnection
      openaiWs.on('close', (code, reason) => {
if (connection.readyState === WebSocket.OPEN) {
          connection.close(code, reason);
        }
        activeConnections.delete(connection);
        activeConnections.delete(openaiWs);
      });

    } catch (error) {
      logger.error('❌ Failed to establish realtime connection:', error);
      connection.send(JSON.stringify({
        type: 'error',
        error: {
          type: 'connection_failed',
          message: 'Failed to establish realtime connection'
        }
      }));
      connection.close();
    }
  });

  // Health check endpoint
  fastify.get('/health', async (request, reply) => {
    const activeCount = activeConnections.size / 2; // Each connection has 2 entries
    reply.send({
      status: 'ok',
      activeConnections: activeCount,
      timestamp: new Date().toISOString()
    });
  });

}

module.exports = registerRealtimeRoutes;
