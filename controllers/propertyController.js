const { createClient } = require('@supabase/supabase-js');
const log = require('../utils/logger');
require('dotenv').config();

// Use anon key for public reads, service role for writes (bypasses RLS)
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const getProperties = async (req, res) => {
  try {
    const { state, lga, area, type, category, sub_type, minPrice, maxPrice, bedrooms, search, featured } = req.query;
    let query = supabase
      .from('properties')
      .select(`
        *,
        property_images(image_url, image_order),
        users(full_name, email)
      `)
      .eq('status', 'approved');

    if (state) query = query.eq('state', state);
    if (lga) query = query.eq('local_government', lga);
    if (area) query = query.ilike('area', `%${area}%`);
    if (type) query = query.eq('property_type', type);
    if (category) query = query.eq('property_category', category);
    if (sub_type) query = query.eq('apartment_sub_type', sub_type);
    if (minPrice) query = query.gte('price_per_year', minPrice);
    if (maxPrice) query = query.lte('price_per_year', maxPrice);
    if (bedrooms && bedrooms !== 'Any') {
      if (String(bedrooms).includes('+')) {
        query = query.gte('bedrooms', parseInt(bedrooms));
      } else {
        query = query.eq('bedrooms', parseInt(bedrooms));
      }
    }
    if (search) query = query.ilike('property_name', `%${search}%`);
    if (featured === 'true') query = query.limit(6);

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (error) {
    log.error('getProperties', error);
    res.status(400).json({ error: error.message });
  }
};

const getPropertyById = async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        property_images(image_url, image_order),
        users(full_name, email, phone_number)
      `)
      .eq('id', id)
      .eq('status', 'approved')
      .single();
    if (error) throw error;

    // Increment view count (non-fatal, fire-and-forget)
    supabaseAdmin.from('properties').update({ views_count: (data.views_count || 0) + 1 }).eq('id', id).then(() => {});

    res.json(data);
  } catch (error) {
    log.error('getPropertyById', error);
    res.status(400).json({ error: error.message });
  }
};

const createProperty = async (req, res) => {
  const {
    property_name, description, monthly_rent, price_per_year, price_per_night, price_per_hour,
    capacity, min_nights, property_type, property_category, apartment_sub_type,
    bedrooms, bathrooms, land_area, land_unit,
    state, local_government, area, amenities, images
  } = req.body;
  const landlord_id = req.user.id;
  try {
    // Ensure user exists in public users table (prevents FK violation)
    const meta = req.user.user_metadata || {};
    await supabaseAdmin.from('users').upsert({
      id: landlord_id,
      email: req.user.email,
      full_name: meta.full_name || req.user.email,
      phone_number: meta.phone || null,
      role: meta.role || 'landlord',
    }, { onConflict: 'id' });

    const { data: propertyData, error: propError } = await supabaseAdmin
      .from('properties')
      .insert({
        property_name,
        description,
        monthly_rent: monthly_rent || (price_per_year ? Math.round(price_per_year / 12) : 0),
        price_per_year: price_per_year || 0,
        price_per_night: price_per_night || 0,
        price_per_hour: price_per_hour || 0,
        capacity: capacity || 0,
        min_nights: min_nights || 0,
        property_type,
        property_category,
        apartment_sub_type: apartment_sub_type || null,
        bedrooms: bedrooms || 0,
        bathrooms: bathrooms || 0,
        state,
        local_government,
        area,
        land_area: land_area || null,
        land_unit: land_unit || null,
        amenities: amenities || [],
        landlord_id,
        status: 'pending'
      })
      .select()
      .single();
    if (propError) throw propError;

    if (images && images.length > 0) {
      const imageInserts = images.map((url, index) => ({
        property_id: propertyData.id,
        image_url: url,
        image_order: index
      }));
      const { error: imgError } = await supabaseAdmin.from('property_images').insert(imageInserts);
      if (imgError) log.error('createProperty:images', imgError);
    }

    res.status(201).json(propertyData);
  } catch (error) {
    log.error('createProperty', error);
    res.status(400).json({ error: error.message });
  }
};

const updateProperty = async (req, res) => {
  const { id } = req.params;
  const { images, ...updates } = req.body;
  try {
    const { data, error } = await supabaseAdmin
      .from('properties')
      .update(updates)
      .eq('id', id)
      .eq('landlord_id', req.user.id)
      .select()
      .single();
    if (error) throw error;

    // Replace images if provided
    if (images && images.length > 0) {
      await supabaseAdmin.from('property_images').delete().eq('property_id', id);
      const imageInserts = images.map((url, index) => ({
        property_id: id,
        image_url: url,
        image_order: index
      }));
      const { error: imgError } = await supabaseAdmin.from('property_images').insert(imageInserts);
      if (imgError) log.error('updateProperty:images', imgError);
    }

    res.json(data);
  } catch (error) {
    log.error('updateProperty', error);
    res.status(400).json({ error: error.message });
  }
};

const deleteProperty = async (req, res) => {
  const { id } = req.params;
  try {
    await supabaseAdmin.from('property_images').delete().eq('property_id', id);
    const { error } = await supabaseAdmin
      .from('properties')
      .delete()
      .eq('id', id)
      .eq('landlord_id', req.user.id);
    if (error) throw error;
    res.json({ message: 'Property deleted' });
  } catch (error) {
    log.error('deleteProperty', error);
    res.status(400).json({ error: error.message });
  }
};

const getLandlordProperties = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('properties')
      .select(`
        *,
        property_images(image_url, image_order)
      `)
      .eq('landlord_id', req.user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    log.error('getLandlordProperties', error);
    res.status(400).json({ error: error.message });
  }
};

const uploadImages = async (req, res) => {
  try {
    const files = req.files;
    const uploadedUrls = [];

    for (const file of files) {
      const fileName = `${Date.now()}-${file.originalname}`;
      const { data, error } = await supabaseAdmin.storage
        .from('property-images')
        .upload(fileName, file.buffer, { contentType: file.mimetype });

      if (error) throw error;

      const { data: urlData } = supabaseAdmin.storage
        .from('property-images')
        .getPublicUrl(fileName);

      uploadedUrls.push(urlData.publicUrl);
    }

    res.json({ urls: uploadedUrls });
  } catch (error) {
    log.error('uploadImages', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getProperties, getPropertyById, createProperty, updateProperty, deleteProperty, getLandlordProperties, uploadImages };
