const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../../config');
const db = require('../../db');
const { unauthorized } = require('../../utils/httpError');
const { BCRYPT_ROUNDS } = require('../users/users.service');

// Kullanıcı yokken de bcrypt çalışsın; aksi halde yanıt süresinden e-postanın kayıtlı olup olmadığı anlaşılır.
const TIMING_DUMMY_HASH = bcrypt.hashSync('timing-dummy', BCRYPT_ROUNDS);

function toPublicUser(user) {
  return { id: user.id, fullName: user.full_name, email: user.email, role: user.role };
}

async function login(email, password) {
  const user = await db('users').where({ email }).first();
  const passwordMatches = await bcrypt.compare(password, user?.password_hash ?? TIMING_DUMMY_HASH);
  if (!user || !passwordMatches || !user.is_active) {
    throw unauthorized('E-posta veya parola hatalı');
  }

  const token = jwt.sign(
    { sub: user.id, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn },
  );
  return { token, user: toPublicUser(user) };
}

module.exports = { login, toPublicUser };
