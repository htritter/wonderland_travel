const prisma = require('../lib/prisma')
const { Resend } = require('resend')

const resend = new Resend(process.env.RESEND_API_KEY)

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { firstName, lastName, email, phone, destination, travelDate, travelers, message } = req.body

  if (!firstName || !email || !destination) {
    return res.status(400).json({ error: 'firstName, email, and destination are required' })
  }

  let quote
  try {
    quote = await prisma.quoteRequest.create({
      data: { firstName, lastName, email, phone, destination, travelDate, travelers, message }
    })
  } catch (err) {
    console.error('DB error:', err)
    return res.status(500).json({ error: 'Failed to save quote request' })
  }

  // Emails are best-effort — a failure here won't error the response
  try {
    await Promise.all([
      // Notification to the travel agent
      resend.emails.send({
        from: process.env.FROM_EMAIL,
        to: process.env.AGENT_EMAIL,
        subject: `✨ New Quote Request — ${firstName} ${lastName} (${destination})`,
        html: agentEmail({ firstName, lastName, email, phone, destination, travelDate, travelers, message, id: quote.id })
      }),
      // Confirmation to the client
      resend.emails.send({
        from: process.env.FROM_EMAIL,
        to: email,
        subject: `We got your request, ${firstName}! ✨`,
        html: clientEmail({ firstName, destination })
      })
    ])
  } catch (err) {
    console.error('Email error (non-fatal):', err)
  }

  return res.status(200).json({ success: true, id: quote.id })
}

function agentEmail({ firstName, lastName, email, phone, destination, travelDate, travelers, message, id }) {
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
        </table>
        ${message ? `
        <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#0d1145;text-transform:uppercase;letter-spacing:.05em">Their Message</p>
        <p style="margin:0 0 20px;font-size:14px;color:#5c5c7a;line-height:1.7;background:#fff;border-left:4px solid #3949ab;padding:12px 16px;border-radius:0 8px 8px 0">${message}</p>
        ` : ''}
        <a href="mailto:${email}?subject=Your%20Wonderland%20Travel%20Quote%20%E2%9C%A8"
           style="display:inline-block;background:linear-gradient(135deg,#0d1145,#1a237e);color:#fff;padding:12px 24px;border-radius:50px;font-size:14px;font-weight:700;text-decoration:none">
          Reply to ${firstName} →
        </a>
        <p style="margin:20px 0 0;font-size:11px;color:#b0aac8">Request ID: ${id}</p>
      </div>
    </div>
  `
}

function clientEmail({ firstName, destination }) {
  return `
    <div style="font-family:'Helvetica Neue',sans-serif;max-width:600px;margin:0 auto;background:#f8f6ff;border-radius:16px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#0d1145,#1a237e);padding:28px 32px;text-align:center">
        <p style="margin:0 0 8px;font-size:36px">✨</p>
        <h1 style="margin:0;color:#ffd54f;font-size:24px">Your Quote is On Its Way!</h1>
        <p style="margin:8px 0 0;color:rgba(255,255,255,.75);font-size:15px">The Wonderland Travel</p>
      </div>
      <div style="padding:32px;text-align:center">
        <p style="font-size:16px;color:#1c1c2e;line-height:1.7;margin:0 0 16px">
          Hi <strong>${firstName}</strong> — we received your quote request for <strong>${destination}</strong> and we're so excited to start planning your magical trip! 🏰
        </p>
        <p style="font-size:15px;color:#5c5c7a;line-height:1.7;margin:0 0 28px">
          We'll be back in touch <strong>within 24 hours</strong> with personalized options and pricing. In the meantime, feel free to reply to this email with any extra details or questions.
        </p>
        <div style="background:#fff;border-radius:12px;padding:20px;border:1px solid #e8e4f8;margin-bottom:28px">
          <p style="margin:0;font-size:14px;color:#5c5c7a;font-style:italic">
            "Planning a family vacation should be exciting — not stressful. Let me take care of every detail so you can simply enjoy the magic."
          </p>
        </div>
        <p style="margin:0;font-size:13px;color:#b0aac8">The Wonderland Travel · hello@thewonderlandtravel.com</p>
      </div>
    </div>
  `
}
