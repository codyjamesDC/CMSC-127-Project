import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SQL_DIR = path.join(__dirname, '..', 'sql');

// ─── POOL (ltomgr — used by all controllers) ────────────────────────────────
// Before first `npm run dev`, run setup.sql once manually:
//   sudo mariadb < sql/setup.sql
// This creates the `vehiclemanager` DB and the `ltomgr` user.
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'ltomgr',
  password: process.env.DB_PASS || 'lto',
  database: process.env.DB_NAME || 'vehiclemanager',
  multipleStatements: true,
  waitForConnections: true,
  connectionLimit: 10,
});

// ─── HELPER: execute a .sql file ────────────────────────────────────────────
const runSQLFile = async (conn, filename) => {
  const filepath = path.join(SQL_DIR, filename);
  const sql = fs.readFileSync(filepath, 'utf8');

  await conn.query(sql);
  console.log(`  ✔ ${filename}`);
};

// ─── connectDB ──────────────────────────────────────────────────────────────
// Ensures schema exists, seeds if empty, then recreates views.
export const connectDB = async () => {
  const conn = await pool.getConnection();

  try {
    console.log('Checking database status...');

    // Always ensure tables exist first
    console.log('Ensuring schema...');
    await runSQLFile(conn, 'schema.sql');

    // Seed only if driver table is empty
    const [rows] = await conn.query(
      'SELECT COUNT(*) AS count FROM driver'
    );

    if (rows[0].count === 0) {
      console.log('Seeding initial data...');
      await runSQLFile(conn, 'data.sql');
      console.log('Database seeded.\n');
    } else {
      console.log('Database already contains data. Skipping seed.\n');
    }

    // Always recreate/update views
    console.log('Ensuring report views...');
    await runSQLFile(conn, 'views.sql');
    console.log('Report views ensured.\n');

  } catch (err) {
    console.error('Database initialization failed:', err.message);
    process.exit(1);
  } finally {
    conn.release();
  }
};

export default pool;