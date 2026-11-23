/**
 * Günün Analizi (Fizibilite 5.1 günlük analiz paneli, 6.2 PoC sorguları).
 * GET /api/dashboard/daily?date=2026-11-23   (varsayılan: bugün, İstanbul saatiyle)
 *
 * Gün sınırları Europe/Istanbul saat dilimine göre hesaplanır; böylece gece yarısına yakın
 * çağrılar yanlış güne düşmez.
 */
const express = require('express');
const { z } = require('zod');
const db = require('../../db');
const { validate } = require('../../utils/validate');
const { requireAuth } = require('../../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const TZ = 'Europe/Istanbul';
const querySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tarih YYYY-AA-GG biçiminde olmalı').optional(),
});

router.get('/daily', async (req, res) => {
  const { date } = validate(querySchema, req.query);

  // Seçilen günün ve bir önceki günün başlangıç/bitişi (timestamptz)
  const { rows: [range] } = await db.raw(`
    WITH d AS (SELECT COALESCE(?::date, (now() AT TIME ZONE '${TZ}')::date) AS day)
    SELECT day,
           (day::timestamp AT TIME ZONE '${TZ}')                       AS start_at,
           ((day + 1)::timestamp AT TIME ZONE '${TZ}')                 AS end_at,
           ((day - 1)::timestamp AT TIME ZONE '${TZ}')                 AS prev_start_at
      FROM d
  `, [date || null]);
  const p = { start: range.start_at, end: range.end_at, prev: range.prev_start_at };

  const [summary, previous, hourly, agents, callers, tickets, offers] = await Promise.all([
    db.raw(`
      SELECT count(*) FILTER (WHERE direction = 'gelen')::int  AS incoming,
             count(*) FILTER (WHERE direction = 'giden')::int  AS outgoing,
             coalesce(sum(duration_sec), 0)::int              AS total_duration_sec,
             coalesce(round(avg(duration_sec)), 0)::int       AS avg_duration_sec
        FROM calls WHERE call_at >= :start AND call_at < :end`, p),
    db.raw(`
      SELECT count(*) FILTER (WHERE direction = 'gelen')::int AS incoming,
             count(*) FILTER (WHERE direction = 'giden')::int AS outgoing
        FROM calls WHERE call_at >= :prev AND call_at < :start`, p),
    db.raw(`
      SELECT h AS hour,
             count(c.id) FILTER (WHERE c.direction = 'gelen')::int AS incoming,
             count(c.id) FILTER (WHERE c.direction = 'giden')::int AS outgoing
        FROM generate_series(0, 23) AS h
        LEFT JOIN calls c
          ON c.call_at >= :start AND c.call_at < :end
         AND extract(hour FROM c.call_at AT TIME ZONE '${TZ}') = h
       GROUP BY h ORDER BY h`, p),
    db.raw(`
      SELECT u.id, u.full_name AS name,
             count(*) FILTER (WHERE c.direction = 'gelen')::int AS incoming,
             count(*) FILTER (WHERE c.direction = 'giden')::int AS outgoing,
             coalesce(sum(c.duration_sec), 0)::int              AS duration_sec
        FROM calls c JOIN users u ON u.id = c.agent_id
       WHERE c.call_at >= :start AND c.call_at < :end
       GROUP BY u.id, u.full_name
       ORDER BY count(*) DESC, u.full_name`, p),
    db.raw(`
      SELECT cu.id, cu.name, cu.company,
             count(*)::int     AS calls,
             max(c.call_at)    AS last_call_at,
             (array_agg(c.direction ORDER BY c.call_at DESC))[1] AS last_direction,
             (array_agg(u.full_name ORDER BY c.call_at DESC))[1] AS last_agent
        FROM calls c
        JOIN customers cu ON cu.id = c.customer_id
        LEFT JOIN users u ON u.id = c.agent_id
       WHERE c.call_at >= :start AND c.call_at < :end
       GROUP BY cu.id, cu.name, cu.company
       ORDER BY max(c.call_at) DESC
       LIMIT 10`, p),
    db.raw(`
      SELECT count(*) FILTER (WHERE status = 'acik')::int              AS open,
             count(*) FILTER (WHERE status = 'cevap_bekleniyor')::int  AS waiting,
             count(*) FILTER (WHERE created_at >= :start AND created_at < :end)::int AS created_today
        FROM tickets`, p),
    db.raw(`
      SELECT count(*) FILTER (WHERE status = 'hazirlandi')::int AS draft,
             count(*) FILTER (WHERE status = 'sunuldu')::int    AS sent
        FROM offers`),
  ]);

  res.json({
    data: {
      date: range.day,
      calls: summary.rows[0],
      previous: previous.rows[0],
      hourly: hourly.rows,
      agents: agents.rows,
      recentCallers: callers.rows,
      tickets: tickets.rows[0],
      offers: offers.rows[0],
    },
  });
});

module.exports = router;
