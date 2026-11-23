const express = require('express');
const { ROLES } = require('../../constants');
const { requireAuth, requireRole } = require('../../middleware/auth');
const { validate } = require('../../utils/validate');
const { audit } = require('../../utils/audit');
const { createUserSchema, updateUserSchema } = require('./users.schemas');
const users = require('./users.service');

const router = express.Router();
router.use(requireAuth);

// Atama listelerinde kullanıldığı için okuma herkese açık.
router.get('/', async (_req, res) => {
  res.json({ data: await users.listUsers() });
});

router.post('/', requireRole(ROLES.ADMIN), async (req, res) => {
  const input = validate(createUserSchema, req.body);
  const user = await users.createUser(input);
  await audit(req.user.id, 'create', 'users', user.id, { role: user.role });
  res.status(201).json({ data: user });
});

router.patch('/:id', requireRole(ROLES.ADMIN), async (req, res) => {
  const id = Number(req.params.id);
  const input = validate(updateUserSchema, req.body);
  const user = await users.updateUser(id, input, req.user.id);
  await audit(req.user.id, 'update', 'users', id, { fields: Object.keys(input) });
  res.json({ data: user });
});

module.exports = router;
