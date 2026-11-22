require('dotenv').config({ quiet: true });

const env = process.env.NODE_ENV || 'development';

const config = {
  env,
  port: Number(process.env.PORT) || 4000,
  databaseUrl: env === 'test' ? process.env.DATABASE_URL_TEST : process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  maxUploadMb: Number(process.env.MAX_UPLOAD_MB) || 10,
  integrationApiKey: process.env.INTEGRATION_API_KEY,
};

if (!config.jwtSecret) {
  throw new Error('JWT_SECRET tanımlı değil. server/.env dosyasını oluşturun (bkz. .env.example).');
}
if (!config.databaseUrl) {
  throw new Error('DATABASE_URL tanımlı değil. server/.env dosyasını oluşturun (bkz. .env.example).');
}

module.exports = config;
