const config = require('../config');
const { HttpError } = require('../utils/httpError');

// Postgres hata kodları -> anlaşılır yanıt
const PG_ERRORS = {
  23505: [409, 'Bu değer zaten kayıtlı (benzersiz alan)'],
  23503: [400, 'İlişkili kayıt bulunamadı'],
  23514: [400, 'Geçersiz değer (izin verilen seçeneklerden biri değil)'],
  '22P02': [400, 'Geçersiz veri biçimi'],
};

function notFoundHandler(req, res) {
  res.status(404).json({ error: `Endpoint bulunamadı: ${req.method} ${req.originalUrl}` });
}

function errorHandler(err, req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }
  if (err.code && PG_ERRORS[err.code]) {
    const [status, message] = PG_ERRORS[err.code];
    return res.status(status).json({ error: message, details: config.env !== 'production' ? err.detail : undefined });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Geçersiz JSON' });
  }
  if (err.name === 'MulterError') {
    return res.status(400).json({ error: `Dosya yükleme hatası: ${err.message}` });
  }

  console.error(err);
  return res.status(500).json({
    error: 'Sunucu hatası',
    details: config.env !== 'production' ? err.message : undefined,
  });
}

module.exports = { notFoundHandler, errorHandler };
