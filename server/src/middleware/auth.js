const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../db');
const { ROLES } = require('../constants');
const { unauthorized, forbidden } = require('../utils/httpError');

function readBearerToken(req) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  return scheme === 'Bearer' ? token : null;
}

async function requireAuth(req, _res, next) {
  const token = readBearerToken(req);
  if (!token) throw unauthorized();

  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch {
    throw unauthorized('Oturum süresi dolmuş veya geçersiz');
  }

  // Token hâlâ geçerli olsa bile pasifleştirilmiş kullanıcı içeri girmemeli.
  const user = await db('users')
    .select('id', 'full_name', 'email', 'role', 'is_active')
    .where({ id: payload.sub })
    .first();
  if (!user?.is_active) throw unauthorized('Kullanıcı bulunamadı veya pasif');

  req.user = user;
  next();
}

function requireRole(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) throw unauthorized();
    const isAllowed = req.user.role === ROLES.ADMIN || allowedRoles.includes(req.user.role);
    if (!isAllowed) throw forbidden();
    next();
  };
}

function requireApiKey(req, _res, next) {
  const key = req.headers['x-api-key'];
  if (!config.integrationApiKey || key !== config.integrationApiKey) {
    throw unauthorized('Geçersiz API anahtarı');
  }
  next();
}

module.exports = { requireAuth, requireRole, requireApiKey };
