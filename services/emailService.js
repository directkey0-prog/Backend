// Placeholder for email service
// Supabase handles auth emails
// For custom emails, integrate with service like SendGrid

const sendEmail = (to, subject, body) => {
  // Implement email sending logic
  console.log(`Sending email to ${to}: ${subject}`);
};

module.exports = { sendEmail };