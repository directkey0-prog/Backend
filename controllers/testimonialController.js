const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Public: Get active testimonials
const getTestimonials = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Admin: Get all testimonials
const getAllTestimonials = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Admin: Create testimonial
const createTestimonial = async (req, res) => {
  const { customer_name, customer_title, testimonial_text, rating } = req.body;
  try {
    const { data, error } = await supabase
      .from('testimonials')
      .insert({ customer_name, customer_title, testimonial_text, rating, is_active: true })
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Admin: Update testimonial
const updateTestimonial = async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('testimonials')
      .update(req.body)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Admin: Delete testimonial
const deleteTestimonial = async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase
      .from('testimonials')
      .delete()
      .eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = { getTestimonials, getAllTestimonials, createTestimonial, updateTestimonial, deleteTestimonial };
