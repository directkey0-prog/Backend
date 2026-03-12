/**
 * DirectKey — Google Apps Script
 * Sheet: https://docs.google.com/spreadsheets/d/15GJvEdq6q5D4dfYydeoffwTOX3kebu-FSBqmwRS_4dM
 *
 * HOW TO UPDATE THE DEPLOYMENT (since you already deployed):
 * 1. Open your Google Sheet
 * 2. Click Extensions > Apps Script
 * 3. Replace ALL existing code with this file
 * 4. Click Save
 * 5. Click Deploy > Manage deployments
 * 6. Click the pencil (edit) icon on your existing deployment
 * 7. Change "Version" to "New version"
 * 8. Click Deploy  ← the URL stays the same, no need to update .env
 */

var SHEET_ID = '15GJvEdq6q5D4dfYydeoffwTOX3kebu-FSBqmwRS_4dM';

// ── Column layout ──────────────────────────────────────────────────────────
// A: Date | B: Tenant Name | C: Tenant Email | D: Property Name
// E: Location | F: Landlord Name | G: Landlord Phone | H: Landlord Email
// I: Payment Reference | J: Amount (NGN) | K: Status

function getSheet() {
  return SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
}

function setupHeaders(sheet) {
  if (sheet.getLastRow() === 0) {
    var headers = [
      'Date', 'Tenant Name', 'Tenant Email', 'Property Name',
      'Location', 'Landlord Name', 'Landlord Phone', 'Landlord Email',
      'Payment Reference', 'Amount (NGN)', 'Status'
    ];
    sheet.appendRow(headers);
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold')
               .setBackground('#1E3A8A')
               .setFontColor('#ffffff')
               .setFontSize(10);
    sheet.setFrozenRows(1);
  }
}

