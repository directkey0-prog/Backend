const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
// Service role client bypasses email confirmation
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const JWT_SECRET = process.env.JWT_SECRET || 'directkey-secret-key-2026';

const signup = async (req, res) => {
  const { email, password, full_name, phone, role } = req.body;
  try {
    let authUser;

    // Try to create the user with email auto-confirmed
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, phone, role: role || 'landlord' },
    });

    if (error) {
      const msg = error.message || '';
      // If user already exists in auth, confirm them and update password
      if (msg.includes('already been registered') || msg.includes('already exists') || error.code === 'email_exists') {
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        authUser = listData?.users?.find(u => u.email === email);
        if (!authUser) throw error;
        await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
          password,
          email_confirm: true,
          user_metadata: { full_name, phone, role: role || 'landlord' },
        });
      } else {
        throw error;
      }
    } else {
      authUser = data.user;
    }

    // Upsert into users table (non-fatal)
    const { error: userError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: authUser.id,
        email,
        full_name,
        phone_number: phone,
        role: role || 'landlord',
      }, { onConflict: 'id' });
    if (userError) console.error('User table upsert error:', userError.message);

    res.status(201).json({ user: authUser });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const syncUserToPublicTable = async (authUser) => {
  const meta = authUser.user_metadata || {};
  const { error } = await supabaseAdmin.from('users').upsert({
    id: authUser.id,
    email: authUser.email,
    full_name: meta.full_name || authUser.email,
    phone_number: meta.phone || null,
    role: meta.role || 'landlord',
  }, { onConflict: 'id' });
  if (error) console.error('[users sync error]', error.message);
};

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    let loginData;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      // Auto-confirm email for users created before confirmation was enforced
      const msg = error.message || '';
      if (msg.includes('Email not confirmed') || error.code === 'email_not_confirmed') {
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        const authUser = listData?.users?.find(u => u.email === email);
        if (authUser) {
          await supabaseAdmin.auth.admin.updateUserById(authUser.id, { email_confirm: true });
          const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({ email, password });
          if (retryError) throw retryError;
          loginData = retryData;
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    } else {
      loginData = data;
    }

    // Ensure user exists in public users table (fixes FK constraint on property creation)
    if (loginData?.user) {
      syncUserToPublicTable(loginData.user).catch(() => {});
    }

    res.json({ user: loginData.user, session: loginData.session });
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

const forgotPassword = async (req, res) => {
  const { email, redirectTo } = req.body;
  const resetUrl = redirectTo || `${process.env.LANDLORD_URL || 'http://localhost:5174'}/reset-password`;
  try {
    // Generate the reset link without Supabase sending any email
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo: resetUrl },
    });
    if (error) throw error;

    const resetLink = data?.properties?.action_link;
    if (!resetLink) throw new Error('Could not generate reset link');

    // Send branded email via dedicated reset Apps Script
    const resetScriptUrl = process.env.GOOGLE_RESET_URL || process.env.GOOGLE_SCRIPT_URL;
    if (resetScriptUrl) {
      const axios = require('axios');
      await axios.post(resetScriptUrl, {
        to_email: email,
        reset_link: resetLink,
      }).catch(() => {});
    }

    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const updateProfile = async (req, res) => {
  const { full_name, phone } = req.body;
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  try {
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: { full_name, phone },
    });
    await supabaseAdmin.from('users').update({ full_name, phone_number: phone }).eq('id', userId);
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const changePassword = async (req, res) => {
  const { current_password, new_password } = req.body;
  const userId = req.user?.id;
  const userEmail = req.user?.email;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  try {
    // Verify current password
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: userEmail, password: current_password });
    if (signInError) return res.status(400).json({ error: 'Current password is incorrect' });
    // Update to new password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, { password: new_password });
    if (updateError) throw updateError;
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const resetPassword = async (req, res) => {
  const { access_token, refresh_token, new_password } = req.body;
  if (!access_token || !refresh_token || !new_password) {
    return res.status(400).json({ error: 'access_token, refresh_token and new_password are required' });
  }
  try {
    const userClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    const { error: sessionError } = await userClient.auth.setSession({ access_token, refresh_token });
    if (sessionError) throw sessionError;
    const { error: updateError } = await userClient.auth.updateUser({ password: new_password });
    if (updateError) throw updateError;
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
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

const refreshToken = async (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) return res.status(400).json({ error: 'refresh_token required' });
  try {
    const { data, error } = await supabase.auth.refreshSession({ refresh_token });
    if (error) throw error;
    res.json({ session: data.session, user: data.user });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};

module.exports = { signup, login, adminLogin, forgotPassword, resetPassword, updateProfile, changePassword, logout, refreshToken };
