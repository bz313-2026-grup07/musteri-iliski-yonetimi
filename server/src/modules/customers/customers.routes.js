const express = require('express');
const { ROLES } = require('../../constants');
const { requireAuth, requireRole } = require('../../middleware/auth');
const { validate } = require('../../utils/validate');
const { getPagination } = require('../../utils/query');
const { audit } = require('../../utils/audit');
const { createCustomerSchema, updateCustomerSchema } = require('./customers.schemas');
const customers = require('./customers.service');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const result = await customers.listCustomers(req.query, getPagination(req.query));
  res.json(result);
});

router.get('/:id', async (req, res) => {
  const customer = await customers.getCustomer(Number(req.params.id));
  res.json({ data: customer });
});

router.get('/:id/timeline', async (req, res) => {
  const timeline = await customers.getTimeline(Number(req.params.id));
  res.json({ data: timeline });
});

router.post('/', requireRole(ROLES.SALES), async (req, res) => {
  const input = validate(createCustomerSchema, req.body);
  const customer = await customers.createCustomer(input, req.user.id);
  await audit(req.user.id, 'create', 'customers', customer.id);
  res.status(201).json({ data: customer });
});

router.patch('/:id', requireRole(ROLES.SALES), async (req, res) => {
  const id = Number(req.params.id);
  const input = validate(updateCustomerSchema, req.body);
  const customer = await customers.updateCustomer(id, input);
  await audit(req.user.id, 'update', 'customers', id, { fields: Object.keys(input) });
  res.json({ data: customer });
});

router.delete('/:id', requireRole(ROLES.ADMIN), async (req, res) => {
  const id = Number(req.params.id);
  await customers.deleteCustomer(id);
  await audit(req.user.id, 'delete', 'customers', id);
  res.status(204).end();
});

module.exports = router;
