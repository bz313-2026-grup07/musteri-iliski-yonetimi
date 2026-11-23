const express = require('express');
const { ROLES } = require('../../constants');
const { requireAuth, requireRole } = require('../../middleware/auth');
const { validate } = require('../../utils/validate');
const { getPagination } = require('../../utils/query');
const { audit } = require('../../utils/audit');
const { listTicketsSchema, createTicketSchema, updateTicketSchema } = require('./tickets.schemas');
const tickets = require('./tickets.service');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const filters = validate(listTicketsSchema, req.query);
  const result = await tickets.listTickets(filters, getPagination(req.query), req.user.id);
  res.json(result);
});

router.get('/:id', async (req, res) => {
  res.json({ data: await tickets.getTicket(req.params.id) });
});

// Satış ekibi de telefonda gelen talebi kaydedebildiği için bilet açmak herkese açık.
router.post('/', async (req, res) => {
  const input = validate(createTicketSchema, req.body);
  const ticket = await tickets.createTicket(input, req.user.id);
  await audit(req.user.id, 'create', 'tickets', ticket.id, { ticket_no: ticket.ticket_no });
  res.status(201).json({ data: ticket });
});

router.patch('/:id', requireRole(ROLES.SUPPORT), async (req, res) => {
  const input = validate(updateTicketSchema, req.body);
  const { ticket, changes } = await tickets.updateTicket(req.params.id, input);
  await audit(req.user.id, 'update', 'tickets', ticket.id, changes);
  res.json({ data: ticket });
});

module.exports = router;
