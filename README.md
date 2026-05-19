# Shipping with Purpose (SRT-SWP)

Professional static-site structure with an Express server and page-specific CSS entrypoints.

## Project Structure

```text
srt-swp/
├─ index.html
├─ public/
│  ├─ services.html
│  ├─ mailboxes.html
│  ├─ print.html
│  ├─ assets/
│  │  ├─ fonts/
│  │  ├─ icons/
│  │  └─ images/
│  ├─ css/
│  │  ├─ main-home.css
│  │  ├─ main-services.css
│  │  ├─ main-mailboxes.css
│  │  ├─ main-print.css
│  │  └─ blocks/
│  └─ js/
│     ├─ app.js
│     └─ modules/
├─ server/
│  └─ index.js
├─ package.json
└─ README.md
```

## CSS Loading Strategy

Each HTML page loads only its own main CSS file:

- / (root index.html) -> public/css/main-home.css
- public/services.html -> css/main-services.css
- public/mailboxes.html -> css/main-mailboxes.css
- public/print.html -> css/main-print.css

Each page entry imports only the required block styles from css/blocks.

## Conventions

- Single web root: all client-facing files live under public.
- Relative links inside public pages use same-root paths (for example: index.html, services.html, css/..., js/...).
- BEM naming is used for class architecture in block CSS.

### BEM Naming Guide

Use this format consistently:

- Block: `.block`
- Element: `.block__element`
- Modifier: `.block--modifier` or `.block__element--modifier`

Rules:

- Use only one `__` boundary per class name. Do not nest elements like `.block__element__icon`.
- If you need a sub-part of an element, use a hyphen suffix: `.block__element-icon`.
- Keep modifiers state-like and explicit: `.faq-item--open`, `.btn--navy`.
- Avoid orphan classes in HTML. Every semantic class should have a CSS selector (or be an intentional utility class).

Examples:

- Good: `.nav__brand-icon`, `.quote__pricing-trigger-icon`, `.faq-item__answer-inner`
- Avoid: `.nav__brand__icon`, `.quote__trigger__icon`

## Architecture Notes

Shared block CSS (imported across multiple pages):

- blocks/base.css
- blocks/nav.css
- blocks/info-bar.css
- blocks/footer.css
- blocks/forms.css
- blocks/page-hero.css

Homepage-focused blocks (main-home.css):

- blocks/hero.css
- blocks/services-preview.css
- blocks/mailbox-cta.css
- blocks/print-portal.css
- blocks/dropoff-grid.css
- blocks/testimonials.css
- blocks/pricing-modal.css
- blocks/pricing-table.css
- blocks/reservation-modal.css

Mailbox-focused blocks (main-mailboxes.css):

- blocks/mailbox-hero.css
- blocks/mailbox-features.css
- blocks/quote.css
- blocks/reservation-modal.css

Services-focused blocks (main-services.css):

- blocks/service.css

Maintenance rule:

- If a block is used by only one page, import it only in that page entry file.
- If a block becomes shared by 2+ pages, move its import to each consuming page entry (do not reintroduce a global main.css).

## Run

```bash
npm install
npm start
```

Then open http://localhost:3000.

## Yelp API Setup

Use this if you want live Yelp reviews instead of static fallback data.

1. Create Yelp credentials
- Go to Yelp Developers and create an app to get an API key.
- Find your business ID using the helper script below.

Business ID helper:

```bash
npm run yelp:find -- "Shipping with Purpose" "Scottsdale, AZ"
```

This prints the top Yelp matches and their IDs. Copy the correct ID into YELP_BUSINESS_ID.

2. Create your local env file

```bash
cp .env.example .env
```

Then edit .env with your real values:

```env
PORT=3000
YELP_API_KEY=YOUR_YELP_API_KEY
YELP_BUSINESS_ID=YOUR_BUSINESS_ID
```

3. Install and start

```bash
npm install
npm start
```

4. Verify backend endpoints
- Health check: http://localhost:3000/health
- Yelp reviews API: http://localhost:3000/api/reviews

Expected /api/reviews response shape:

```json
{
	"reviews": [
		{
			"authorName": "...",
			"rating": 5,
			"source": "yelp",
			"text": "...",
			"url": "..."
		}
	]
}
```

5. Verify frontend
- Open http://localhost:3000/
- Go to the reviews section on the homepage.
- Confirm cards show live Yelp content.

Notes:
- The server caches Yelp responses for 5 minutes to reduce API calls.
- If Yelp env variables are missing or Yelp rejects the request, /api/reviews returns a detailed error code/message.
- Frontend review loading automatically falls back to local JSON data when the API is unavailable.
