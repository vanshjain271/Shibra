const dns = require('dns').promises;
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

async function runCheck() {
    console.log('🔍 GadgetHub Production Server Diagnostic');
    console.log('==========================================');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Node Version:', process.version);
    
    // 1. Check Environment
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        console.error('❌ MONGODB_URI not found in .env');
        process.exit(1);
    }
    console.log('✅ Found MONGODB_URI');

    // 2. DNS Check
    console.log('\n📡 Testing DNS Resolution...');
    const clusterHost = 'cluster0.qjk9tfq.mongodb.net';
    const shards = [
        'ac-weg76pk-shard-00-00.qjk9tfq.mongodb.net',
        'ac-weg76pk-shard-00-01.qjk9tfq.mongodb.net',
        'ac-weg76pk-shard-00-02.qjk9tfq.mongodb.net'
    ];

    try {
        const srv = await dns.resolveSrv(`_mongodb._tcp.${clusterHost}`);
        console.log('✅ Cluster SRV resolved:', srv.length, 'records found');
    } catch (err) {
        console.error('❌ Cluster SRV resolution FAILED:', err.message);
    }

    for (const host of shards) {
        try {
            const addrs = await dns.resolve4(host);
            console.log(`✅ Shard ${host} resolved to:`, addrs.join(', '));
        } catch (err) {
            console.error(`❌ Shard ${host} resolution FAILED:`, err.message);
        }
    }

    // 3. Database Connection Check
    console.log('\n🗄️ Testing Database Connection (Force IPv4)...');
    try {
        await mongoose.connect(mongoUri, { 
            serverSelectionTimeoutMS: 5000,
            family: 4 // Force IPv4
        });
        console.log('✅ Successfully connected to MongoDB');
        
        const count = await mongoose.connection.db.listCollections().toArray();
        console.log('✅ DB is accessible. Collections found:', count.length);
        
        await mongoose.disconnect();
    } catch (err) {
        console.error('❌ Database connection FAILED:', err.message);
        
        console.log('\n🔬 Attempting DIRECT Shard Connection (Bypassing ReplicaSet Discovery)...');
        // Extract shard 0 from URI if possible, or use a default shard 0 from this cluster
        const shard0Uri = mongoUri.replace(/cluster0\.qjk9tfq\.mongodb\.net/, 'ac-weg76pk-shard-00-00.qjk9tfq.mongodb.net:27017');
        try {
            await mongoose.connect(shard0Uri, { 
                serverSelectionTimeoutMS: 5000, 
                family: 4,
                directConnection: true 
            });
            console.log('✅ Direct connection to Shard 0 SUCCEEDED!');
            await mongoose.disconnect();
            console.log('💡 TIP: Discovery is failing but direct access works. This is usually an Atlas SRV issue.');
        } catch (directErr) {
            console.error('❌ Direct connection to Shard 0 also FAILED:', directErr.message);
        }

        if (err.message.includes('authentication failed')) {
            console.log('💡 TIP: Check your username and password in MONGODB_URI.');
        } else if (err.message.includes('timeout')) {
            console.log('💡 TIP: This usually means the AWS IP is NOT whitelisted in Atlas or port 27017 is blocked.');
        }
    }
    
    console.log('\n==========================================');
    console.log('Diagnostic Complete');
}

runCheck();
