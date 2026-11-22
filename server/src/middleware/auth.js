const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../db');
const { unauthorized, forbidden } = require('../utils/httpError');

const ROLES = Object.freeze({ YONETIM: 'yonetim', SATIS: 'satis', TEKNIK: 'teknik' });

/**
 * Authorization: Bearer <token> başlığını doğrular, req.user'ı doldurur.
 * Kullanıcı pasifleştirildiyse token geçerli olsa bile reddeder.
 */
async function requireAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) throw unauthorized();

  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch {
    throw unauthorized('Oturum süresi dolmuş veya geçersiz');
  }

  const user = await db('users')
    .select('id', 'full_name', 'email', 'role', 'is_active')
    .where({ id: payload.sub })
    .first();
  if (!user || !user.is_active) throw unauthorized('Kullanıcı bulunamadı veya pasif');

  req.user = user;
  next();
}

/**
 * Rol kontrolü. 'yonetim' her zaman geçer.
 *   router.post('/', requireRole('satis'), handler)
 *   router.get('/', requireRole('satis', 'teknik'), handler)
 */
function requireRole(...allowed) {
  return (req, _res, next) => {
    if (!req.user) throw unauthorized();
    if (req.user.role === ROLES.YONETIM || allowed.includes(req.user.role)) return next();
    throw forbidden();
  };
}

/** Eski platformdan sürekli aktarım için: X-API-Key başlığı */
function requireApiKey(req, _res, next) {
  const key = req.headers['x-api-key'];
  if (!config.integrationApiKey || key !== config.integrationApiKey) throw unauthorized('Geçersiz API anahtarı');
  next();
}

module.exports = { requireAuth, requireRole, requireApiKey, ROLES };
