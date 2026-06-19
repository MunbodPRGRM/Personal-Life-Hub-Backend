const express = require('express');
const app = express();

app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/todos', require('./routes/todos'));
app.use('/api/notes', require('./routes/notes'));

// Global error handler
app.use(require('./middlewares/errorHandler'));

module.exports = app;