// ── Main entry point ───────────────────────────────────────────────────────
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    // Write to sheet
    var sheet = getSheet();
    setupHeaders(sheet);

    var row = sheet.getLastRow() + 1;
    sheet.appendRow([
      new Date(data.date || new Date()),
      data.tenant_name || '',
      data.tenant_email || '',
      data.property_name || '',
      data.property_location || '',
      data.landlord_name || '',
      data.landlord_phone || '',
      data.landlord_email || '',
      data.payment_reference || '',
      data.amount || 0,
      'successful'
    ]);

    // Format the amount cell
    sheet.getRange(row, 10).setNumberFormat('#,##0.00');
    // Highlight the new row alternately
    if (row % 2 === 0) {
      sheet.getRange(row, 1, 1, 11).setBackground('#F8FAFF');
    }

    // Build PDF attachment once (shared between both emails)
    var attachments = [];
    if (data.receipt_pdf_base64) {
      try {
        var pdfBytes = Utilities.base64Decode(data.receipt_pdf_base64);
        var pdfBlob = Utilities.newBlob(
          pdfBytes,
          'application/pdf',
          data.receipt_filename || ('DirectKey_Receipt_' + (data.payment_reference || 'receipt') + '.pdf')
        );
        attachments.push(pdfBlob);
        Logger.log('PDF decoded successfully, size: ' + pdfBytes.length + ' bytes');
      } catch (err) {
        Logger.log('PDF decode error: ' + err.toString());
      }
    } else {
      Logger.log('No receipt_pdf_base64 in payload');
    }

    // Send email to tenant with landlord contact + PDF receipt
    if (data.tenant_email) {
      sendTenantEmail(data, attachments);
    }

    // Notify landlord that someone has paid for their property
    if (data.landlord_email) {
      sendLandlordEmail(data);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, row: row }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    Logger.log('doPost error: ' + err.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ── Tenant email: landlord contact + PDF receipt ───────────────────────────
function sendTenantEmail(data, attachments) {
  var waNumber = (data.landlord_phone || '').replace(/[^0-9]/g, '');
  var waLink = waNumber ? 'https://wa.me/' + waNumber : null;
  var year = new Date().getFullYear();

  var html = [
    '<!DOCTYPE html>',
    '<html><head><meta charset="UTF-8"></head>',
    '<body style="margin:0;padding:0;background:#F1F5F9;font-family:Arial,Helvetica,sans-serif;">',
    '<table width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:32px 0;">',
    '<tr><td align="center">',
    '<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">',

    // ── Header
    '<tr><td style="background:#1E3A8A;border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">',
    '<div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:50%;width:56px;height:56px;line-height:56px;text-align:center;margin-bottom:12px;">',
    '<span style="color:white;font-size:28px;">&#10003;</span>',
    '</div>',
    '<h1 style="color:white;margin:0 0 4px;font-size:28px;letter-spacing:-0.5px;">DirectKey</h1>',
    '<p style="color:#93C5FD;margin:0;font-size:15px;font-weight:500;">Payment Confirmed</p>',
    '</td></tr>',

    // ── Property banner
    '<tr><td style="background:#FF6B6B;padding:18px 40px;text-align:center;">',
    '<p style="color:white;margin:0;font-size:12px;letter-spacing:1px;text-transform:uppercase;opacity:0.85;">Property Unlocked</p>',
    '<p style="color:white;margin:4px 0 0;font-size:20px;font-weight:bold;">' + escHtml(data.property_name || 'Your Property') + '</p>',
    (data.property_location ? '<p style="color:rgba(255,255,255,0.85);margin:4px 0 0;font-size:13px;">&#128205; ' + escHtml(data.property_location) + '</p>' : ''),
    '</td></tr>',

    // ── Body
    '<tr><td style="background:white;padding:36px 40px;">',

    // Greeting + amount
    '<p style="color:#374151;margin:0 0 6px;font-size:15px;">Hi <strong>' + escHtml(data.tenant_name || 'there') + '</strong>,</p>',
    '<p style="color:#374151;margin:0 0 24px;font-size:15px;line-height:1.6;">',
    'Your payment of <strong style="color:#16A34A;">NGN ' + formatAmount(data.amount) + '</strong> was successful. ',
    'Below are the landlord\'s contact details — reach out to schedule a viewing.',
    '</p>',

    // Landlord card
    '<div style="background:linear-gradient(135deg,#1E3A8A 0%,#1e40af 100%);border-radius:14px;padding:24px;margin-bottom:24px;">',
    '<p style="color:#93C5FD;font-size:11px;letter-spacing:1px;text-transform:uppercase;margin:0 0 8px;">Landlord Contact</p>',
    '<p style="color:white;font-size:19px;font-weight:bold;margin:0 0 2px;">' + escHtml(data.landlord_name || 'Property Owner') + '</p>',
    '<p style="color:#93C5FD;font-size:13px;margin:0 0 18px;">Property Owner</p>',
    '<div style="border-top:1px solid rgba(255,255,255,0.15);padding-top:16px;">',
    '<table cellpadding="0" cellspacing="0" style="width:100%;">',
    '<tr>',
    '<td style="padding:6px 0;width:70px;color:#93C5FD;font-size:13px;vertical-align:top;">Phone</td>',
    '<td style="padding:6px 0;color:white;font-size:14px;font-weight:bold;">' + escHtml(data.landlord_phone || 'N/A') + '</td>',
    '</tr>',
    '<tr>',
    '<td style="padding:6px 0;color:#93C5FD;font-size:13px;vertical-align:top;">Email</td>',
    '<td style="padding:6px 0;color:white;font-size:14px;">' + escHtml(data.landlord_email || 'N/A') + '</td>',
    '</tr>',
    '</table>',
    '</div>',
    (waLink
      ? '<div style="margin-top:18px;"><a href="' + waLink + '" style="display:inline-block;background:#16A34A;color:white;text-decoration:none;padding:11px 22px;border-radius:8px;font-size:14px;font-weight:bold;">&#128172; Chat on WhatsApp</a></div>'
      : ''),
    '</div>',

    // Transaction summary
    '<div style="background:#F8FAFF;border:1px solid #E2E8F0;border-radius:10px;padding:20px;margin-bottom:24px;">',
    '<p style="color:#1E3A8A;font-weight:bold;margin:0 0 14px;font-size:13px;letter-spacing:0.3px;text-transform:uppercase;">Transaction Summary</p>',
    '<table cellpadding="0" cellspacing="0" style="width:100%;font-size:14px;">',
    '<tr style="border-bottom:1px solid #E5E7EB;">',
    '<td style="color:#6B7280;padding:9px 0;">Reference</td>',
    '<td style="color:#111827;font-weight:bold;text-align:right;font-family:monospace;font-size:12px;">' + escHtml(data.payment_reference || '') + '</td>',
    '</tr>',
    '<tr style="border-bottom:1px solid #E5E7EB;">',
    '<td style="color:#6B7280;padding:9px 0;">Amount Paid</td>',
    '<td style="color:#16A34A;font-weight:bold;text-align:right;font-size:16px;">NGN ' + formatAmount(data.amount) + '</td>',
    '</tr>',
    '<tr style="border-bottom:1px solid #E5E7EB;">',
    '<td style="color:#6B7280;padding:9px 0;">Property</td>',
    '<td style="color:#111827;text-align:right;font-weight:600;">' + escHtml(data.property_name || '') + '</td>',
    '</tr>',
    (data.property_location
      ? '<tr style="border-bottom:1px solid #E5E7EB;"><td style="color:#6B7280;padding:9px 0;">Location</td><td style="color:#111827;text-align:right;">' + escHtml(data.property_location) + '</td></tr>'
      : ''),
    '<tr>',
    '<td style="color:#6B7280;padding:9px 0;">Status</td>',
    '<td style="text-align:right;"><span style="background:#DCFCE7;color:#15803D;font-size:12px;font-weight:bold;padding:3px 10px;border-radius:20px;">Successful</span></td>',
    '</tr>',
    '</table>',
    '</div>',

    // PDF note
    '<div style="background:#FFF7ED;border-left:4px solid #FF6B6B;border-radius:0 8px 8px 0;padding:14px 16px;margin-bottom:24px;">',
    '<p style="color:#92400E;font-weight:bold;margin:0 0 4px;font-size:13px;">Your receipt is attached</p>',
    '<p style="color:#78350F;font-size:13px;margin:0;line-height:1.5;">A PDF copy of this receipt has been attached to this email. Save it for your records.</p>',
    '</div>',

    // Help
    '<p style="color:#9CA3AF;font-size:12px;margin:0;line-height:1.6;">',
    'Need help? Email us at <a href="mailto:support@directkey.ng" style="color:#FF6B6B;text-decoration:none;">support@directkey.ng</a>',
    '</p>',

    '</td></tr>',

    // ── Footer
    '<tr><td style="background:#1E3A8A;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;">',
    '<p style="color:#93C5FD;margin:0 0 4px;font-size:13px;">support@directkey.ng &nbsp;|&nbsp; www.directkey.ng</p>',
    '<p style="color:#475569;margin:0;font-size:12px;">&copy; ' + year + ' DirectKey. All rights reserved.</p>',
    '</td></tr>',

    '</table>',
    '</td></tr>',
    '</table>',
    '</body></html>'
  ].join('');

  var mailOptions = {
    to: data.tenant_email,
    subject: 'Payment Confirmed — ' + (data.property_name || 'Your Property') + ' | DirectKey',
    htmlBody: html,
  };
  if (attachments && attachments.length > 0) {
    mailOptions.attachments = attachments;
  }

  MailApp.sendEmail(mailOptions);
  Logger.log('Tenant email sent to ' + data.tenant_email + (attachments && attachments.length > 0 ? ' (with PDF)' : ' (no PDF)'));
}

// ── Landlord email: payment notification ──────────────────────────────────
function sendLandlordEmail(data) {
  var year = new Date().getFullYear();

  var html = [
    '<!DOCTYPE html>',
    '<html><head><meta charset="UTF-8"></head>',
    '<body style="margin:0;padding:0;background:#F1F5F9;font-family:Arial,Helvetica,sans-serif;">',
    '<table width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:32px 0;">',
    '<tr><td align="center">',
    '<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">',

    // ── Header
    '<tr><td style="background:#1E3A8A;border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">',
    '<h1 style="color:white;margin:0 0 4px;font-size:28px;letter-spacing:-0.5px;">DirectKey</h1>',
    '<p style="color:#93C5FD;margin:0;font-size:15px;font-weight:500;">New Payment Received</p>',
    '</td></tr>',

    // ── Alert banner
    '<tr><td style="background:#16A34A;padding:16px 40px;text-align:center;">',
    '<p style="color:white;margin:0;font-size:15px;font-weight:bold;">&#9989; Someone just paid for your property!</p>',
    '</td></tr>',

    // ── Body
    '<tr><td style="background:white;padding:36px 40px;">',

    '<p style="color:#374151;margin:0 0 24px;font-size:15px;line-height:1.6;">',
    'Hi <strong>' + escHtml(data.landlord_name || 'there') + '</strong>,<br><br>',
    'A tenant has completed a payment on <strong>DirectKey</strong> for one of your properties. Here are their details:',
    '</p>',

    // Property box
    '<div style="background:#F8FAFF;border:2px solid #1E3A8A;border-radius:12px;padding:20px;margin-bottom:24px;">',
    '<p style="color:#1E3A8A;font-size:11px;letter-spacing:1px;text-transform:uppercase;margin:0 0 6px;font-weight:bold;">Property</p>',
    '<p style="color:#111827;font-size:20px;font-weight:bold;margin:0 0 4px;">' + escHtml(data.property_name || 'Your Property') + '</p>',
    (data.property_location ? '<p style="color:#6B7280;font-size:13px;margin:0;">&#128205; ' + escHtml(data.property_location) + '</p>' : ''),
    '</div>',

    // Tenant details card
    '<div style="border:1px solid #E5E7EB;border-radius:10px;overflow:hidden;margin-bottom:24px;">',
    '<div style="background:#F9FAFB;padding:12px 20px;border-bottom:1px solid #E5E7EB;">',
    '<p style="color:#374151;font-weight:bold;font-size:13px;margin:0;text-transform:uppercase;letter-spacing:0.3px;">Tenant Details</p>',
    '</div>',
    '<table cellpadding="0" cellspacing="0" style="width:100%;font-size:14px;">',
    '<tr style="border-bottom:1px solid #F3F4F6;">',
    '<td style="color:#6B7280;padding:14px 20px;width:120px;">Name</td>',
    '<td style="color:#111827;padding:14px 20px;font-weight:600;">' + escHtml(data.tenant_name || 'N/A') + '</td>',
    '</tr>',
    '<tr>',
    '<td style="color:#6B7280;padding:14px 20px;">Email</td>',
    '<td style="color:#111827;padding:14px 20px;"><a href="mailto:' + escHtml(data.tenant_email || '') + '" style="color:#1E3A8A;text-decoration:none;font-weight:600;">' + escHtml(data.tenant_email || 'N/A') + '</a></td>',
    '</tr>',
    '</table>',
    '</div>',

    // CTA note
    '<div style="background:#F0FDF4;border-left:4px solid #16A34A;border-radius:0 8px 8px 0;padding:14px 16px;margin-bottom:24px;">',
    '<p style="color:#14532D;font-size:14px;margin:0;line-height:1.6;">',
    'The tenant will reach out to you directly using your contact information. You can also email them at <a href="mailto:' + escHtml(data.tenant_email || '') + '" style="color:#16A34A;font-weight:bold;">' + escHtml(data.tenant_email || '') + '</a>.',
    '</p>',
    '</div>',

    '<p style="color:#9CA3AF;font-size:12px;margin:0;line-height:1.6;">',
    'Need help? Email us at <a href="mailto:support@directkey.ng" style="color:#FF6B6B;text-decoration:none;">support@directkey.ng</a>',
    '</p>',

    '</td></tr>',

    // ── Footer
    '<tr><td style="background:#1E3A8A;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;">',
    '<p style="color:#93C5FD;margin:0 0 4px;font-size:13px;">support@directkey.ng &nbsp;|&nbsp; www.directkey.ng</p>',
    '<p style="color:#475569;margin:0;font-size:12px;">&copy; ' + year + ' DirectKey. All rights reserved.</p>',
    '</td></tr>',

    '</table>',
    '</td></tr>',
    '</table>',
    '</body></html>'
  ].join('');

  MailApp.sendEmail({
    to: data.landlord_email,
    subject: 'New Payment Received — ' + (data.property_name || 'Your Property') + ' | DirectKey',
    htmlBody: html,
  });
  Logger.log('Landlord email sent to ' + data.landlord_email);
}

// ── Helpers ────────────────────────────────────────────────────────────────
function formatAmount(n) {
  if (!n) return '0.00';
  return Number(n).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
