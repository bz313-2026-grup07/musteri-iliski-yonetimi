/**
 * Müşteri modülü - REFERANS MODÜL
 * Yeni modül yazarken (tickets, offers, interactions...) bu dosyanın yapısını kopyalayın:
 *   1) zod şeması  2) requireAuth + requireRole  3) validate()  4) audit()  5) { data, meta } yanıtı
 *
 * Yetki: tüm roller okuyabilir; satis + yonetim ekler/günceller; yalnızca yonetim siler.
 */
const express = require('express');
const { z } = require('zod');
const db = require('../../db');
const { validate, paging } = require('../../utils/validate');
const { notFound } = require('../../utils/httpError');
const { requireAuth, requireRole } = require('../../middleware/auth');
const { audit } = require('../../utils/audit');

const router = express.Router();
router.use(requireAuth);

const optionalText = (max) => z.string().trim().max(max).optional().nullable().transform((v) => (v === '' ? null : v));

const customerSchema = z.object({
  name: z.string().trim().min(2, 'Ad/unvan en az 2 karakter').max(160),
  company: optionalText(200),
  email: z.union([z.string().trim().toLowerCase().email('Geçerli e-posta girin'), z.literal(''), z.null()]).optional()
    .transform((v) => (v === '' ? null : v)),
  phone: optionalText(40),
  city: optionalText(80),
  address: optionalText(2000),
  description: optionalText(5000),
  ownerId: z.number().int().positive().optional().nullable(),
});

const toRow = (d) => {
  const row = {};
  for (const k of ['name', 'company', 'email', 'phone', 'city', 'address', 'description']) {
    if (d[k] !== undefined) row[k] = d[k];
  }
  if (d.ownerId !== undefined) row.owner_id = d.ownerId;
  return row;
};

const SORTABLE = { name: 'c.name', created_at: 'c.created_at', city: 'c.city', company: 'c.company' };

// GET /api/customers?q=ahmet&city=Kayseri&page=1&pageSize=25&sort=name&order=asc
router.get('/', async (req, res) => {
  const { page, pageSize, offset } = paging(req.query);
  const q = (req.query.q || '').trim();
  const sortCol = SORTABLE[req.query.sort] || 'c.created_at';
  const order = req.query.order === 'asc' ? 'asc' : 'desc';

  const base = db('customers as c').leftJoin('users as u', 'u.id', 'c.owner_id');
  if (q) {
    // pg_trgm GIN indeksleri sayesinde ILIKE '%...%' 16.000 kayıtta hızlıdır
    const like = `%${q.replace(/[%_\\]/g, '\\$&')}%`;
    base.where((w) => w
      .whereILike('c.name', like)
      .orWhereILike('c.company', like)
      .orWhereILike('c.email', like)
      .orWhereILike('c.phone', like)
      .orWhere('c.source_id', q));
  }
  if (req.query.city) base.where('c.city', req.query.city);
  if (req.query.ownerId) base.where('c.owner_id', Number(req.query.ownerId));

  const [{ count }] = await base.clone().count('* as count');
  const data = await base
    .select('c.id', 'c.source_id', 'c.name', 'c.company', 'c.email', 'c.phone', 'c.city', 'c.owner_id',
      'u.full_name as owner_name', 'c.created_at', 'c.updated_at')
    .orderBy(sortCol, order)
    .orderBy('c.id', order)
    .limit(pageSize)
    .offset(offset);

  res.json({ data, meta: { page, pageSize, total: Number(count) } });
});

// GET /api/customers/:id  - müşteri kartı
router.get('/:id', async (req, res) => {
  const customer = await db('customers as c')
    .leftJoin('users as u', 'u.id', 'c.owner_id')
    .select('c.*', 'u.full_name as owner_name')
    .where('c.id', Number(req.params.id))
    .first();
  if (!customer) throw notFound('Müşteri bulunamadı');
  res.json({ data: customer });
});

// GET /api/customers/:id/timeline - görüşme, teklif ve biletler tarih sırasıyla (Fizibilite 5.1)
router.get('/:id/timeline', async (req, res) => {
  const id = Number(req.params.id);
  const exists = await db('customers').where({ id }).first('id');
  if (!exists) throw notFound('Müşteri bulunamadı');

  const { rows } = await db.raw(`
    SELECT 'interaction' AS type, i.id, i.occurred_at AS at, i.channel AS subtype,
           coalesce(i.outcome, '') AS title, i.note AS body, u.full_name AS user_name
      FROM interactions i LEFT JOIN users u ON u.id = i.user_id WHERE i.customer_id = :id
    UNION ALL
    SELECT 'offer', o.id, o.created_at, o.status, o.title,
           o.amount::text || ' ' || o.currency, u.full_name
      FROM offers o LEFT JOIN users u ON u.id = o.user_id WHERE o.customer_id = :id
    UNION ALL
    SELECT 'ticket', t.id, t.created_at, t.status, t.ticket_no || ' - ' || t.subject,
           t.category, u.full_name
      FROM tickets t LEFT JOIN users u ON u.id = t.created_by WHERE t.customer_id = :id
    ORDER BY at DESC
    LIMIT 200
  `, { id });

  res.json({ data: rows });
});

// POST /api/customers
router.post('/', requireRole('satis'), async (req, res) => {
  const data = validate(customerSchema, req.body);
  const row = toRow(data);
  if (row.owner_id === undefined) row.owner_id = req.user.id;
  const [customer] = await db('customers').insert(row).returning('*');
  await audit(req.user.id, 'create', 'customers', customer.id);
  res.status(201).json({ data: customer });
});

// PATCH /api/customers/:id
router.patch('/:id', requireRole('satis'), async (req, res) => {
  const id = Number(req.params.id);
  const data = validate(customerSchema.partial(), req.body);
  const [customer] = await db('customers')
    .where({ id })
    .update({ ...toRow(data), updated_at: db.fn.now() })
    .returning('*');
  if (!customer) throw notFound('Müşteri bulunamadı');
  await audit(req.user.id, 'update', 'customers', id, { fields: Object.keys(data) });
  res.json({ data: customer });
});

// DELETE /api/customers/:id
router.delete('/:id', requireRole('yonetim'), async (req, res) => {
  const id = Number(req.params.id);
  const deleted = await db('customers').where({ id }).del();
  if (!deleted) throw notFound('Müşteri bulunamadı');
  await audit(req.user.id, 'delete', 'customers', id);
  res.status(204).end();
});

module.exports = router;
