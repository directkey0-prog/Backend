const { createClient } = require('@supabase/supabase-js');
const log = require('../utils/logger');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const getSettings = async (req, res) => {
  try {
    const { data, error } = await supabase.from('settings').select('*');
    if (error) throw error;
    const settings = {};
    data.forEach(setting => { settings[setting.setting_key] = setting.setting_value; });
    res.json(settings);
  } catch (error) {
    log.error('getSettings', error);
    res.status(400).json({ error: error.message });
  }
};

const getConnectionFee = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('setting_value')
      .eq('setting_key', 'connection_fee')
      .single();
    if (error) throw error;
    res.json({ connection_fee: parseInt(data.setting_value) || 15000 });
  } catch (error) {
    log.error('getConnectionFee', error);
    // Return default if not in DB
    res.json({ connection_fee: 15000 });
  }
};

const updateConnectionFee = async (req, res) => {
  const { connection_fee } = req.body;
  try {
    const { data, error } = await supabaseAdmin
      .from('settings')
      .upsert(
        { setting_key: 'connection_fee', setting_value: String(connection_fee), updated_at: new Date() },
        { onConflict: 'setting_key' }
      )
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    log.error('updateConnectionFee', error);
    res.status(400).json({ error: error.message });
  }
};

module.exports = { getSettings, getConnectionFee, updateConnectionFee };
