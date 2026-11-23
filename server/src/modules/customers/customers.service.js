const db = require('../../db');
const { notFound } = require('../../utils/httpError');
const { paginate, containsPattern } = require('../../utils/query');

const LIST_COLUMNS = [
  'c.id', 'c.source_id', 'c.name', 'c.company', 'c.email', 'c.phone', 'c.city',
  'c.owner_id', 'u.full_name as owner_name', 'c.created_at', 'c.updated_at',
];

const SORT_COLUMNS = {
  name: 'c.name',
  company: 'c.company',
  city: 'c.city',
  created_at: 'c.created_at',
};

const EDITABLE_FIELDS = ['name', 'company', 'email', 'phone', 'city', 'address', 'description'];

function toRow(input) {
  const row = {};
  for (const field of EDITABLE_FIELDS) {
    if (input[field] !== undefined) row[field] = input[field];
  }
  if (input.ownerId !== undefined) row.owner_id = input.ownerId;
  return row;
}

function applySearch(query, text) {
  const pattern = containsPattern(text);
  query.where((where) => where
    .whereILike('c.name', pattern)
    .orWhereILike('c.company', pattern)
    .orWhereILike('c.email', pattern)
    .orWhereILike('c.phone', pattern)
    .orWhere('c.source_id', text));
}

async function listCustomers(filters, pagination) {
  const query = db('customers as c')
    .leftJoin('users as u', 'u.id', 'c.owner_id')
    .select(LIST_COLUMNS);

  const search = filters.q?.trim();
  if (search) applySearch(query, search);
  if (filters.city) query.where('c.city', filters.city);
  if (filters.ownerId) query.where('c.owner_id', Number(filters.ownerId));

  const sortColumn = SORT_COLUMNS[filters.sort] || SORT_COLUMNS.created_at;
  const direction = filters.order === 'asc' ? 'asc' : 'desc';
  query.orderBy(sortColumn, direction).orderBy('c.id', direction);

  return paginate(query, pagination);
}

async function getCustomer(id) {
  const customer = await db('customers as c')
    .leftJoin('users as u', 'u.id', 'c.owner_id')
    .select('c.*', 'u.full_name as owner_name')
    .where('c.id', id)
    .first();
  if (!customer) throw notFound('Müşteri bulunamadı');
  return customer;
}

async function assertCustomerExists(id) {
  const found = await db('customers').where({ id }).first('id');
  if (!found) throw notFound('Müşteri bulunamadı');
}

async function getTimeline(customerId) {
  await assertCustomerExists(customerId);

  const { rows } = await db.raw(`
    SELECT 'interaction' AS type, i.id, i.occurred_at AS at, i.channel AS subtype,
           coalesce(i.outcome, '') AS title, i.note AS body, u.full_name AS user_name
      FROM interactions i
      LEFT JOIN users u ON u.id = i.user_id
     WHERE i.customer_id = :customerId
    UNION ALL
    SELECT 'offer', o.id, o.created_at, o.status, o.title,
           o.amount::text || ' ' || o.currency, u.full_name
      FROM offers o
      LEFT JOIN users u ON u.id = o.user_id
     WHERE o.customer_id = :customerId
    UNION ALL
    SELECT 'ticket', t.id, t.created_at, t.status, t.ticket_no || ' - ' || t.subject,
           t.category, u.full_name
      FROM tickets t
      LEFT JOIN users u ON u.id = t.created_by
     WHERE t.customer_id = :customerId
     ORDER BY at DESC
     LIMIT 200
  `, { customerId });

  return rows;
}

async function createCustomer(input, currentUserId) {
  const row = { owner_id: currentUserId, ...toRow(input) };
  const [customer] = await db('customers').insert(row).returning('*');
  return customer;
}

async function updateCustomer(id, input) {
  const [customer] = await db('customers')
    .where({ id })
    .update({ ...toRow(input), updated_at: db.fn.now() })
    .returning('*');
  if (!customer) throw notFound('Müşteri bulunamadı');
  return customer;
}

async function deleteCustomer(id) {
  const deletedCount = await db('customers').where({ id }).del();
  if (!deletedCount) throw notFound('Müşteri bulunamadı');
}

module.exports = {
  listCustomers,
  getCustomer,
  getTimeline,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
