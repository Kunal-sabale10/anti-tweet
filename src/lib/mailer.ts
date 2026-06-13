import nodemailer from 'nodemailer';

// Mock transporter using Ethereal Email which is great for local dev
let transporter: nodemailer.Transporter;

export async function getTransporter() {
  if (!transporter) {
    const gmailUser = process.env.GMAIL_USER?.trim();
    const gmailPass = process.env.GMAIL_APP_PASSWORD?.trim();

    if (gmailUser && gmailPass) {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: gmailUser, pass: gmailPass },
      });
    } else {
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: { user: 'test@ethereal.email', pass: 'password' }
      });
    }
  }
  return transporter;
}

export async function sendOTP(email: string, code: string) {
  console.log(`\n\n================================`);
  console.log(`🔐 MOCK MOCK MOCK: OTP sent to ${email}`);
  console.log(`🔐 YOUR CODE IS: ${code}`);
  console.log(`================================\n\n`);
  
  // Try sending, but catch error since ethereal test account might fail
  try {
    const t = await getTransporter();
    const fromEmail = process.env.GMAIL_USER?.trim() || 'security@anti-tweet.com';
    await t.sendMail({
      from: `"Anti-Tweet Security" <${fromEmail}>`,
      to: email,
      subject: "Your Login OTP",
      text: `Your OTP is: ${code}. Valid for 10 minutes.`,
      html: `<b>Your OTP is: ${code}</b>. Valid for 10 minutes.`
    });
  } catch (err) {
    console.error("Email transport failed:", err);
  }
}

export async function sendInvoice(email: string, plan: string, amount: string) {
  const invoiceId = `INV-${Math.floor(100000 + Math.random() * 900000)}`;
  
  console.log(`\n\n================================`);
  console.log(`🧾 MOCK MOCK MOCK: Invoice sent to ${email}`);
  console.log(`🧾 INVOICE ID: ${invoiceId}`);
  console.log(`🧾 PLAN: ${plan} | AMOUNT: ${amount}`);
  console.log(`================================\n\n`);

  try {
    const t = await getTransporter();
    await t.sendMail({
      from: '"Anti-Tweet Billing" <billing@anti-tweet.com>',
      to: email,
      subject: `Your Anti-Tweet Invoice: ${invoiceId}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h1 style="color: #3b82f6;">Anti-Tweet</h1>
          <hr />
          <h2>Invoice ${invoiceId}</h2>
          <p>Thank you for upgrading to <strong>${plan}</strong>.</p>
          <div style="background: #f8fafc; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <table style="width: 100%;">
              <tr>
                <td><strong>Description</strong></td>
                <td style="text-align: right;"><strong>Amount</strong></td>
              </tr>
              <tr>
                <td>Anti-Tweet ${plan} Subscription (Monthly)</td>
                <td style="text-align: right;">${amount}</td>
              </tr>
              <tr style="border-top: 1px solid #cbd5e1;">
                <td><strong>Total Paid</strong></td>
                <td style="text-align: right;"><strong>${amount}</strong></td>
              </tr>
            </table>
          </div>
          <p style="font-size: 0.8rem; color: #64748b;">
            This payment was processed during our priority billing window (10 AM - 11 AM IST).
          </p>
        </div>
      `
    });
  } catch {
    console.log("Mock invoice transport failed, but details are logged above.");
  }
}
