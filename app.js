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

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

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

module.exports = app;