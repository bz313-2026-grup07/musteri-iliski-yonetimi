const db = require('../db');

// Denetim kaydı yazılamazsa asıl işlem geri alınmamalı; hatayı sadece logluyoruz.
async function audit(userId, action, entity, entityId, meta) {
  try {
    await db('audit_logs').insert({
      user_id: userId ?? null,
      action,
      entity,
      entity_id: entityId == null ? null : String(entityId),
      meta: meta ? JSON.stringify(meta) : null,
    });
  } catch (err) {
    console.error('Audit log yazılamadı:', err.message);
  }
}

module.exports = { audit };
