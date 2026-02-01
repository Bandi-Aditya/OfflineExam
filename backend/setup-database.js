import { initializeDatabase, seedDatabase } from './src/scripts/init-database.js';
import pool from './src/config/database.js';

/**
 * Main function to setup database
 */
async function setup() {
    try {
        console.log('🔧 Starting database setup...\n');

        // Initialize database schema
        await initializeDatabase();
        console.log('');

        // Seed initial data
        await seedDatabase();
        console.log('');

        console.log('✅ Database setup completed successfully!');
        console.log('');
        console.log('📝 Login Credentials:');
        console.log('   Admin:');
        console.log('     Student ID: ADMIN001');
        console.log('     Password: admin123');
        console.log('');
        console.log('   Sample Students:');
        console.log('     Student IDs: STU001, STU002, STU003, STU004, STU005');
        console.log('     Password: student123');
        console.log('');

        process.exit(0);
    } catch (error) {
        console.error('❌ Database setup failed:', error);
        process.exit(1);
    }
}

setup();
