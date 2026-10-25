# TapReview — Smart NFC + Dynamic QR Platform

Enterprise-grade NFC & dynamic QR code platform for restaurants, cafes, hotels, and retail places. Features frictionless smart onboarding, multi-link customer hub, and AI-powered Google Review generation with 1-tap copy and slide-to-select.

---

## ⚡ How it Works

1. **Unassigned QR Scan:**
   - When any unassigned or newly generated stand QR code is scanned, it automatically opens the **Stand Activation Page** (`/r/:slug` or `#/setup`).
   - The business owner or staff can input their **Google Review Link**, **Digital Menu Link**, **Instagram Profile / Handle**, **Website**, and **WhatsApp**.
   - Hitting **Save & Activate** permanently links the stand in real-time.

2. **Customer Scan & Multi-Link Hub:**
   - Any customer scanning the QR code or tapping the NFC chip lands on the **Customer Multi-Link Portal**.
   - They can choose:
     - ⭐ **Leave a Google Review** (Featured AI Review Assistant)
     - 🍽️ **View Digital Menu**
     - 📸 **Follow on Instagram**
     - 🌐 **Visit Website**
     - 💬 **Chat on WhatsApp**

3. **AI Review Slider & Instant Google Reviews:**
   - Selecting "Google Review" opens the **Review Slider Page**.
   - **4 authentic 5-star reviews** are auto-generated immediately.
   - Customers can slide (touch-swipe or arrows) to choose their favourite review.
   - Tapping **"Select & Open Google Reviews"** automatically copies the review text to their clipboard and instantly opens the restaurant's Google Review page!

---

## 🌐 100% Free Hosting on Cloudflare

This application is engineered to run **100% free forever** on Cloudflare Pages.

### Method 1: Git Integration (Recommended — 2 Minutes)

1. Push this repository to GitHub or GitLab.
2. Go to the [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **Create Application** → **Pages** → **Connect to Git**.
3. Select your repository.
4. Set the build settings:
   - **Framework preset:** `Vite`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
5. Click **Save and Deploy**.
6. That's it! Cloudflare will give you a free `*.pages.dev` domain with automatic global CDN, SSL, and instant continuous deployments on every git push.

---

### Method 2: 1-Command CLI Deploy (No Git Required)

Run:
```bash
npm run build
npx wrangler pages deploy dist --project-name tapreview
```
Follow the login prompt in your browser, and your site is live immediately!

---

### Optional: Cloudflare D1 Database (Also 100% Free)

The platform is designed to work seamlessly with **zero database setup** (using fast, persistent client storage and offline mode).

If you want Cloudflare D1 serverless SQL database with sub-50ms global routing:
1. Create a free D1 database:
   ```bash
   npx wrangler d1 create tapreview-db
   ```
2. Copy the `database_id` into `wrangler.toml`.
3. Apply the migrations:
   ```bash
   npx wrangler d1 migrations apply tapreview-db --remote
   ```
4. In Cloudflare Pages Settings → Functions → D1 Database Bindings → Add binding:
   - Variable name: `DB`
   - D1 Database: `tapreview-db`

---

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Start local dev server
npm run dev

# Build for production
npm run build
```