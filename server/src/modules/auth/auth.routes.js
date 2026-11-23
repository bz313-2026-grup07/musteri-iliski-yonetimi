const express = require('express');
const rateLimit = require('express-rate-limit');
const config = require('../../config');
const { requireAuth } = require('../../middleware/auth');
const { validate } = require('../../utils/validate');
const { audit } = require('../../utils/audit');
const { loginSchema } = require('./auth.schemas');
const auth = require('./auth.service');

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_ATTEMPTS_PER_WINDOW = 20;

const loginLimiter = rateLimit({
  windowMs: LOGIN_WINDOW_MS,
  limit: LOGIN_ATTEMPTS_PER_WINDOW,
  skip: () => config.env === 'test',
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Çok fazla giriş denemesi. Lütfen daha sonra tekrar deneyin.' },
});

const router = express.Router();

router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = validate(loginSchema, req.body);
  const result = await auth.login(email, password);
  await audit(result.user.id, 'login', 'users', result.user.id);
  res.json(result);
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: auth.toPublicUser(req.user) });
});

module.exports = router;
