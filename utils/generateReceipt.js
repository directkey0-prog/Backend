const PDFDocument = require('pdfkit');

const NAVY = '#1E3A8A';
const NAVY_LIGHT = '#EFF6FF';
const CORAL = '#FF6B6B';
const GRAY = '#6B7280';
const LIGHT_GRAY = '#F3F4F6';
const GREEN = '#16A34A';
const GREEN_LIGHT = '#DCFCE7';
const WHITE = '#FFFFFF';
const DARK = '#111827';

const fmtAmount = (n) => 'NGN ' + new Intl.NumberFormat('en-NG').format(n || 0);
const fmtDate = (d) => {
  try {
    return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return String(d);
  }
};

/**
 * Generate a PDF receipt as a Buffer.
 * @param {Object} data
 * @returns {Promise<Buffer>}
 */
const generateReceipt = (data) => {
  const {
    tenant_name = 'Tenant',
    tenant_email = '',
    property_name = 'Property',
    property_location = '',
    landlord_name = '',
    landlord_phone = '',
    landlord_email = '',
    payment_reference = '',
    amount = 0,
    date = new Date(),
  } = data;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0, bufferPages: true });
    const buffers = [];
    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const PW = doc.page.width;   // 595.28
    const PH = doc.page.height;  // 841.89
    const ML = 50;               // left margin
    const MR = 50;               // right margin
    const CW = PW - ML - MR;    // content width

    // ── HEADER BAR ────────────────────────────────────────────────────────
    doc.rect(0, 0, PW, 110).fill(NAVY);

    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(26)
      .text('DirectKey', ML, 28);

    doc.fillColor('#93C5FD').font('Helvetica').fontSize(11)
      .text('Payment Receipt', ML, 60);

    // Reference top-right
    doc.fillColor('#CBD5E1').font('Helvetica').fontSize(8.5)
      .text('REF: ' + payment_reference, ML, 90, { width: CW, align: 'right' });

    // ── SUCCESS BADGE ─────────────────────────────────────────────────────
    doc.rect(ML, 128, CW, 38).fill(GREEN_LIGHT);
    doc.rect(ML, 128, 4, 38).fill(GREEN);
    doc.fillColor(GREEN).font('Helvetica-Bold').fontSize(12.5)
      .text('Payment Successful', ML + 16, 141, { width: CW - 20 });

    // ── AMOUNT HIGHLIGHT ──────────────────────────────────────────────────
    doc.rect(ML, 184, CW, 60).fill(NAVY_LIGHT);
    doc.fillColor(GRAY).font('Helvetica').fontSize(9)
      .text('AMOUNT PAID', ML, 197, { width: CW, align: 'center' });
    doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(28)
      .text(fmtAmount(amount), ML, 213, { width: CW, align: 'center' });

    // ── SECTION HELPER ────────────────────────────────────────────────────
    let y = 270;

    const sectionTitle = (title) => {
      doc.rect(ML, y, CW, 26).fill(NAVY);
      doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(10)
        .text(title.toUpperCase(), ML + 12, y + 8, { width: CW - 24 });
      y += 26;
    };

    const dataRow = (label, value, shade = false) => {
      const rowH = 28;
      doc.rect(ML, y, CW, rowH).fill(shade ? LIGHT_GRAY : WHITE);
      // thin bottom border
      doc.rect(ML, y + rowH - 1, CW, 1).fill('#E5E7EB');

      doc.fillColor(GRAY).font('Helvetica').fontSize(9)
        .text(label, ML + 12, y + 9, { width: 160 });
      doc.fillColor(DARK).font('Helvetica-Bold').fontSize(9)
        .text(String(value || '-'), ML + 175, y + 9, { width: CW - 187, align: 'right' });
      y += rowH;
    };

    // ── TRANSACTION DETAILS ───────────────────────────────────────────────
    sectionTitle('Transaction Details');
    dataRow('Date & Time', fmtDate(date), false);
    dataRow('Reference Number', payment_reference, true);
    dataRow('Payment Method', 'Paystack', false);
    dataRow('Amount', fmtAmount(amount), true);
    dataRow('Status', 'Successful', false);

    y += 16;

    // ── PROPERTY & TENANT ────────────────────────────────────────────────
    sectionTitle('Property & Tenant');
    dataRow('Tenant Name', tenant_name, false);
    dataRow('Tenant Email', tenant_email, true);
    dataRow('Property', property_name, false);
    if (property_location) dataRow('Location', property_location, true);

    y += 16;

    // ── LANDLORD CONTACT ─────────────────────────────────────────────────
    sectionTitle('Landlord Contact');

    // Landlord name highlighted row
    doc.rect(ML, y, CW, 32).fill(NAVY_LIGHT);
    doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(11)
      .text(landlord_name || 'Property Owner', ML + 12, y + 10, { width: CW - 24 });
    y += 32;

    dataRow('Phone', landlord_phone || 'N/A', false);
    dataRow('Email', landlord_email || 'N/A', true);
    if (landlord_phone) {
      const wa = landlord_phone.replace(/[^0-9]/g, '');
      dataRow('WhatsApp', 'wa.me/' + wa, false);
    }

    y += 20;

    // ── NOTICE BOX ───────────────────────────────────────────────────────
    doc.rect(ML, y, CW, 52).fill('#FFF7ED');
    doc.rect(ML, y, 3, 52).fill(CORAL);
    doc.fillColor('#92400E').font('Helvetica-Bold').fontSize(9)
      .text('Important', ML + 14, y + 9);
    doc.fillColor('#78350F').font('Helvetica').fontSize(8.5)
      .text(
        'Save this receipt and the landlord contact details above. DirectKey connects you with landlords — please schedule a viewing before making any rental decisions.',
        ML + 14, y + 22, { width: CW - 28 }
      );
    y += 62;

    // ── FOOTER ───────────────────────────────────────────────────────────
    const footerY = PH - 72;
    doc.rect(0, footerY, PW, 72).fill(NAVY);

    doc.fillColor('#93C5FD').font('Helvetica').fontSize(8.5)
      .text('This is an automatically generated receipt. No signature is required.', 0, footerY + 14, { width: PW, align: 'center' });
    doc.fillColor(WHITE).fontSize(8.5)
      .text('support@directkey.ng  |  www.directkey.ng', 0, footerY + 32, { width: PW, align: 'center' });
    doc.fillColor('#64748B').fontSize(7.5)
      .text('(c) ' + new Date().getFullYear() + ' DirectKey. All rights reserved.', 0, footerY + 52, { width: PW, align: 'center' });

    doc.end();
  });
};

module.exports = generateReceipt;
