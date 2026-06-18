const express = require('express');
const app = express();

app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));

// Global error handler
app.use(require('./middlewares/errorHandler'));

module.exports = app;