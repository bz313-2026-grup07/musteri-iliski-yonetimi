const bcrypt = require('bcrypt');
const db = require('../../db');
const { ROLES } = require('../../constants');
const { notFound, badRequest } = require('../../utils/httpError');

const BCRYPT_ROUNDS = 10;
const PUBLIC_COLUMNS = ['id', 'full_name', 'email', 'role', 'is_active', 'created_at'];

function listUsers() {
  return db('users').select(PUBLIC_COLUMNS).orderBy('full_name');
}

async function createUser({ fullName, email, password, role }) {
  const [user] = await db('users')
    .insert({
      full_name: fullName,
      email,
      role,
      password_hash: await bcrypt.hash(password, BCRYPT_ROUNDS),
    })
    .returning(PUBLIC_COLUMNS);
  return user;
}

// Yönetici yanlışlıkla kendini kilitlemesin diye kendi hesabını pasifleştiremez.
function assertNotLockingSelf(targetId, currentUserId, input) {
  if (targetId !== currentUserId) return;
  const deactivating = input.isActive === false;
  const droppingAdmin = input.role && input.role !== ROLES.ADMIN;
  if (deactivating || droppingAdmin) {
    throw badRequest('Kendi hesabınızı pasifleştiremez veya yönetim rolünüzü kaldıramazsınız');
  }
}

async function updateUser(id, input, currentUserId) {
  assertNotLockingSelf(id, currentUserId, input);

  const changes = { updated_at: db.fn.now() };
  if (input.fullName) changes.full_name = input.fullName;
  if (input.role) changes.role = input.role;
  if (input.isActive !== undefined) changes.is_active = input.isActive;
  if (input.password) changes.password_hash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  const [user] = await db('users').where({ id }).update(changes).returning(PUBLIC_COLUMNS);
  if (!user) throw notFound('Kullanıcı bulunamadı');
  return user;
}

module.exports = { listUsers, createUser, updateUser, BCRYPT_ROUNDS };
