const { badRequest } = require('./httpError');

/**
 * Zod şemasıyla doğrular, geçerse temizlenmiş veriyi döndürür.
 *   const data = validate(customerSchema, req.body);
 */
function validate(schema, input) {
  const result = schema.safeParse(input);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
    throw badRequest('Doğrulama hatası', details);
  }
  return result.data;
}

/** ?page=2&pageSize=25 -> { page, pageSize, offset } */
function paging(query, { defaultSize = 25, maxSize = 100 } = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const pageSize = Math.min(maxSize, Math.max(1, parseInt(query.pageSize, 10) || defaultSize));
  return { page, pageSize, offset: (page - 1) * pageSize };
}

module.exports = { validate, paging };
