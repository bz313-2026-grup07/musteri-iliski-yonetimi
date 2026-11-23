const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

function getPagination(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const requested = parseInt(query.pageSize, 10) || DEFAULT_PAGE_SIZE;
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, requested));
  return { page, pageSize, offset: (page - 1) * pageSize };
}

async function paginate(query, { page, pageSize, offset }) {
  const countQuery = query.clone().clearSelect().clearOrder().count('* as count');
  const [[{ count }], data] = await Promise.all([
    countQuery,
    query.limit(pageSize).offset(offset),
  ]);
  return { data, meta: { page, pageSize, total: Number(count) } };
}

function containsPattern(text) {
  const escaped = text.replace(/[%_\\]/g, '\\$&');
  return `%${escaped}%`;
}

module.exports = { getPagination, paginate, containsPattern };
