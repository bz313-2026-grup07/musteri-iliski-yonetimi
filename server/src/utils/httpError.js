class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const badRequest = (msg = 'Geçersiz istek', details) => new HttpError(400, msg, details);
const unauthorized = (msg = 'Oturum açmanız gerekiyor') => new HttpError(401, msg);
const forbidden = (msg = 'Bu işlem için yetkiniz yok') => new HttpError(403, msg);
const notFound = (msg = 'Kayıt bulunamadı') => new HttpError(404, msg);
const conflict = (msg = 'Kayıt zaten mevcut') => new HttpError(409, msg);

module.exports = { HttpError, badRequest, unauthorized, forbidden, notFound, conflict };
