const express = require('express');
const cors = require('cors');
const multer = require('multer');
const authRoutes = require('./routes/authRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const adminRoutes = require('./routes/adminRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const locationRoutes = require('./routes/locationRoutes');
const testimonialRoutes = require('./routes/testimonialRoutes');
const messageRoutes = require('./routes/messageRoutes');
const newsletterRoutes = require('./routes/newsletterRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();

// ── CORS ───────────────────────────────────────────────────────────────────
// Localhost origins always allowed; add production origins via .env
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'https://directkey.ng',
  'https://www.directkey.ng',
  'https://landlord.directkey.ng',
  'https://www.landlord.directkey.ng',
  'https://admin.directkey.ng',
  'https://www.admin.directkey.ng',
  process.env.FRONTEND_URL,
  process.env.LANDLORD_URL,
  process.env.ADMIN_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    // Allow any Vercel preview/production deployment
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// File upload middleware
const upload = multer({ storage: multer.memoryStorage() });
app.use('/api/properties/upload-images', upload.array('images', 10));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/upload', uploadRoutes);

module.exports = app;