const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const log = require('../utils/logger');
const generateReceipt = require('../utils/generateReceipt');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// ─── Google Apps Script notifier ──────────────────────────────────────────
const notifyViaGoogleScript = async (payload) => {
  const url = process.env.GOOGLE_SCRIPT_URL;
  if (!url) {
    log.info('[GOOGLE SCRIPT SKIPPED] Set GOOGLE_SCRIPT_URL in .env to enable sheet logging + email');
    return;
  }
  try {
    await axios.post(url, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    log.info('[GOOGLE SCRIPT] Notified successfully');
  } catch (err) {
    log.error('notifyViaGoogleScript', err);
  }
};

// ─── Controllers ──────────────────────────────────────────────────────────

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
    log.error('initializePayment', error);
    res.status(500).json({ error: error.message });
  }
};

const verifyPayment = async (req, res) => {
  const { reference } = req.params;
  const { tenantEmail, tenantName } = req.query;

  // Step 1: Verify with Paystack API
  let txData;
  try {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
    );
    txData = response.data.data;
  } catch (error) {
    log.error('verifyPayment:paystack', error);
    return res.status(500).json({ success: false, error: 'Could not verify payment with Paystack' });
  }

  if (txData.status !== 'success') {
    return res.json({ success: false, message: 'Payment was not successful' });
  }

  // Resolve tenant details
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

  // Step 2: Record connection in Supabase (service role — bypasses RLS)
  try {
    await supabaseAdmin.from('connections').upsert({
      property_id: propertyId || null,
      tenant_email: resolvedEmail,
      tenant_name: resolvedName,
      payment_reference: reference,
      payment_amount: txData.amount / 100,
      payment_status: 'successful',
      paystack_reference: reference,
      payment_date: new Date().toISOString(),
    }, { onConflict: 'payment_reference' });
  } catch (err) {
    log.error('verifyPayment:insert', err);
  }

  // Step 3: Get landlord details
  let landlordContact = null;
  let propertyData = null;

  if (propertyId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('properties')
        .select('*, users!inner(email, phone_number, full_name)')
        .eq('id', propertyId)
        .single();

      if (!error && data) {
        propertyData = data;
        const landlord = data.users;
        landlordContact = {
          name: landlord.full_name,
          phone: landlord.phone_number,
          email: landlord.email,
          whatsapp: landlord.phone_number,
        };
      }
    } catch (err) {
      log.error('verifyPayment:landlord', err);
    }
  }

  // Step 4: Generate PDF receipt + notify Apps Script (non-blocking)
  const scriptPayload = {
    tenant_name: resolvedName,
    tenant_email: resolvedEmail,
    property_name: propertyData?.property_name || propertyName,
    property_location: [propertyData?.area, propertyData?.state].filter(Boolean).join(', '),
    landlord_name: landlordContact?.name || '',
    landlord_phone: landlordContact?.phone || '',
    landlord_email: landlordContact?.email || '',
    payment_reference: reference,
    amount: txData.amount / 100,
    date: new Date().toISOString(),
  };

  // Generate PDF and attach as base64 (non-blocking)
  generateReceipt(scriptPayload)
    .then((pdfBuffer) => {
      scriptPayload.receipt_pdf_base64 = pdfBuffer.toString('base64');
      scriptPayload.receipt_filename = `DirectKey_Receipt_${reference}.pdf`;
      return notifyViaGoogleScript(scriptPayload);
    })
    .catch((err) => {
      log.error('generateReceipt/notify', err);
      // Still try to notify without PDF if generation failed
      notifyViaGoogleScript(scriptPayload).catch(() => {});
    });

  res.json({
    success: true,
    landlordContact,
    message: landlordContact
      ? 'Payment verified and landlord contact retrieved'
      : 'Payment verified. Landlord contact unavailable.',
  });
};

const getConnectionsForProperty = async (req, res) => {
  const { propertyId } = req.params;
  try {
    const { data, error } = await supabaseAdmin
      .from('connections')
      .select('*')
      .eq('property_id', propertyId)
      .eq('payment_status', 'successful')
      .order('payment_date', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    log.error('getConnectionsForProperty', error);
    res.status(400).json({ error: error.message });
  }
};

// All connections for the authenticated landlord across all their properties
const getLandlordConnections = async (req, res) => {
  const landlordId = req.user.id;
  try {
    const { data: properties, error: propError } = await supabaseAdmin
      .from('properties')
      .select('id, property_name')
      .eq('landlord_id', landlordId);
    if (propError) throw propError;

    if (!properties || properties.length === 0) return res.json([]);

    const propertyIds = properties.map(p => p.id);
    const propertyMap = Object.fromEntries(properties.map(p => [p.id, p.property_name]));

    const { data: connections, error: connError } = await supabaseAdmin
      .from('connections')
      .select('*')
      .in('property_id', propertyIds)
      .eq('payment_status', 'successful')
      .order('payment_date', { ascending: false });
    if (connError) throw connError;

    const result = (connections || []).map(c => ({
      ...c,
      property_name: propertyMap[c.property_id] || 'Unknown Property',
    }));

    res.json(result);
  } catch (error) {
    log.error('getLandlordConnections', error);
    res.status(400).json({ error: error.message });
  }
};

module.exports = { initializePayment, verifyPayment, getConnectionsForProperty, getLandlordConnections };
