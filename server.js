const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const path = require('path');
const app = express();
const logger = require('./logs/logger');
const errorHandler = require('./logs/errorhandler');
const requestLogger = require('./middleWare/requestLogger');

// Initialize Firebase Admin
const admin = require("firebase-admin");
const serviceAccount = require("./ServiceAccountkey.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(requestLogger); // Add request logging middleware

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads', express.static('/imlystudios/uploads'));

// Routes
const loginRoutes = require('./View/Routes');
const ProductTypeRoutes = require('./View/Routes');

// Log the application startup
logger.app.info('Application starting up', {
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT || 3050
});

// Route logging middleware
app.use('/api', (req, res, next) => {
    logger.app.info('API route accessed', {
        path: req.path,
        method: req.method,
        query: req.query,
        body: Object.keys(req.body) // Log only keys for security
    });
    next();
}, loginRoutes);



app.use('/api/ProductType', (req, res, next) => {
    logger.app.info('ProductType route accessed', {
        path: req.path,
        method: req.method
    });
    next();
}, ProductTypeRoutes);

// Default Route
app.get("/api", (req, res) => {
    logger.app.info('Default route accessed');
    res.send('Welcome to ELECTROCART-B2Y');
});

// Error handler must be last
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3050;
app.listen(PORT, () => {
    logger.app.info(`Server started successfully`, {
        port: PORT,
        environment: process.env.NODE_ENV
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error.error('Uncaught Exception:', {
        error: error.message,
        stack: error.stack
    });
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error.error('Unhandled Promise Rejection:', {
        reason: reason,
        stack: reason.stack
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.app.info('SIGTERM received. Performing graceful shutdown...');
    log4js.shutdown(() => {
        process.exit(0);
    });
});