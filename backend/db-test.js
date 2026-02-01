import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectionTimeoutMillis: 5000,
});

console.log('Testing connection to:', process.env.DB_HOST, process.env.DB_NAME);

async function test() {
    try {
        const client = await pool.connect();
        console.log('Connection successful!');
        const res = await client.query('SELECT NOW()');
        console.log('Time from DB:', res.rows[0]);
        client.release();
        process.exit(0);
    } catch (err) {
        console.error('Connection failed structure/message:', err.message);
        console.error('Full error:', err);
        process.exit(1);
    }
}

test();
