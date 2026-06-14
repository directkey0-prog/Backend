/**
 * DirectKey — Password Reset Email Script (separate project)
 *
 * SETUP STEPS:
 * 1. Go to script.google.com → New project → name it "DirectKey Reset Email"
 * 2. Paste this entire file
 * 3. Select testResetEmail from the dropdown → click Run
 * 4. Accept the permissions dialog (allows MailApp to send email)
 * 5. Check your inbox to confirm it works
 * 6. Deploy → New deployment → Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 7. Copy the URL → add to Backend/.env as GOOGLE_RESET_URL=<url>
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    sendPasswordResetEmail(data);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    Logger.log('Error: ' + err.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function sendPasswordResetEmail(data) {
  var year = new Date().getFullYear();

  var html = [
    '<!DOCTYPE html>',
    '<html><head><meta charset="UTF-8"></head>',
    '<body style="margin:0;padding:0;background:#F1F5F9;font-family:Arial,Helvetica,sans-serif;">',
    '<table width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:32px 0;">',
    '<tr><td align="center">',
    '<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">',

    '<tr><td style="background:#1E3A8A;border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">',
    '<h1 style="color:white;margin:0 0 4px;font-size:28px;letter-spacing:-0.5px;">Direct<span style="color:#f97316;">Key</span></h1>',
    '<p style="color:#93C5FD;margin:0;font-size:14px;">Nigeria\'s Trusted Property Rental Platform</p>',
    '</td></tr>',

    '<tr><td style="background:white;padding:36px 40px;">',
    '<h2 style="color:#0f172a;margin:0 0 12px;font-size:20px;">Reset Your Password</h2>',
    '<p style="color:#64748b;font-size:14px;margin:0 0 28px;line-height:1.7;">',
    'We received a request to reset the password for your DirectKey landlord account. ',
    'Click the button below to choose a new password.',
    '</p>',

    '<div style="text-align:center;margin:32px 0;">',
    '<a href="' + (data.reset_link || '#') + '" style="background:#f97316;color:#ffffff;text-decoration:none;padding:16px 36px;border-radius:10px;font-weight:700;font-size:15px;display:inline-block;">',
    'Reset My Password',
    '</a>',
    '</div>',

    '<div style="background:#FFF7ED;border-left:4px solid #f97316;border-radius:0 8px 8px 0;padding:14px 16px;margin:24px 0;">',
    '<p style="color:#92400E;font-size:13px;margin:0;line-height:1.6;">',
    'This link expires in <strong>1 hour</strong>. If you did not request a password reset, you can safely ignore this email — your password will not change.',
    '</p>',
    '</div>',

    '<p style="color:#9CA3AF;font-size:12px;margin:24px 0 0;line-height:1.6;">',
    'Need help? Email us at <a href="mailto:info@directkey.ng" style="color:#f97316;text-decoration:none;">info@directkey.ng</a>',
    '</p>',
    '</td></tr>',

    '<tr><td style="background:#1E3A8A;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;">',
    '<p style="color:#93C5FD;margin:0 0 4px;font-size:13px;">info@directkey.ng &nbsp;|&nbsp; directkey.ng</p>',
    '<p style="color:#475569;margin:0;font-size:12px;">&copy; ' + year + ' DirectKey &mdash; RC: 9238738. All rights reserved.</p>',
    '</td></tr>',

    '</table>',
    '</td></tr>',
    '</table>',
    '</body></html>'
  ].join('');

  MailApp.sendEmail({
    to: data.to_email,
    subject: 'Reset Your DirectKey Password',
    htmlBody: html,
    name: 'DirectKey',
  });

  Logger.log('Reset email sent to: ' + data.to_email);
}

// ── Run this first to authorize MailApp permissions ────────────────────────
function testResetEmail() {
  sendPasswordResetEmail({
    to_email: 'oretomiwa20@gmail.com',
    reset_link: 'https://landlord.directkey.ng/reset-password#test'
  });
}
