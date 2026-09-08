import pg from 'pg';
import { buildApp } from './app.js';
import { MemoryStore, PostgresStore } from './store.js';

const store = process.env.DATABASE_URL ? new PostgresStore(new pg.Pool({ connectionString: process.env.DATABASE_URL })) : new MemoryStore();
//存在DATABASE_URL：使用PostgreSQL 
//不存在DATABASE_URL：使用MemoryStore
const app = await buildApp(store);
await app.listen({ port: Number(process.env.PORT ?? 3001), host: '0.0.0.0' });
