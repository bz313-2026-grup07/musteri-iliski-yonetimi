/**
 * Geliştirme kullanıcıları. TÜM TABLOLARI TEMİZLER - yalnızca geliştirme/test içindir.
 * Parola (hepsi): Parola123!
 */
const bcrypt = require('bcrypt');

const DEV_PASSWORD = 'Parola123!';

exports.DEV_PASSWORD = DEV_PASSWORD;

exports.seed = async function seed(knex) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Seed üretim ortamında çalıştırılamaz.');
  }

  await knex.raw(`
    TRUNCATE audit_logs, calls, import_errors, import_jobs, attachments, ticket_messages,
             tickets, offers, interactions, customers, users
    RESTART IDENTITY CASCADE
  `);
  await knex.raw('ALTER SEQUENCE ticket_no_seq RESTART WITH 1');

  const hash = await bcrypt.hash(DEV_PASSWORD, 10);
  await knex('users').insert([
    { full_name: 'Yönetici Demo', email: 'yonetim@rosebud.test', password_hash: hash, role: 'yonetim' },
    { full_name: 'Satış Demo 1', email: 'satis1@rosebud.test', password_hash: hash, role: 'satis' },
    { full_name: 'Satış Demo 2', email: 'satis2@rosebud.test', password_hash: hash, role: 'satis' },
    { full_name: 'Teknik Demo', email: 'teknik@rosebud.test', password_hash: hash, role: 'teknik' },
  ]);
};
