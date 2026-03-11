const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const getProperties = async (req, res) => {
  try {
    const { state, lga, area, type, category, sub_type, minPrice, maxPrice } = req.query;
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

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (error) {
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
    res.json(data);
  } catch (error) {
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
    const { data: propertyData, error: propError } = await supabase
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

    // Insert images
    if (images && images.length > 0) {
      const imageInserts = images.map((url, index) => ({
        property_id: propertyData.id,
        image_url: url,
        image_order: index
      }));
      const { error: imgError } = await supabase
        .from('property_images')
        .insert(imageInserts);
      if (imgError) throw imgError;
    }

    res.status(201).json(propertyData);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const updateProperty = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  try {
    const { data, error } = await supabase
      .from('properties')
      .update(updates)
      .eq('id', id)
      .eq('landlord_id', req.user.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteProperty = async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id)
      .eq('landlord_id', req.user.id);
    if (error) throw error;
    res.json({ message: 'Property deleted' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getLandlordProperties = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        property_images(image_url, image_order)
      `)
      .eq('landlord_id', req.user.id);
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const uploadImages = async (req, res) => {
  try {
    const files = req.files;
    const uploadedUrls = [];

    for (const file of files) {
      const fileName = `${Date.now()}-${file.originalname}`;
      const { data, error } = await supabase.storage
        .from('property-images')
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('property-images')
        .getPublicUrl(fileName);

      uploadedUrls.push(urlData.publicUrl);
    }

    res.json({ urls: uploadedUrls });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getProperties, getPropertyById, createProperty, updateProperty, deleteProperty, getLandlordProperties, uploadImages };