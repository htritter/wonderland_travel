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

  const { name, email, trip, rating, text } = req.body

  if (!name || !trip || !rating || !text) {
    return res.status(400).json({ error: 'name, trip, rating, and text are required' })
  }

  try {
    await transporter.sendMail({
      from: `"The Wonderland Travel" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,
      replyTo: email || undefined,
      subject: `⭐ New Review — ${name} (${rating}/5)`,
      html: reviewEmail({ name, email, trip, rating, text })
    })
  } catch (err) {
    console.error('Email error:', err)
    return res.status(500).json({ error: 'Failed to send review' })
  }

  return res.status(200).json({ success: true })
}

function reviewEmail({ name, email, trip, rating, text }) {
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
        <h1 style="margin:0;color:#ffffff;font-size:22px">⭐ New Review Submitted</h1>
      </div>
      <div style="padding:28px 32px">
        <table style="width:100%;border-collapse:collapse;border-bottom:1px solid #e8e4f8;margin-bottom:20px">
          ${row('Name', name)}
          ${row('Email', email ? `<a href="mailto:${email}" style="color:#3949ab">${email}</a>` : '')}
          ${row('Trip', trip)}
          ${row('Rating', '★'.repeat(rating) + '☆'.repeat(5 - rating))}
        </table>
        <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#0d1145;text-transform:uppercase;letter-spacing:.05em">Review</p>
        <p style="margin:0;font-size:14px;color:#5c5c7a;line-height:1.7;background:#fff;border-left:4px solid #3949ab;padding:12px 16px;border-radius:0 8px 8px 0">${text}</p>
      </div>
    </div>
  `
}
