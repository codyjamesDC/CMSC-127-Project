import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const SQL_DIR    = path.join(__dirname, '..', 'sql');

// ─── POOL (ltomgr — used by all controllers) ──────────────────────────────────
// Before first `npm run dev`, run setup.sql once manually:
//   sudo mariadb < sql/setup.sql
// This creates the `vehiclemanager` DB and the `ltomgr` user.
const pool = mysql.createPool({
  host:               process.env.DB_HOST || 'localhost',
  user:               process.env.DB_USER || 'ltomgr',
  password:           process.env.DB_PASS || 'lto',
  database:           process.env.DB_NAME || 'vehiclemanager',
  multipleStatements: true,   // needed to run multi-statement .sql files
  waitForConnections: true,
  connectionLimit:    10,
});

// ─── HELPER: execute a .sql file ─────────────────────────────────────────────
const runSQLFile = async (conn, filename) => {
  const filepath = path.join(SQL_DIR, filename);
  const sql = fs.readFileSync(filepath, 'utf8');
  await conn.query(sql);
  console.log(`  ✔  ${filename}`);
};

// ─── connectDB ────────────────────────────────────────────────────────────────
// Runs schema.sql (CREATE TABLE IF NOT EXISTS + views) and data.sql (seeds)
// every startup. Safe to re-run because schema uses IF NOT EXISTS.
export const connectDB = async () => {
  const conn = await pool.getConnection();
  try {
    console.log('Initializing database...');
    await runSQLFile(conn, 'schema.sql');
    await runSQLFile(conn, 'data.sql');
    console.log('Database ready.\n');
  } catch (err) {
    console.error('Database initialization failed:', err.message);
    process.exit(1);
  } finally {
    conn.release();
  }
};

export default pool;