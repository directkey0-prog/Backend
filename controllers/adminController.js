const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const getAllProperties = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        property_images(image_url),
        users(full_name, email)
      `);
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const approveProperty = async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('properties')
      .update({ status: 'approved', approved_at: new Date() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const rejectProperty = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  try {
    const { data, error } = await supabase
      .from('properties')
      .update({ status: 'rejected', rejection_reason: reason })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*');
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getAllTransactions = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('connections')
      .select(`
        *,
        properties(property_name, monthly_rent)
      `);
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getStatistics = async (req, res) => {
  try {
    const { data: properties, error: propError } = await supabase
      .from('properties')
      .select('status');

    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id');

    const { data: connections, error: connError } = await supabase
      .from('connections')
      .select('payment_amount')
      .eq('payment_status', 'successful');

    if (propError || userError || connError) throw new Error('Statistics error');

    const stats = {
      totalProperties: properties.length,
      approvedProperties: properties.filter(p => p.status === 'approved').length,
      pendingProperties: properties.filter(p => p.status === 'pending').length,
      rejectedProperties: properties.filter(p => p.status === 'rejected').length,
      totalUsers: users.length,
      totalConnections: connections.length,
      totalRevenue: connections.reduce((sum, c) => sum + parseFloat(c.payment_amount), 0)
    };

    res.json(stats);
  } catch (error) {
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
    const { data: propertyData, error: propError } = await supabase
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
      await supabase.from('property_images').insert(imageInserts);
    }

    res.status(201).json(propertyData);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteAdminProperty = async (req, res) => {
  const { id } = req.params;
  try {
    await supabase.from('property_images').delete().eq('property_id', id);
    const { error } = await supabase.from('properties').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = { getAllProperties, approveProperty, rejectProperty, getAllUsers, getAllTransactions, getStatistics, createAdminProperty, deleteAdminProperty };