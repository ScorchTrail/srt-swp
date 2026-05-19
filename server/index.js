const { sendMailboxLead } = require('./mailbox-lead');
const rateLimit = require('express-rate-limit');
const validator = require('validator');
// API endpoint to handle mailbox portal leads

// Rate limiter: max 5 requests per 10 minutes per IP
const mailboxLeadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: { error: 'Too many requests, please try again later.' },
});

// Helper: sanitize and validate input
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
const express = require("express");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3000;

const rootDir = path.resolve(__dirname, "..");
const publicDir = path.join(rootDir, "public");

const YELP_API_BASE = "https://api.yelp.com/v3";
const REVIEWS_CACHE_MS = 5 * 60 * 1000;

let reviewsCache = {
  data: null,
  expiresAt: 0,
};

app.use(express.json());
app.use("/public", express.static(publicDir));
app.use(express.static(rootDir));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "srt-swp-server" });
});

app.get("/api/reviews", async (_req, res) => {
  try {
    if (reviewsCache.data && Date.now() < reviewsCache.expiresAt) {
      return res.json(reviewsCache.data);
    }

    const reviewsPayload = await fetchYelpReviews();
    reviewsCache = {
      data: reviewsPayload,
      expiresAt: Date.now() + REVIEWS_CACHE_MS,
    };

    return res.json(reviewsPayload);
  } catch (error) {
    const status = error.statusCode || 500;
    const code = error.code || "reviews_fetch_failed";
    const message = error.message || "Failed to load Yelp reviews";
    console.error("[yelp] reviews fetch failed", {
      status,
      code,
      message,
    });
    return res.status(status).json({ error: message, code });
  }
});

app.get("/", (_req, res) => {
  res.sendFile(path.join(rootDir, "index.html"));
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

async function fetchYelpReviews() {
  const apiKey = process.env.YELP_API_KEY;
  const businessId = process.env.YELP_BUSINESS_ID;

  if (!apiKey || !businessId) {
    const err = new Error(
      "Missing Yelp config. Set YELP_API_KEY and YELP_BUSINESS_ID in .env"
    );
    err.statusCode = 500;
    err.code = "missing_yelp_env";
    throw err;
  }

  const endpoint = `${YELP_API_BASE}/businesses/${encodeURIComponent(
    businessId
  )}/reviews?limit=3&sort_by=yelp_sort`;

  const response = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const body = await safeReadJson(response);
    const detail = body?.error?.description || body?.error?.code || response.statusText;
    const err = new Error(`Yelp API error (${response.status}): ${detail}`);
    err.statusCode = response.status;
    err.code = body?.error?.code || "yelp_api_error";
    throw err;
  }

  const data = await response.json();
  const reviews = Array.isArray(data?.reviews)
    ? data.reviews.map((review) => mapYelpReview(review))
    : [];

  return { reviews };
}

function mapYelpReview(review) {
  return {
    authorName: review?.user?.name || "Yelp User",
    rating: Number(review?.rating) || 5,
    source: "yelp",
    text: review?.text || "",
    url: review?.url || "",
  };
}

async function safeReadJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}
