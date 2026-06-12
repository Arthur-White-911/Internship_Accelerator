require('dotenv').config();

function csv(value, fallback = []) {
  if (!value) return fallback;
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

module.exports = {
  PORT: Number(process.env.PORT || 3001),
  JWT_SECRET: process.env.JWT_SECRET || 'change-this-secret-before-deploy',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  FRONTEND_ORIGINS: csv(process.env.FRONTEND_ORIGINS || process.env.FRONTEND_ORIGIN, [
    'http://localhost:5173',
    'http://localhost:4173',
    'http://127.0.0.1:5173',
  ]),
  DB: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'internship_accelerator',
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  },
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY || '',
};
