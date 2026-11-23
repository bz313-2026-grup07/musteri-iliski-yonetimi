const db = require('../../db');
const { TIMEZONE, CALL_DIRECTION, TICKET_STATUS, OFFER_STATUS } = require('../../constants');

const RECENT_CALLER_LIMIT = 10;
const { INBOUND, OUTBOUND } = CALL_DIRECTION;

// Gün sınırları İstanbul saatine göre; aksi halde gece yarısına yakın çağrılar yanlış güne düşer.
async function getDayRange(date) {
  const { rows: [range] } = await db.raw(`
    WITH selected AS (
      SELECT COALESCE(?::date, (now() AT TIME ZONE '${TIMEZONE}')::date) AS day
    )
    SELECT day,
           (day::timestamp AT TIME ZONE '${TIMEZONE}')       AS start,
           ((day + 1)::timestamp AT TIME ZONE '${TIMEZONE}') AS end,
           ((day - 1)::timestamp AT TIME ZONE '${TIMEZONE}') AS previous_start
      FROM selected
  `, [date ?? null]);
  return range;
}

async function getCallTotals(range) {
  const { rows: [totals] } = await db.raw(`
    SELECT count(*) FILTER (WHERE direction = :INBOUND)::int  AS incoming,
           count(*) FILTER (WHERE direction = :OUTBOUND)::int AS outgoing,
           coalesce(sum(duration_sec), 0)::int              AS total_duration_sec,
           coalesce(round(avg(duration_sec)), 0)::int       AS avg_duration_sec
      FROM calls
     WHERE call_at >= :start AND call_at < :end
  `, { ...range, INBOUND, OUTBOUND });
  return totals;
}

async function getPreviousDayTotals(range) {
  const { rows: [totals] } = await db.raw(`
    SELECT count(*) FILTER (WHERE direction = :INBOUND)::int  AS incoming,
           count(*) FILTER (WHERE direction = :OUTBOUND)::int AS outgoing
      FROM calls
     WHERE call_at >= :previous_start AND call_at < :start
  `, { ...range, INBOUND, OUTBOUND });
  return totals;
}

async function getHourlyCalls(range) {
  const { rows } = await db.raw(`
    SELECT hour,
           count(c.id) FILTER (WHERE c.direction = :INBOUND)::int  AS incoming,
           count(c.id) FILTER (WHERE c.direction = :OUTBOUND)::int AS outgoing
      FROM generate_series(0, 23) AS hour
      LEFT JOIN calls c
        ON c.call_at >= :start AND c.call_at < :end
       AND extract(hour FROM c.call_at AT TIME ZONE '${TIMEZONE}') = hour
     GROUP BY hour
     ORDER BY hour
  `, { ...range, INBOUND, OUTBOUND });
  return rows;
}

async function getAgentStats(range) {
  const { rows } = await db.raw(`
    SELECT u.id, u.full_name AS name,
           count(*) FILTER (WHERE c.direction = :INBOUND)::int  AS incoming,
           count(*) FILTER (WHERE c.direction = :OUTBOUND)::int AS outgoing,
           coalesce(sum(c.duration_sec), 0)::int              AS duration_sec
      FROM calls c
      JOIN users u ON u.id = c.agent_id
     WHERE c.call_at >= :start AND c.call_at < :end
     GROUP BY u.id, u.full_name
     ORDER BY count(*) DESC, u.full_name
  `, { ...range, INBOUND, OUTBOUND });
  return rows;
}

async function getRecentCallers(range) {
  const { rows } = await db.raw(`
    SELECT cu.id, cu.name, cu.company,
           count(*)::int  AS calls,
           max(c.call_at) AS last_call_at,
           (array_agg(c.direction ORDER BY c.call_at DESC))[1] AS last_direction,
           (array_agg(u.full_name ORDER BY c.call_at DESC))[1] AS last_agent
      FROM calls c
      JOIN customers cu ON cu.id = c.customer_id
      LEFT JOIN users u ON u.id = c.agent_id
     WHERE c.call_at >= :start AND c.call_at < :end
     GROUP BY cu.id, cu.name, cu.company
     ORDER BY max(c.call_at) DESC
     LIMIT :limit
  `, { ...range, limit: RECENT_CALLER_LIMIT });
  return rows;
}

async function getTicketCounts(range) {
  const { rows: [counts] } = await db.raw(`
    SELECT count(*) FILTER (WHERE status = :OPEN)::int    AS open,
           count(*) FILTER (WHERE status = :WAITING)::int AS waiting,
           count(*) FILTER (WHERE created_at >= :start AND created_at < :end)::int AS created_today
      FROM tickets
  `, { ...range, OPEN: TICKET_STATUS.OPEN, WAITING: TICKET_STATUS.WAITING });
  return counts;
}

async function getOfferCounts() {
  const { rows: [counts] } = await db.raw(`
    SELECT count(*) FILTER (WHERE status = :DRAFT)::int AS draft,
           count(*) FILTER (WHERE status = :SENT)::int  AS sent
      FROM offers
  `, { DRAFT: OFFER_STATUS.DRAFT, SENT: OFFER_STATUS.SENT });
  return counts;
}

async function getDailySummary(date) {
  const range = await getDayRange(date);

  const [calls, previous, hourly, agents, recentCallers, tickets, offers] = await Promise.all([
    getCallTotals(range),
    getPreviousDayTotals(range),
    getHourlyCalls(range),
    getAgentStats(range),
    getRecentCallers(range),
    getTicketCounts(range),
    getOfferCounts(),
  ]);

  return { date: range.day, calls, previous, hourly, agents, recentCallers, tickets, offers };
}

module.exports = { getDailySummary };
