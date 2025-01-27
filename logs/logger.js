// logger.js
const log4js = require('log4js');
const path = require('path');

log4js.configure({
  appenders: {
    console: { 
      type: 'console' 
    },
    access: {
      type: 'dateFile',
      filename: path.join(__dirname, 'logs', 'access.log'),
      pattern: '.yyyy-MM-dd',
      compress: true
    },
    app: {
      type: 'dateFile',
      filename: path.join(__dirname, 'logs', 'app.log'),
      pattern: '.yyyy-MM-dd',
      compress: true
    },
    error: {
      type: 'dateFile',
      filename: path.join(__dirname, 'logs', 'error.log'),
      pattern: '.yyyy-MM-dd',
      compress: true
    },
    db: {
      type: 'dateFile',
      filename: path.join(__dirname, 'logs', 'db.log'),
      pattern: '.yyyy-MM-dd',
      compress: true
    }
  },
  categories: {
    default: { appenders: ['console', 'app'], level: 'info' },
    access: { appenders: ['console', 'access'], level: 'info' },
    error: { appenders: ['console', 'error'], level: 'error' },
    db: { appenders: ['console', 'db'], level: 'info' }
  }
});

const logger = {
  access: log4js.getLogger('access'),
  app: log4js.getLogger('default'),
  error: log4js.getLogger('error'),
  db: log4js.getLogger('db')
};

module.exports = logger;