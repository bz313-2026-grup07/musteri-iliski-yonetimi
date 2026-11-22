const db = require('../db');

/** İşlem kaydı (KVKK: kim, neyi, ne zaman değiştirdi). Hata olursa ana işlemi bozmaz. */
async function audit(userId, action, entity, entityId, meta) {
  try {
    await db('audit_logs').insert({
      user_id: userId || null,
      action,
      entity,
      entity_id: entityId != null ? String(entityId) : null,
      meta: meta ? JSON.stringify(meta) : null,
    });
  } catch (err) {
    console.error('audit log yazılamadı:', err.message);
  }
}

module.exports = { audit };
