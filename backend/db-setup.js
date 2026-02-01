import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;
const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: 'postgres',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

async function setup() {
    try {
        await client.connect();
        console.log('Connected to postgres database');

        const res = await client.query("SELECT 1 FROM pg_database WHERE datname = 'offline_exam_db'");
        if (res.rowCount === 0) {
            console.log('Creating database offline_exam_db...');
            await client.query('CREATE DATABASE offline_exam_db');
            console.log('Database created successfully');
        } else {
            console.log('Database offline_exam_db already exists');
        }

        await client.end();
        process.exit(0);
    } catch (err) {
        console.error('Setup failed:', err.message);
        process.exit(1);
    }
}

setup();
