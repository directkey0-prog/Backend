const axios = require('axios');
const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
);

// ─── Email helper ──────────────────────────────────────────────────────────────
const sendLandlordContactEmail = async ({ tenantEmail, tenantName, landlord, propertyName, propertyLocation }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`[EMAIL SKIPPED] Would send landlord contact to ${tenantEmail} (set EMAIL_USER + EMAIL_PASS in .env)`);
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

  const whatsappLink = landlord.phone_number
    ? `https://wa.me/${landlord.phone_number.replace(/[^0-9]/g, '')}`
    : null;

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;padding:20px;">
      <div style="background:#1E3A8A;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
        <h1 style="color:white;margin:0;font-size:24px;">DirectKey</h1>
        <p style="color:#93c5fd;margin:6px 0 0;">Payment Confirmed</p>
      </div>
      <div style="background:white;padding:24px;border-radius:0 0 12px 12px;">
        <p style="color:#374151;">Hi <strong>${tenantName}</strong>,</p>
        <p style="color:#374151;">Your payment was successful! Here are the landlord's contact details for <strong>${propertyName}</strong>:</p>
        <div style="background:#1E3A8A;border-radius:12px;padding:20px;margin:16px 0;">
          <p style="color:white;font-weight:bold;font-size:16px;margin:0 0 4px;">${landlord.full_name}</p>
          <p style="color:#93c5fd;font-size:13px;margin:0 0 12px;">Property Owner</p>
          <hr style="border-color:rgba(255,255,255,0.2);margin:0 0 12px;" />
          <table style="width:100%;border-spacing:0;">
            <tr><td style="color:#93c5fd;font-size:13px;padding:4px 8px 4px 0;width:60px;">Phone</td><td style="color:white;font-size:14px;font-weight:bold;">${landlord.phone_number || 'N/A'}</td></tr>
            <tr><td style="color:#93c5fd;font-size:13px;padding:4px 8px 4px 0;">Email</td><td style="color:white;font-size:14px;">${landlord.email || 'N/A'}</td></tr>
          </table>
          ${whatsappLink ? `<div style="margin-top:14px;"><a href="${whatsappLink}" style="display:inline-block;background:#16a34a;color:white;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:bold;">Chat on WhatsApp</a></div>` : ''}
        </div>
        <p style="color:#6b7280;font-size:13px;">Need help? <a href="mailto:support@directkey.ng" style="color:#FF6B6B;">support@directkey.ng</a></p>
      </div>
      <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:16px;">&copy; ${new Date().getFullYear()} DirectKey</p>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"DirectKey" <${process.env.EMAIL_USER}>`,
    to: tenantEmail,
    subject: `Your landlord contact for ${propertyName} — DirectKey`,
    html,
  });
  console.log(`[EMAIL SENT] To ${tenantEmail}`);
};

// ─── Controllers ──────────────────────────────────────────────────────────────

const initializePayment = async (req, res) => {
  try {
    const { email, amount, propertyId, tenantName } = req.body;
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email,
        amount,
        metadata: { propertyId, tenantName },
        callback_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}`,
      },
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json' } }
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const verifyPayment = async (req, res) => {
  const { reference } = req.params;
  const { tenantEmail, tenantName } = req.query;

  // Step 1: Verify with Paystack API (required)
  let txData;
  try {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
    );
    txData = response.data.data;
  } catch (error) {
    console.error('[PAYSTACK VERIFY ERROR]', error.message);
    return res.status(500).json({ success: false, error: 'Could not verify payment with Paystack' });
  }

  if (txData.status !== 'success') {
    return res.json({ success: false, message: 'Payment was not successful' });
  }

  // Resolve tenant details from query params or Paystack metadata
  const resolvedEmail = tenantEmail || txData.customer?.email || '';
  const resolvedName =
    tenantName ||
    txData.metadata?.custom_fields?.find(f => f.variable_name === 'tenant_name')?.value ||
    'Tenant';
  const propertyId =
    txData.metadata?.custom_fields?.find(f => f.variable_name === 'property_id')?.value ||
    txData.metadata?.propertyId;
  const propertyName =
    txData.metadata?.custom_fields?.find(f => f.variable_name === 'property_name')?.value ||
    'the property';

  // Step 2: Record connection in Supabase (non-fatal)
  try {
    await supabase.from('connections').insert({
      property_id: propertyId,
      tenant_email: resolvedEmail,
      tenant_name: resolvedName,
      payment_reference: reference,
      payment_amount: txData.amount / 100,
      payment_status: 'successful',
      paystack_reference: reference,
    });
  } catch (err) {
    console.log('[SUPABASE INSERT SKIPPED]', err.message);
  }

  // Step 3: Get landlord details from Supabase (non-fatal, falls back gracefully)
  let landlordContact = null;
  let landlord = null;

  if (propertyId && process.env.SUPABASE_URL && process.env.SUPABASE_URL !== 'your_supabase_url') {
    try {
      const { data: propertyData, error } = await supabase
        .from('properties')
        .select('*, users!inner(email, phone_number, full_name, whatsapp)')
        .eq('id', propertyId)
        .single();

      if (!error && propertyData) {
        landlord = propertyData.users;
        landlordContact = {
          name: landlord.full_name,
          phone: landlord.phone_number,
          email: landlord.email,
          whatsapp: landlord.whatsapp || landlord.phone_number,
        };

        // Step 4: Send email (non-blocking)
        sendLandlordContactEmail({
          tenantEmail: resolvedEmail,
          tenantName: resolvedName,
          landlord,
          propertyName: propertyData.property_name || propertyName,
          propertyLocation: [propertyData.area, propertyData.state].filter(Boolean).join(', '),
        }).catch(err => console.error('[EMAIL ERROR]', err.message));
      }
    } catch (err) {
      console.log('[SUPABASE FETCH SKIPPED]', err.message);
    }
  }

  // Return success — landlordContact may be null if Supabase not connected yet
  res.json({
    success: true,
    landlordContact,
    message: landlordContact
      ? 'Payment verified and landlord contact retrieved'
      : 'Payment verified. Connect Supabase to retrieve landlord contact.',
  });
};

const getConnectionsForProperty = async (req, res) => {
  const { propertyId } = req.params;
  try {
    const { data, error } = await supabase
      .from('connections')
      .select('*')
      .eq('property_id', propertyId)
      .eq('payment_status', 'successful');
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = { initializePayment, verifyPayment, getConnectionsForProperty };
