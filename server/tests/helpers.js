const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db');
const { DEV_PASSWORD } = require('../src/db/seeds/01_users');

/** Şemayı sıfırdan kurar ve 4 demo kullanıcıyı ekler */
async function resetDb() {
  await db.migrate.rollback(undefined, true);
  await db.migrate.latest();
  await db.seed.run({ specific: '01_users.js' });
}

/** Role göre token: 'yonetim' | 'satis' | 'teknik' */
async function tokenFor(role) {
  const email = { yonetim: 'yonetim@rosebud.test', satis: 'satis1@rosebud.test', teknik: 'teknik@rosebud.test' }[role];
  const res = await request(app).post('/api/auth/login').send({ email, password: DEV_PASSWORD });
  if (res.status !== 200) throw new Error(`login başarısız: ${role} ${res.status}`);
  return res.body.token;
}

module.exports = { request, app, db, resetDb, tokenFor };
