// server/mailbox-lead.js
// Handles sending mailbox portal leads via Resend API

const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY); // Use environment variable for security

async function sendMailboxLead({ name, company, phone, email, mailboxType }) {
  try {
    const data = await resend.emails.send({
      from: 'leads@srttrail.dev',
      to: 's.trail7878@gmail.com', // 👈 Put the new recipient email here!
      subject: 'New Mailbox Portal Lead',
      html: `
        <h2>New Mailbox Lead</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Company:</strong> ${company || '(none)'} </p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Mailbox Type:</strong> ${mailboxType || '(not specified)'}</p>
      `,
    });
    return data;
  } catch (error) {
    console.error('Resend error:', error);
    throw error;
  }
}

module.exports = { sendMailboxLead };
