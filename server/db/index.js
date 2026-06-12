const mysql = require('mysql2/promise');
const { DB } = require('../config');

const pool = mysql.createPool({
  host: DB.host,
  port: DB.port,
  user: DB.user,
  password: DB.password,
  database: DB.database,
  waitForConnections: true,
  connectionLimit: DB.connectionLimit,
  namedPlaceholders: true,
  dateStrings: false,
  charset: 'utf8mb4',
});

async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

async function one(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

async function insert(sql, params = []) {
  const [result] = await pool.execute(sql, params);
  return result.insertId;
}

async function run(sql, params = []) {
  const [result] = await pool.execute(sql, params);
  return result;
}

async function transaction(callback) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

function parseJson(value, fallback = null) {
  if (value == null) return fallback;
  if (Array.isArray(value) || typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function toIso(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return new Date(value).toISOString();
}

module.exports = {
  pool,
  query,
  one,
  insert,
  run,
  transaction,
  parseJson,
  toIso,
};
