const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const JWT_SECRET = process.env.JWT_SECRET || 'directkey-secret-key-2026';

const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  // Try custom JWT first (admin tokens)
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded && decoded.role) {
      req.user = {
        id: decoded.id,
        email: decoded.email,
        user_metadata: { role: decoded.role },
      };
      return next();
    }
  } catch {
    // Not a custom JWT — try Supabase token below
  }

  // Try Supabase session token (landlords)
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) throw error;
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = authMiddleware;
