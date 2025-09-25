// scripts/setAdmin.cjs
const admin = require('firebase-admin');
const path = require('path');

// Pfad zu deiner Service-Account-JSON
const serviceAccountPath = path.resolve(__dirname, '..', 'sa-keys', 'antjes-ankerplatz-admin.json');
const serviceAccount = require(serviceAccountPath);

// Admin SDK initialisieren
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

async function main() {
  const email = process.argv[2];
  const makeAdmin = (process.argv[3] ?? 'true').toLowerCase() !== 'false';

  if (!email) {
    console.error('Usage: node scripts/setAdmin.cjs <email> [true|false]');
    process.exit(1);
  }

  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, { isAdmin: makeAdmin });
    console.log(`✅ Claims aktualisiert für ${email}: isAdmin=${makeAdmin}`);
    console.log('Hinweis: Nutzer muss sich einmal neu ein- oder aus-/einloggen, damit der Claim im Token landet.');
  } catch (e) {
    console.error('❌ Fehler:', e.message);
    process.exit(2);
  }
}

main();