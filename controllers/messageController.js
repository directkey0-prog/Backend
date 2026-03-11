const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Public: Submit a contact message
const submitMessage = async (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({ name, email, phone, subject, message, is_read: false })
      .select()
      .single();
    if (error) throw error;
    res.json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Admin: Get all messages
const getMessages = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Admin: Mark message as read
const markAsRead = async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Admin: Delete message
const deleteMessage = async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = { submitMessage, getMessages, markAsRead, deleteMessage };
