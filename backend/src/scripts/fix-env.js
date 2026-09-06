const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../../.env');

// 🔒 CLEANED: Hardcoded credentials removed for security.
// Use the placeholder below or provide the URI via environment.
const robustUri = "MONGODB_URI=mongodb://app_user:<PASSWORD>@ac-weg76pk-shard-00-00.qjk9tfq.mongodb.net:27017,ac-weg76pk-shard-00-01.qjk9tfq.mongodb.net:27017,ac-weg76pk-shard-00-02.qjk9tfq.mongodb.net:27017/gadgethub?replicaSet=atlas-qjk9tf-shard-0&authSource=admin&tls=true";

console.log('🛠️ GadgetHub Environment Fix Tool');
console.log('================================');

try {
    if (!fs.existsSync(envPath)) {
        console.error('❌ Error: .env file not found at', envPath);
        process.exit(1);
    }

    let envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    let updated = false;

    const newLines = lines.map(line => {
        if (line.trim().startsWith('MONGODB_URI=')) {
            console.log('✅ Found existing MONGODB_URI line.');
            updated = true;
            return robustUri;
        }
        return line;
    });

    if (!updated) {
        console.log('⚠️ MONGODB_URI line not found. Adding it to the end of file.');
        newLines.push(robustUri);
    }

    fs.writeFileSync(envPath, newLines.join('\n'));
    console.log('🚀 Successfully updated .env with robust connection string.');
    console.log('\n--- NEXT STEPS ---');
    console.log('1. pm2 restart gadgethub-api');
    console.log('2. Refresh your admin panel!');
    console.log('------------------');

} catch (err) {
    console.error('❌ Critical Error:', err.message);
}
