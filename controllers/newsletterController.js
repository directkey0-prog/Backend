const { createClient } = require('@supabase/supabase-js');
const log = require('../utils/logger');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Public: Subscribe to newsletter
const subscribe = async (req, res) => {
  const { email } = req.body;
  try {
    const { error } = await supabase
      .from('newsletter_subscribers')
      .upsert({ email, is_active: true }, { onConflict: 'email' });
    if (error) throw error;
    res.json({ status: true, message: 'Subscribed successfully!' });
  } catch (error) {
    log.error('subscribe', error);
    res.status(400).json({ error: error.message });
  }
};

// Admin: Get all subscribers
const getSubscribers = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('newsletter_subscribers')
      .select('*')
      .order('subscribed_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    log.error('getSubscribers', error);
    res.status(400).json({ error: error.message });
  }
};

// Admin: Remove subscriber
const removeSubscriber = async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabaseAdmin
      .from('newsletter_subscribers')
      .delete()
      .eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    log.error('removeSubscriber', error);
    res.status(400).json({ error: error.message });
  }
};

module.exports = { subscribe, getSubscribers, removeSubscriber };
