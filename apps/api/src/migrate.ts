import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
const sql = await readFile(fileURLToPath(new URL('../sql/001_init.sql', import.meta.url)), 'utf8');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
await pool.query(sql);
await pool.end();
console.log('Database migration complete.');
