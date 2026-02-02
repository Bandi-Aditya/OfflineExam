const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://22x31a6609_db_user:Aditya0331@cluster0.3wtpdc6.mongodb.net/?retryWrites=true&w=majority';

async function listDatabases() {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const dbs = await client.db().admin().listDatabases();
        console.log('Databases found:');
        for (const db of dbs.databases) {
            console.log(' -', db.name);
            // Check if this db has users collection
            const collections = await client.db(db.name).listCollections().toArray();
            const hasUsers = collections.some(c => c.name === 'users');
            if (hasUsers) {
                const count = await client.db(db.name).collection('users').countDocuments();
                console.log('   ^ HAS USERS COLLECTION with', count, 'users!');
            }
        }
    } finally {
        await client.close();
    }
}

listDatabases().catch(console.error);
