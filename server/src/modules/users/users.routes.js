/** Kullanıcı yönetimi - yalnızca 'yonetim' rolü */
const express = require('express');
const bcrypt = require('bcrypt');
const { z } = require('zod');
const db = require('../../db');
const { validate } = require('../../utils/validate');
const { notFound, badRequest } = require('../../utils/httpError');
const { requireAuth, requireRole } = require('../../middleware/auth');
const { audit } = require('../../utils/audit');

const router = express.Router();
router.use(requireAuth);

const COLUMNS = ['id', 'full_name', 'email', 'role', 'is_active', 'created_at'];
const roleEnum = z.enum(['yonetim', 'satis', 'teknik']);

// GET /api/users  - temsilci seçme listeleri için tüm roller görebilir
router.get('/', async (_req, res) => {
  const users = await db('users').select(COLUMNS).orderBy('full_name');
  res.json({ data: users });
});

const createSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, 'Parola en az 8 karakter olmalı'),
  role: roleEnum,
});

// POST /api/users
router.post('/', requireRole('yonetim'), async (req, res) => {
  const data = validate(createSchema, req.body);
  const [user] = await db('users')
    .insert({
      full_name: data.fullName,
      email: data.email,
      role: data.role,
      password_hash: await bcrypt.hash(data.password, 10),
    })
    .returning(COLUMNS);
  await audit(req.user.id, 'create', 'users', user.id, { role: user.role });
  res.status(201).json({ data: user });
});

const updateSchema = z.object({
  fullName: z.string().trim().min(2).max(120).optional(),
  role: roleEnum.optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(8).optional(),
});

// PATCH /api/users/:id
router.patch('/:id', requireRole('yonetim'), async (req, res) => {
  const id = Number(req.params.id);
  const data = validate(updateSchema, req.body);
  if (id === req.user.id && (data.isActive === false || (data.role && data.role !== 'yonetim'))) {
    throw badRequest('Kendi hesabınızı pasifleştiremez veya yönetim rolünüzü kaldıramazsınız');
  }
  const patch = { updated_at: db.fn.now() };
  if (data.fullName) patch.full_name = data.fullName;
  if (data.role) patch.role = data.role;
  if (data.isActive !== undefined) patch.is_active = data.isActive;
  if (data.password) patch.password_hash = await bcrypt.hash(data.password, 10);

  const [user] = await db('users').where({ id }).update(patch).returning(COLUMNS);
  if (!user) throw notFound('Kullanıcı bulunamadı');
  await audit(req.user.id, 'update', 'users', id, { fields: Object.keys(data) });
  res.json({ data: user });
});

module.exports = router;
