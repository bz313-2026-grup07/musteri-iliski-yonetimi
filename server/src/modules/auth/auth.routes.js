const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');
const db = require('../../db');
const config = require('../../config');
const { validate } = require('../../utils/validate');
const { unauthorized } = require('../../utils/httpError');
const { requireAuth } = require('../../middleware/auth');
const { audit } = require('../../utils/audit');

const router = express.Router();
const DUMMY_HASH = bcrypt.hashSync('zamanlama-esitleme', 10);

// Kaba kuvvet denemelerine karşı: 15 dakikada IP başına 20 deneme
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: config.env === 'test' ? 1000 : 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Çok fazla giriş denemesi. Lütfen daha sonra tekrar deneyin.' },
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Geçerli bir e-posta girin'),
  password: z.string().min(1, 'Parola zorunlu'),
});

const publicUser = (u) => ({ id: u.id, fullName: u.full_name, email: u.email, role: u.role });

// POST /api/auth/login
router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = validate(loginSchema, req.body);

  const user = await db('users').where({ email }).first();
  // Kullanıcı yoksa da bcrypt çalıştır: yanıt süresinden e-posta varlığı anlaşılmasın
  const ok = await bcrypt.compare(password, user?.password_hash || DUMMY_HASH);
  if (!user || !ok || !user.is_active) throw unauthorized('E-posta veya parola hatalı');

  const token = jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
  await audit(user.id, 'login', 'users', user.id);
  res.json({ token, user: publicUser(user) });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

module.exports = router;
module.exports.publicUser = publicUser;
