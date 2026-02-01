import { query } from './src/config/database.js';

async function checkDb() {
    try {
        const res = await query('SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = \'public\'');
        console.log('Tables found:', res.rows.map(r => r.tablename));
    } catch (err) {
        console.error('Database connection failed or not initialized:', err.message);
    }
}

checkDb();
