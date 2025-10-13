module.exports = async () => {
  const mongoose = require('mongoose');
  const { logger } = require('./core/Logger');

  // Close winston transports to release handles
  if (logger?.transports) {
    logger.transports.forEach((transport) => {
      if (typeof transport.close === 'function') {
        transport.close();
      }
    });
  }

  // Close mongoose connection if still open
  try {
    if (mongoose.connection && mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  } catch (err) {
    // swallow teardown errors in tests
  }
};
