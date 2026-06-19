const express = require('express');
const app = express();

app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/todos', require('./routes/todos'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/goals', require('./routes/goals'));

// Global error handler
app.use(require('./middlewares/errorHandler'));

module.exports = app;