// scripts/setAdmin.cjs
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

function parseServiceAccountFromEnv(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    // optional base64 support
    const decoded = Buffer.from(raw, 'base64').toString('utf8');
    return JSON.parse(decoded);
  }
}

function loadServiceAccount() {
  const fromJsonEnv = parseServiceAccountFromEnv(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  if (fromJsonEnv) return fromJsonEnv;

  const explicitPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const fallbackPath = path.resolve(__dirname, '..', 'sa-keys', 'antjes-ankerplatz-admin.json');
  const serviceAccountPath = explicitPath ? path.resolve(explicitPath) : fallbackPath;

  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error(
      'Service-Account fehlt. Setze FIREBASE_SERVICE_ACCOUNT_JSON oder FIREBASE_SERVICE_ACCOUNT_PATH/GOOGLE_APPLICATION_CREDENTIALS.'
    );
  }

  return require(serviceAccountPath);
}

const serviceAccount = loadServiceAccount();

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
