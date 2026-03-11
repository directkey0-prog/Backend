const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Public: Subscribe to newsletter
const subscribe = async (req, res) => {
  const { email } = req.body;
  try {
    // Check if already subscribed
    const { data: existing } = await supabase
      .from('newsletter_subscribers')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return res.json({ status: true, message: 'Already subscribed!' });
    }

    const { error } = await supabase
      .from('newsletter_subscribers')
      .insert({ email, is_active: true });
    if (error) throw error;
    res.json({ status: true, message: 'Subscribed successfully!' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Admin: Get all subscribers
const getSubscribers = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .order('subscribed_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Admin: Remove subscriber
const removeSubscriber = async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase
      .from('newsletter_subscribers')
      .delete()
      .eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = { subscribe, getSubscribers, removeSubscriber };
