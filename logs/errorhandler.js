// errorHandler.js
const { error: errorLogger } = require('./logger');

const errorHandler = (err, req, res, next) => {
  errorLogger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
    userId: req.user?.id || 'anonymous'
  });
  
  res.status(err.status || 500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
};

module.exports = errorHandler;
