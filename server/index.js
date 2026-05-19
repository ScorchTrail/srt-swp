const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const rateLimit = require('express-rate-limit');
const validator = require('validator');
const { sendMailboxLead } = require('./mailbox-lead');

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 5500;

const rootDir = path.resolve(__dirname, "..");
const publicDir = path.join(rootDir, "public");

const mailboxLeadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: { error: 'Too many requests, please try again later.' },
});

function sanitizeLeadInput(input) {
  return {
    name: validator.escape(validator.trim(input.name || '')),
    company: validator.escape(validator.trim(input.company || '')),
    phone: validator.escape(validator.trim(input.phone || '')),
    email: validator.normalizeEmail(input.email || ''),
    mailboxType: validator.escape(validator.trim(input.mailboxType || '')),
  };
}

function validateLeadInput({ name, email, phone, mailboxType }) {
  if (!name || name.length < 2 || name.length > 100) return 'Invalid name';
  if (!validator.isEmail(email || '')) return 'Invalid email';
  if (phone && !validator.isMobilePhone(phone, 'any')) return 'Invalid phone';
  if (!mailboxType || mailboxType.length < 2 || mailboxType.length > 50) return 'Invalid mailbox type';
  return null;
}

app.use(express.json());
app.use("/public", express.static(publicDir));
app.use(express.static(rootDir));

app.post('/api/mailbox-lead', mailboxLeadLimiter, async (req, res) => {
  const sanitized = sanitizeLeadInput(req.body || {});
  const validationError = validateLeadInput(sanitized);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }
  try {
    await sendMailboxLead(sanitized);
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send lead' });
  }
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "srt-swp-server" });
});

app.get("/", (_req, res) => {
  res.sendFile(path.join(rootDir, "index.html"));
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
