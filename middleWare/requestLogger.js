const { access: accessLogger } = require('../logs/logger');

const requestLogger = (req, res, next) => {
  const startTime = new Date();
  
  res.on('finish', () => {
    const duration = new Date() - startTime;
    accessLogger.info('Request completed', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userId: req.user?.id || 'anonymous'
    });
  });
  
  next();
};

module.exports = requestLogger;