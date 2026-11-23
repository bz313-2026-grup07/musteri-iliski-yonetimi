const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config');
const db = require('./db');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(cors({ origin: config.clientOrigin }));
app.use(express.json({ limit: '1mb' }));
if (config.env === 'development') app.use(morgan('dev'));

app.get('/api/health', async (_req, res) => {
  await db.raw('SELECT 1');
  res.json({ status: 'ok' });
});

app.use('/api/auth', require('./modules/auth/auth.routes'));
app.use('/api/users', require('./modules/users/users.routes'));
app.use('/api/customers', require('./modules/customers/customers.routes'));
app.use('/api/tickets', require('./modules/tickets/tickets.routes'));
app.use('/api/dashboard', require('./modules/dashboard/dashboard.routes'));

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
