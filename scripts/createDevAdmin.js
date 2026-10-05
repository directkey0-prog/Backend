/**
 * Run this ONCE to create a permanent developer admin account.
 * From the Backend directory: node scripts/createDevAdmin.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// ── Change these if you want different credentials ──────────────────────────
const DEV_EMAIL    = 'oretomiwa20@gmail.com';
const DEV_PASSWORD = 'DevKey@2026#';
// ────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Creating developer admin account...');

  const hash = await bcrypt.hash(DEV_PASSWORD, 10);

  const { error } = await supabase.from('admins').upsert(
    { email: DEV_EMAIL, password_hash: hash, full_name: 'Developer' },
    { onConflict: 'email' }
  );

  if (error) {
    console.error('Failed:', error.message);
    process.exit(1);
  }

  console.log('');
  console.log('Developer admin created successfully!');
  console.log('  Email   :', DEV_EMAIL);
  console.log('  Password:', DEV_PASSWORD);
  console.log('');
  console.log('Both your login and the admin login now work independently.');
}

main();
