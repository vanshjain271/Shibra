const admin = require('firebase-admin');
require('dotenv').config({ path: '/Users/vanshjain/Documents/Projects/gadgethubapp/backend/.env' });

const rawKey = process.env.FIREBASE_PRIVATE_KEY;
console.log('Raw Key Length:', rawKey?.length);
console.log('Raw Key Start:', rawKey?.substring(0, 50));
console.log('Contains \\\\n (double backslash)?', rawKey?.includes('\\n'));
console.log('Contains \\n (newline)?', rawKey?.includes('\n'));

const processedKey = rawKey?.replace(/\\n/g, '\n');
console.log('Processed Key Start:', processedKey?.substring(0, 50));

try {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: processedKey,
        }),
    });
    console.log('✅ Initialization success!');
} catch (e) {
    console.error('❌ Initialization failed:', e.message);
}
