const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
})

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { firstName, lastName, email, phone, destination, travelDate, travelers, hasChildren, childrenAges, message } = req.body

  if (!firstName || !email || !destination) {
    return res.status(400).json({ error: 'firstName, email, and destination are required' })
  }

  try {
    await transporter.sendMail({
      from: `"The Wonderland Travel" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,
      replyTo: email,
      subject: `✨ New Quote Request — ${firstName} ${lastName} (${destination})`,
      html: agentEmail({ firstName, lastName, email, phone, destination, travelDate, travelers, hasChildren, childrenAges, message })
    })
  } catch (err) {
    console.error('Email error:', err)
    return res.status(500).json({ error: 'Failed to send quote request' })
  }

  return res.status(200).json({ success: true })
}

function agentEmail({ firstName, lastName, email, phone, destination, travelDate, travelers, hasChildren, childrenAges, message }) {
  const row = (label, val) => val
    ? `<tr>
        <td style="padding:8px 0;color:#5c5c7a;font-size:14px;width:140px;vertical-align:top">${label}</td>
        <td style="padding:8px 0;font-size:14px;font-weight:600;color:#1c1c2e">${val}</td>
       </tr>`
    : ''

  return `
    <div style="font-family:'Helvetica Neue',sans-serif;max-width:600px;margin:0 auto;background:#f8f6ff;border-radius:16px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#0d1145,#1a237e);padding:28px 32px">
        <p style="margin:0 0 4px;color:#ffd54f;font-size:12px;letter-spacing:.1em;text-transform:uppercase;font-weight:700">The Wonderland Travel</p>
        <h1 style="margin:0;color:#ffffff;font-size:22px">✨ New Quote Request</h1>
      </div>
      <div style="padding:28px 32px">
        <table style="width:100%;border-collapse:collapse;border-bottom:1px solid #e8e4f8;margin-bottom:20px">
          ${row('Name', `${firstName} ${lastName}`)}
          ${row('Email', `<a href="mailto:${email}" style="color:#3949ab">${email}</a>`)}
          ${row('Phone', phone)}
          ${row('Destination', destination)}
          ${row('Travel Date', travelDate)}
          ${row('Travelers', travelers)}
          ${row('Traveling with Kids', hasChildren === 'yes' ? 'Yes' : 'No')}
          ${row('Ages of Kids', hasChildren === 'yes' ? childrenAges : '')}
        </table>
        ${message ? `
        <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#0d1145;text-transform:uppercase;letter-spacing:.05em">Their Message</p>
        <p style="margin:0 0 20px;font-size:14px;color:#5c5c7a;line-height:1.7;background:#fff;border-left:4px solid #3949ab;padding:12px 16px;border-radius:0 8px 8px 0">${message}</p>
        ` : ''}
        <a href="mailto:${email}?subject=Your%20Wonderland%20Travel%20Quote%20%E2%9C%A8"
           style="display:inline-block;background:linear-gradient(135deg,#0d1145,#1a237e);color:#fff;padding:12px 24px;border-radius:50px;font-size:14px;font-weight:700;text-decoration:none">
          Reply to ${firstName} →
        </a>
      </div>
    </div>
  `
}
