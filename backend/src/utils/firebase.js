/**
 * Firebase Admin Utility
 * Handles initialization and interaction with Firebase Admin SDK
 * 
 * NOTE: firebase-admin is a soft dependency. If the package is not installed,
 * the server will still start but Firebase features will be disabled.
 */

let admin;
try {
    admin = require('firebase-admin');
} catch (e) {
    console.error('CRITICAL: firebase-admin package is NOT INSTALLED.');
    console.error('Please run: cd backend && npm install firebase-admin');
    admin = null;
}

if (!admin) {
    module.exports = null;
} else {
    const path = require('path');

    // Initialize Firebase Admin
    const initializeFirebase = () => {
        try {
            console.log('--- Firebase Initialization Attempt ---');
            
            if (admin.apps.length === 0) {
                const projectId = process.env.FIREBASE_PROJECT_ID;
                const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
                let privateKey = process.env.FIREBASE_PRIVATE_KEY;

                if (!projectId) console.error('❌ Missing FIREBASE_PROJECT_ID');
                if (!clientEmail) console.error('❌ Missing FIREBASE_CLIENT_EMAIL');
                if (!privateKey) console.error('❌ Missing FIREBASE_PRIVATE_KEY');

                // 1. TRY SERVICE ACCOUNT FILE FIRST (Most Reliable)
                const serviceAccountPath = path.resolve(__dirname, '../../config/firebase-service-account.json');
                console.log(`📂 Attempting to load Firebase JSON from: ${serviceAccountPath}`);
                
                try {
                    const serviceAccount = require(serviceAccountPath);
                    console.log('📄 JSON file found, initializing...');
                    admin.initializeApp({
                        credential: admin.credential.cert(serviceAccount),
                    });
                    console.log('✅ Firebase Admin initialized via Service Account File');
                } catch (fileErr) {
                    console.log(`❌ Service account file error: ${fileErr.message}`);
                    // 2. FALLBACK TO ENV VARIABLES
                    // 2. FALLBACK TO ENV VARIABLES
                    console.log('⚠️ Service account file missing or invalid, trying Env Variables...');
                    
                    if (projectId && clientEmail && privateKey) {
                        try {
                            // ... key cleaning logic ...
                            let rawKey = privateKey
                                .replace(/-----BEGIN PRIVATE KEY-----/g, '')
                                .replace(/-----END PRIVATE KEY-----/g, '')
                                .replace(/\\n/g, '')
                                .replace(/\s+/g, '');
                            
                            let formattedBody = '';
                            for (let i = 0; i < rawKey.length; i += 64) {
                                formattedBody += rawKey.substring(i, i + 64) + '\n';
                            }
                            
                            let finalKey = `-----BEGIN PRIVATE KEY-----\n${formattedBody}-----END PRIVATE KEY-----\n`;

                            admin.initializeApp({
                                credential: admin.credential.cert({
                                    projectId,
                                    clientEmail,
                                    privateKey: finalKey,
                                }),
                            });
                            console.log(`✅ Firebase Admin initialized via Env Variables (Length: ${finalKey.length})`);
                        } catch (envErr) {
                            console.error('❌ Firebase Fallback Error:', envErr.message);
                            return null;
                        }
                    } else {
                        console.error('❌ Firebase Error: No JSON file and missing Env Variables');
                        return null;
                    }
                }
            }
            return admin;
        } catch (error) {
            console.error('❌ General Firebase Admin Error:', error.message);
            return null;
        }
    };

    const firebaseInstance = initializeFirebase();
    module.exports = firebaseInstance;
}
