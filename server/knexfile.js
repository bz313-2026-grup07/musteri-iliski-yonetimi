const config = require('./src/config');

const base = {
  client: 'pg',
  connection: config.databaseUrl,
  migrations: { directory: './src/db/migrations' },
  seeds: { directory: './src/db/seeds' },
  pool: { min: 0, max: 10 },
};

module.exports = {
  development: base,
  test: base,
  production: base,
};
