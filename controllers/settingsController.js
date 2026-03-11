const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const getSettings = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*');
    if (error) throw error;
    const settings = {};
    data.forEach(setting => {
      settings[setting.setting_key] = setting.setting_value;
    });
    res.json(settings);
  } catch (error) {
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
    res.json({ connection_fee: data.setting_value });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const updateConnectionFee = async (req, res) => {
  const { connection_fee } = req.body;
  try {
    const { data, error } = await supabase
      .from('settings')
      .update({ setting_value: connection_fee, updated_at: new Date() })
      .eq('setting_key', 'connection_fee')
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = { getSettings, getConnectionFee, updateConnectionFee };