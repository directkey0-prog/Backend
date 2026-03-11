const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const JWT_SECRET = process.env.JWT_SECRET || 'directkey-secret-key-2026';

const signup = async (req, res) => {
  const { email, password, full_name, phone, role } = req.body;
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name, phone, role: role || 'landlord' }
      }
    });
    if (error) throw error;

    // Also insert into users table
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: data.user.id,
        email,
        full_name,
        phone_number: phone,
        role: role || 'landlord',
      });
    if (userError) console.error('User table insert error:', userError);

    res.status(201).json({ user: data.user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    res.json({ user: data.user, session: data.session });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const adminLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Look up admin in the admins table
    const { data: admin, error } = await supabase
      .from('admins')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !admin) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, admin.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      admin: {
        id: admin.id,
        email: admin.email,
        full_name: admin.full_name,
        role: 'admin',
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const logout = async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    res.json({ message: 'Logged out' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = { signup, login, adminLogin, logout };
