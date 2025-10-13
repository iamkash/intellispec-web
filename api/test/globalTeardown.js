const mongoose = require('mongoose');

module.exports = async () => {
  try {
    const { logger } = require('../core/Logger');
    for (const transport of logger.transports || []) {
      if (typeof transport.close === 'function') {
        transport.close();
      }
    }
  } catch (error) {
    // ignore logger teardown issues in tests
  }

  try {
    if (mongoose.connection?.readyState === 1) {
      await mongoose.disconnect();
    }
  } catch (err) {
    // swallow teardown errors in tests
  }
};
