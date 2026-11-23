const db = require('../../db');
const { TIMEZONE, TICKET_STATUS } = require('../../constants');
const { notFound, badRequest } = require('../../utils/httpError');
const { paginate, containsPattern } = require('../../utils/query');

const TICKET_NO_PATTERN = /^TKT-\d+$/i;

function ticketQuery() {
  return db('tickets as t')
    .join('customers as c', 'c.id', 't.customer_id')
    .leftJoin('users as creator', 'creator.id', 't.created_by')
    .leftJoin('users as assignee', 'assignee.id', 't.assigned_to')
    .select(
      't.id', 't.ticket_no', 't.subject', 't.category', 't.status',
      't.customer_id', 'c.name as customer_name', 'c.company as customer_company',
      't.created_by', 'creator.full_name as created_by_name',
      't.assigned_to', 'assignee.full_name as assigned_to_name',
      't.created_at', 't.updated_at', 't.closed_at',
      db.raw('(SELECT count(*)::int FROM ticket_messages m WHERE m.ticket_id = t.id) AS message_count'),
      db.raw('(SELECT max(m.created_at) FROM ticket_messages m WHERE m.ticket_id = t.id) AS last_message_at'),
    );
}

async function getTicket(idOrNumber) {
  const query = ticketQuery();
  if (TICKET_NO_PATTERN.test(idOrNumber)) {
    query.where('t.ticket_no', idOrNumber.toUpperCase());
  } else {
    query.where('t.id', Number(idOrNumber));
  }
  const ticket = await query.first();
  if (!ticket) throw notFound('Bilet bulunamadı');
  return ticket;
}

function applyFilters(query, filters, currentUserId) {
  if (filters.q) {
    const pattern = containsPattern(filters.q);
    query.where((w) => w.whereILike('t.ticket_no', pattern).orWhereILike('t.subject', pattern));
  }
  if (filters.customer) {
    const pattern = containsPattern(filters.customer);
    query.where((w) => w.whereILike('c.name', pattern).orWhereILike('c.company', pattern));
  }
  if (filters.user) {
    const pattern = containsPattern(filters.user);
    query.where((w) => w.whereILike('creator.full_name', pattern).orWhereILike('assignee.full_name', pattern));
  }
  if (filters.customerId) query.where('t.customer_id', filters.customerId);
  if (filters.status) query.whereIn('t.status', filters.status);
  if (filters.category) query.where('t.category', filters.category);

  if (filters.assignedTo === 'me') query.where('t.assigned_to', currentUserId);
  else if (filters.assignedTo === 'none') query.whereNull('t.assigned_to');
  else if (filters.assignedTo) query.where('t.assigned_to', filters.assignedTo);

  // Tarihler İstanbul gününe göre yorumlanır; iki uç da dahil.
  if (filters.from) {
    query.whereRaw(`t.created_at >= (?::date)::timestamp AT TIME ZONE '${TIMEZONE}'`, [filters.from]);
  }
  if (filters.to) {
    query.whereRaw(`t.created_at < ((?::date) + 1)::timestamp AT TIME ZONE '${TIMEZONE}'`, [filters.to]);
  }
}

function listTickets(filters, pagination, currentUserId) {
  const query = ticketQuery();
  applyFilters(query, filters, currentUserId);
  query.orderBy('t.created_at', 'desc').orderBy('t.id', 'desc');
  return paginate(query, pagination);
}

async function assertCustomerExists(customerId) {
  const found = await db('customers').where({ id: customerId }).first('id');
  if (!found) throw badRequest('Müşteri bulunamadı');
}

async function assertAssignable(userId) {
  if (userId == null) return;
  const found = await db('users').where({ id: userId, is_active: true }).first('id');
  if (!found) throw badRequest('Atanacak kullanıcı bulunamadı veya pasif');
}

async function createTicket(input, currentUserId) {
  await assertCustomerExists(input.customerId);
  await assertAssignable(input.assignedTo);

  const ticketId = await db.transaction(async (trx) => {
    const [{ id }] = await trx('tickets')
      .insert({
        customer_id: input.customerId,
        subject: input.subject,
        category: input.category,
        created_by: currentUserId,
        assigned_to: input.assignedTo ?? null,
      })
      .returning('id');

    if (input.description) {
      await trx('ticket_messages').insert({ ticket_id: id, user_id: currentUserId, body: input.description });
    }
    return id;
  });

  return getTicket(String(ticketId));
}

const TRACKED_FIELDS = { subject: 'subject', category: 'category', status: 'status', assignedTo: 'assigned_to' };

function diff(before, after) {
  const changes = {};
  for (const [field, column] of Object.entries(TRACKED_FIELDS)) {
    if (before[column] !== after[column]) changes[field] = { from: before[column], to: after[column] };
  }
  return changes;
}

function buildUpdate(current, input) {
  const update = { updated_at: db.fn.now() };
  if (input.subject !== undefined) update.subject = input.subject;
  if (input.category !== undefined) update.category = input.category;
  if (input.assignedTo !== undefined) update.assigned_to = input.assignedTo;

  if (input.status !== undefined && input.status !== current.status) {
    update.status = input.status;
    update.closed_at = input.status === TICKET_STATUS.DONE ? db.fn.now() : null;
  }
  return update;
}

async function updateTicket(idOrNumber, input) {
  const current = await getTicket(idOrNumber);
  await assertAssignable(input.assignedTo);

  await db('tickets').where({ id: current.id }).update(buildUpdate(current, input));
  const updated = await getTicket(String(current.id));

  return { ticket: updated, changes: diff(current, updated) };
}

module.exports = { listTickets, getTicket, createTicket, updateTicket };
