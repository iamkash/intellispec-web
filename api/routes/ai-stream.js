/**
 * AI Streaming API
 * 
 * Provides streaming AI responses for real-time recommendations and analysis.
 * Completely generic - accepts any prompts from metadata.
 * 
 * Framework Integration:
 * - Uses Logger for structured logging
 * - Uses AuthMiddleware for authentication
 * - Uses AIService for OpenAI integration
 */

const { logger } = require('../core/Logger');
const { requireAuth } = require('../core/AuthMiddleware');
const { interpolateTemplate } = require('../core/AIService');
const OpenAI = require('openai');

// Initialize shared OpenAI client (same as AIService)
let openaiClient = null;

function getOpenAIClient() {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  return openaiClient;
}

/**
 * Register AI streaming routes
 */
async function registerAIStreamRoutes(fastify) {
  
  /**
   * POST /api/ai/stream
   * Stream AI responses in real-time
   */
  fastify.post('/ai/stream', { preHandler: requireAuth }, async (request, reply) => {
    let streamEnabled = true;
    try {
      logger.info('AI stream request received', {
        userId: request.user?.userId,
        tenantId: request.user?.tenantId,
        bodyKeys: Object.keys(request.body || {})
      });

      const {
        model = 'gpt-4o',
        temperature = 0.7,
        maxTokens = 2000,
        systemPrompt,
        userPrompt,
        context = {},
        stream = true
      } = request.body || {};
      streamEnabled = stream;

      // Validate required fields
      if (!systemPrompt || !userPrompt) {
        logger.warn('Missing required fields', { 
          hasSystemPrompt: !!systemPrompt, 
          hasUserPrompt: !!userPrompt 
        });
        return reply.code(400).send({
          success: false,
          error: 'systemPrompt and userPrompt are required'
        });
      }

      // Get OpenAI client
      logger.debug('Getting OpenAI client...');
      const openai = getOpenAIClient();
      logger.debug('OpenAI client obtained');

      // Interpolate templates with context (using AIService utility)
      logger.debug('Interpolating templates...', {
        systemPromptLength: systemPrompt?.length,
        userPromptLength: userPrompt?.length,
        contextKeys: Object.keys(context)
      });
      
      const interpolatedSystemPrompt = interpolateTemplate(systemPrompt, context);
      const interpolatedUserPrompt = interpolateTemplate(userPrompt, context);
      
      logger.debug('Templates interpolated', {
        interpolatedSystemLength: interpolatedSystemPrompt?.length,
        interpolatedUserLength: interpolatedUserPrompt?.length
      });

      logger.info('AI streaming request', {
        model,
        temperature,
        maxTokens,
        userId: request.user.userId,
        tenantId: request.user.tenantId,
        hasContext: Object.keys(context).length > 0
      });

      // Determine if using GPT-5 (Responses API) or GPT-4 (Chat Completions API)
      const isGPT5 = model.startsWith('gpt-5');
      
      // GPT-5 doesn't support streaming yet, so we'll use non-streaming for GPT-5
      if (streamEnabled && !isGPT5) {
        // Set streaming headers
        reply.raw.setHeader('Content-Type', 'text/event-stream');
        reply.raw.setHeader('Cache-Control', 'no-cache');
        reply.raw.setHeader('Connection', 'keep-alive');
        reply.raw.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
        
        // Prevent Fastify from automatically handling the response
        reply.hijack();

        try {
          const streamResponse = await openai.chat.completions.create({
            model,
            messages: [
              { role: 'system', content: interpolatedSystemPrompt },
              { role: 'user', content: interpolatedUserPrompt }
            ],
            temperature,
            max_tokens: maxTokens,
            stream: true
          });

          for await (const chunk of streamResponse) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              reply.raw.write(`data: ${JSON.stringify(chunk)}\n\n`);
            }
          }

          reply.raw.write('data: [DONE]\n\n');
          reply.raw.end();
          
          logger.info('AI streaming completed successfully', {
            userId: request.user.userId,
            tenantId: request.user.tenantId
          });
        } catch (streamError) {
          logger.error('Streaming error', {
            error: streamError.message,
            userId: request.user.userId
          });
          
          reply.raw.write(`data: ${JSON.stringify({ error: streamError.message })}\n\n`);
          reply.raw.end();
        }
        
        return reply;
      } else {
        // Non-streaming response (or GPT-5 which doesn't support streaming)
        let responseContent = '';
        
        if (isGPT5) {
          // Use Responses API for GPT-5
          logger.info('Using GPT-5 Responses API (non-streaming)', {
            model,
            userId: request.user.userId,
            inputLength: interpolatedSystemPrompt.length + interpolatedUserPrompt.length
          });
          
          const inputContent = `${interpolatedSystemPrompt}\n\n${interpolatedUserPrompt}`;
          
          logger.debug('GPT-5 input preview', {
            systemPromptLength: interpolatedSystemPrompt.length,
            userPromptLength: interpolatedUserPrompt.length,
            systemPromptPreview: interpolatedSystemPrompt.substring(0, 200),
            userPromptPreview: interpolatedUserPrompt.substring(0, 200)
          });
          
          const response = await openai.responses.create({
            model,
            input: inputContent,
            max_output_tokens: maxTokens,
            reasoning: { effort: 'high' },
            text: { verbosity: 'high' }
          });
          
          logger.debug('GPT-5 raw response', {
            responseKeys: Object.keys(response),
            status: response.status,
            incompleteDetails: response.incomplete_details,
            outputArray: response.output,
            outputLength: response.output?.length || 0,
            fullResponse: JSON.stringify(response).substring(0, 1000)
          });
          
          // GPT-5 Responses API returns output as an array of objects
          // Each object can be type: "reasoning" or type: "text"
          // We need to extract the text output
          if (response.output && Array.isArray(response.output)) {
            const textOutputs = response.output
              .filter(item => item.type === 'text')
              .map(item => item.text || item.content || '')
              .join('\n\n');
            
            responseContent = textOutputs;
            
            logger.debug('Extracted text from output array', {
              outputItems: response.output.length,
              textItems: response.output.filter(item => item.type === 'text').length,
              extractedLength: textOutputs.length
            });
          }
          
          // Fallback to other possible fields
          if (!responseContent) {
            responseContent = response.output_text || response.text || '';
          }
          
          logger.info('GPT-5 response received', {
            userId: request.user.userId,
            tenantId: request.user.tenantId,
            responseLength: responseContent.length,
            isEmpty: responseContent === '',
            status: response.status,
            incompleteReason: response.incomplete_details?.reason
          });
          
          if (!responseContent) {
            logger.error('GPT-5 returned empty response', {
              status: response.status,
              incompleteDetails: response.incomplete_details,
              output: response.output,
              fullResponse: JSON.stringify(response, null, 2)
            });
          }
        } else {
          // Use Chat Completions API for GPT-4 and other models
          const response = await openai.chat.completions.create({
            model,
            messages: [
              { role: 'system', content: interpolatedSystemPrompt },
              { role: 'user', content: interpolatedUserPrompt }
            ],
            temperature,
            max_tokens: maxTokens
          });
          
          responseContent = response.choices[0]?.message?.content || '';
          
          logger.info('Chat Completions response received', {
            userId: request.user.userId,
            tenantId: request.user.tenantId,
            responseLength: responseContent.length
          });
        }

        return reply.send({
          success: true,
          data: responseContent
        });
      }

    } catch (error) {
      logger.error('AI streaming error', {
        error: error.message,
        stack: error.stack,
        errorDetails: error.response?.data || error,
        userId: request.user?.userId,
        tenantId: request.user?.tenantId
      });

      // If already streaming, can't send JSON error
      if (streamEnabled && reply.raw.headersSent) {
        reply.raw.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        reply.raw.end();
        return reply;
      }

      return reply.code(500).send({
        success: false,
        error: error.message || 'Failed to generate AI response'
      });
    }
  });

  logger.info('AI streaming routes registered');
}

module.exports = registerAIStreamRoutes;
