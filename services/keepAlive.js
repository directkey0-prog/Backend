const cron = require('node-cron');
const { createClient } = require('@supabase/supabase-js');
const https = require('https');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const pingSupabase = async () => {
  try {
    const { error } = await supabase.from('users').select('id').limit(1);
    if (error) throw error;
    console.log('[keep-alive] Supabase ping ok -', new Date().toISOString());
  } catch (err) {
    console.error('[keep-alive] Supabase ping failed:', err.message);
  }
};

const pingServer = () => {
  const url = process.env.BACKEND_URL || 'https://backend-1-7ge2.onrender.com';
  https.get(`${url}/health`, (res) => {
    console.log('[keep-alive] Self-ping ok -', res.statusCode, new Date().toISOString());
  }).on('error', (err) => {
    console.error('[keep-alive] Self-ping failed:', err.message);
  });
};

const start = () => {
  // Every 10 minutes — keeps Supabase active and Render server awake
  cron.schedule('*/10 * * * *', async () => {
    await pingSupabase();
    pingServer();
  });
  console.log('[keep-alive] Cron started — pinging every 10 minutes');
};

module.exports = { start };
