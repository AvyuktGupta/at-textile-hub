# CupCraft Wholesale

B2B wholesale storefront for a cup manufacturer. Buyers browse products, build a cart in wholesale
quantities and submit orders, which are emailed to the business. There is no payment gateway.

| Folder      | Stack                                               | Deploys to       |
| ----------- | --------------------------------------------------- | ---------------- |
| `backend/`  | Node.js 20+, Express 5, Mongoose 9, JWT, Nodemailer | VPS with PM2     |
| `frontend/` | Next.js 16 (App Router), React 19, Tailwind CSS v4  | Vercel           |

## Local development

Prerequisites: Node.js 20+ and a MongoDB instance (local or Atlas).

```bash
# API on http://localhost:5000
cd backend
cp .env.example .env        # set MONGODB_URI and a long random JWT_SECRET
npm install
npm run seed:admin          # creates the admin account from ADMIN_* variables
npm run seed:demo           # optional: 12 sample products (SKU prefix DEMO-); --remove deletes them
npm run dev

# Storefront on http://localhost:3000
cd frontend
cp .env.example .env.local  # NEXT_PUBLIC_API_URL=http://localhost:5000/api
npm install
npm run dev
```

Set the same long random `REVALIDATE_SECRET` in `backend/.env` and `frontend/.env.local`. The API
calls the storefront's `/api/revalidate` route after any product or settings change, so edits appear
immediately. Without it, the storefront still refreshes on its own within about a minute.

Health check: `GET http://localhost:5000/api/health`

## Backend layout

```
backend/src
├── app.js              Express app: security headers, CORS, rate limiting, routes, errors
├── server.js           Boots the DB connection and HTTP server, handles graceful shutdown
├── config/             Environment parsing and MongoDB connection
├── middleware/         auth.js (protect, optionalAuth, requireRole, requireAdmin), error.js
├── models/             User, Product, SiteSettings, Order
├── routes/             API routers mounted under /api
├── services/           Cart pricing, mailer + order email templates, upload cleanup,
│                       storefront cache revalidation webhook
├── scripts/            seedAdmin.js, seedDemo.js
└── utils/              ApiError, JWT helpers, buyer profile validation
```

### API endpoints

| Method | Path                  | Access | Notes                                                        |
| ------ | --------------------- | ------ | ------------------------------------------------------------ |
| POST   | `/api/auth/register`  | Public | Email, password, phone, business + shipping details. Rate limited |
| POST   | `/api/auth/login`     | Public | Rate limited. Returns `{ token, user }`                      |
| GET    | `/api/auth/me`        | User   | Current account                                              |
| PATCH  | `/api/me/profile`     | User   | Name, phone, business and shipping details                   |
| PUT    | `/api/me/password`    | User   | `{ currentPassword, newPassword }`; signs out other devices, returns a new token |
| GET    | `/api/me/orders`      | User   | The buyer's 50 most recent orders                            |
| POST   | `/api/cart/quote`     | Public | `{ items: [{ productId, quantity }] }` → current prices and issues |
| POST   | `/api/orders`         | User   | `{ items, notes?, idempotencyKey }`; needs a complete profile |
| GET    | `/api/orders`         | Admin  | `q`, `status`, `page`, `limit`                               |
| GET    | `/api/orders/:id`     | Admin  |                                                              |
| PATCH  | `/api/orders/:id`     | Admin  | `{ status }`: `submitted`, `confirmed`, `dispatched`, `cancelled` |
| POST   | `/api/orders/:id/resend-email` | Admin | `{ target: "business" \| "customer" }`              |
| GET    | `/api/storefront/home` | Public | Banner settings, homepage sections with products, top tags |
| GET    | `/api/me/recently-viewed` | User | Last viewed active products, newest first                |
| POST   | `/api/me/recently-viewed` | User | `{ productId }`; de-duplicated, capped at 20             |
| GET    | `/api/products`       | Public | `q`, `tags=a,b`, `match=any\|all`, `sort`, `page`, `limit`   |
| GET    | `/api/products/tags`  | Public | Tag counts for filters                                       |
| GET    | `/api/products/:idOrSlug` | Public | Admins also see hidden products                          |
| POST   | `/api/products`       | Admin  |                                                              |
| PATCH  | `/api/products/:id`   | Admin  | Removed images are deleted from disk if unused elsewhere     |
| DELETE | `/api/products/:id`   | Admin  |                                                              |
| POST   | `/api/uploads`        | Admin  | Multipart field `images`, up to 10 files, 5 MB each          |
| GET    | `/api/settings`       | Public | Excludes `orderDestinationEmail` and hidden sections         |
| GET    | `/api/settings/admin` | Admin  | Full settings document                                       |
| PUT    | `/api/settings`       | Admin  | `homepageScrolls` array order becomes the display order      |

Uploaded images are written to `backend/uploads/` (configurable with `UPLOAD_DIR`) and stored in the
database as `/uploads/<file>` paths, so they keep working if the API domain changes. Back this
folder up on the VPS.

Authentication uses a `Bearer` token in the `Authorization` header rather than cookies, because the
frontend and API run on different domains.

Product `finalPrice` is derived from `basePrice` and `discountPercentage` on every save. Query-style
updates (`findOneAndUpdate`, `updateOne`) that touch pricing are rejected so the stored price can
never drift; load the document and call `save()` instead.

### Orders and email

The cart lives in the buyer's browser. Prices shown in the cart always come from
`/api/cart/quote`, and `POST /api/orders` re-prices every line from the database, so prices sent
by the browser are never trusted. Items that are hidden, out of stock or below their minimum order
quantity block submission until the buyer fixes them.

On submit the order is saved first (with a snapshot of prices and the buyer's details), then two
emails are sent: the full order to the **Order destination email** from Site settings, with
Reply-To set to the buyer, and a confirmation to the buyer. Each email's delivery status is stored
on the order and shown in **Admin → Orders**, where it can be resent. A failed email never loses an
order. Each checkout sends an `idempotencyKey`, so retrying after a dropped connection cannot create
a duplicate order.

SMTP is configured with the `SMTP_*` and `MAIL_FROM` variables in `backend/.env`; `STORE_NAME` and
`STOREFRONT_URL` are used in the email copy and links. When `SMTP_HOST` is empty:

- in development, each email is written to `backend/mail-previews/` as an HTML file you can open
  in a browser;
- in production, emails are skipped and a warning is logged at startup.

At startup the API verifies the SMTP connection and logs the result.

## Deployment

**API (VPS + PM2)**

```bash
cd backend
npm ci --omit=dev
cp .env.example .env        # NODE_ENV=production, CLIENT_ORIGIN=https://your-vercel-domain,
                            # STOREFRONT_REVALIDATE_URL=https://your-vercel-domain/api/revalidate,
                            # STOREFRONT_URL, SMTP_* and MAIL_FROM
npm install -g pm2
npm run pm2:start           # later deploys: npm run pm2:reload
pm2 save && pm2 startup
```

Put Nginx (or another reverse proxy) with TLS in front of port 5000.

**Frontend (Vercel)**

Import the repo, set the project root to `frontend/`, and add `NEXT_PUBLIC_API_URL` pointing at the
public API URL (for example `https://api.example.com/api`) plus the shared `REVALIDATE_SECRET`.
The API must be reachable from Vercel's build servers at build time, because the homepage is
prerendered from live catalogue data.
