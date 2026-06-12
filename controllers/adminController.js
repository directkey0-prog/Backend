const { createClient } = require('@supabase/supabase-js');
const log = require('../utils/logger');
require('dotenv').config();

// Service role client bypasses RLS for all admin operations
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const getAllProperties = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('properties')
      .select('*, property_images(image_url)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    log.error('getAllProperties', error);
    res.status(400).json({ error: error.message });
  }
};

const approveProperty = async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabaseAdmin
      .from('properties')
      .update({ status: 'approved', approved_at: new Date() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    log.error('approveProperty', error);
    res.status(400).json({ error: error.message });
  }
};

const rejectProperty = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  try {
    const { data, error } = await supabaseAdmin
      .from('properties')
      .update({ status: 'rejected', rejection_reason: reason })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    log.error('rejectProperty', error);
    res.status(400).json({ error: error.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*');
    if (error) throw error;
    res.json(data);
  } catch (error) {
    log.error('getAllUsers', error);
    res.status(400).json({ error: error.message });
  }
};

const getAllTransactions = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('connections')
      .select(`*, properties(property_name)`)
      .order('created_at', { ascending: false });
    if (error) throw error;

    // Normalize field names to match frontend expectations
    const normalized = (data || []).map(c => ({
      id: c.id,
      reference: c.payment_reference,
      tenant_name: c.tenant_name,
      tenant_email: c.tenant_email,
      property_name: c.properties?.property_name || 'Unknown Property',
      amount: parseFloat(c.payment_amount) || 0,
      status: c.payment_status,
      date: c.payment_date || c.created_at || new Date().toISOString(),
    }));

    res.json(normalized);
  } catch (error) {
    log.error('getAllTransactions', error);
    res.status(400).json({ error: error.message });
  }
};

const getStatistics = async (_req, res) => {
  try {
    const { data: properties, error: propError } = await supabaseAdmin
      .from('properties').select('status');
    const { data: users, error: userError } = await supabaseAdmin
      .from('users').select('id');
    const { data: connections, error: connError } = await supabaseAdmin
      .from('connections').select('payment_amount').eq('payment_status', 'successful');

    if (propError) { log.error('getStatistics:properties', propError); throw propError; }
    if (userError) { log.error('getStatistics:users', userError); throw userError; }
    if (connError) { log.error('getStatistics:connections', connError); throw connError; }

    res.json({
      totalProperties: properties.length,
      approvedProperties: properties.filter(p => p.status === 'approved').length,
      pendingProperties: properties.filter(p => p.status === 'pending').length,
      rejectedProperties: properties.filter(p => p.status === 'rejected').length,
      totalUsers: users.length,
      totalConnections: connections.length,
      totalRevenue: connections.reduce((sum, c) => sum + parseFloat(c.payment_amount), 0)
    });
  } catch (error) {
    log.error('getStatistics', error);
    res.status(400).json({ error: error.message });
  }
};

const createAdminProperty = async (req, res) => {
  const {
    property_name, description, property_type, property_category, apartment_sub_type,
    bedrooms, bathrooms, price_per_year, price_per_night, price_per_hour, capacity, min_nights,
    land_area, land_unit, state, local_government, area, amenities, images
  } = req.body;
  try {
    const { data: propertyData, error: propError } = await supabaseAdmin
      .from('properties')
      .insert({
        property_name,
        description,
        property_type,
        property_category,
        apartment_sub_type: apartment_sub_type || null,
        bedrooms: bedrooms || 0,
        bathrooms: bathrooms || 0,
        price_per_year: price_per_year || 0,
        price_per_night: price_per_night || 0,
        price_per_hour: price_per_hour || 0,
        capacity: capacity || 0,
        min_nights: min_nights || 0,
        monthly_rent: price_per_year ? Math.round(price_per_year / 12) : 0,
        state,
        local_government,
        area,
        land_area: land_area || null,
        land_unit: land_unit || null,
        amenities: amenities || [],
        added_by: 'admin',
        status: 'approved',
        approved_at: new Date(),
      })
      .select()
      .single();
    if (propError) throw propError;

    if (images && images.length > 0) {
      const imageInserts = images.map((url, index) => ({
        property_id: propertyData.id,
        image_url: url,
        image_order: index,
      }));
      const { error: imgError } = await supabaseAdmin.from('property_images').insert(imageInserts);
      if (imgError) log.error('createAdminProperty:images', imgError);
    }

    res.status(201).json(propertyData);
  } catch (error) {
    log.error('createAdminProperty', error);
    res.status(400).json({ error: error.message });
  }
};

const deleteAdminProperty = async (req, res) => {
  const { id } = req.params;
  try {
    await supabaseAdmin.from('property_images').delete().eq('property_id', id);
    const { error } = await supabaseAdmin.from('properties').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    log.error('deleteAdminProperty', error);
    res.status(400).json({ error: error.message });
  }
};

const changeAdminPassword = async (req, res) => {
  const { current_password, new_password } = req.body;
  const adminEmail = req.user?.email;
  try {
    const { data: admin, error } = await supabaseAdmin.from('admins').select('*').eq('email', adminEmail).single();
    if (error || !admin) return res.status(404).json({ error: 'Admin not found' });
    const bcrypt = require('bcryptjs');
    const valid = await bcrypt.compare(current_password, admin.password_hash);
    if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });
    const hash = await bcrypt.hash(new_password, 10);
    const { error: updateError } = await supabaseAdmin.from('admins').update({ password_hash: hash }).eq('email', adminEmail);
    if (updateError) throw updateError;
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    log.error('changeAdminPassword', error);
    res.status(400).json({ error: error.message });
  }
};

module.exports = { getAllProperties, approveProperty, rejectProperty, getAllUsers, getAllTransactions, getStatistics, createAdminProperty, deleteAdminProperty, changeAdminPassword };
