# Pivot Frontend Deployment Guide

## Target architecture

| Host | URL | Purpose |
|------|-----|---------|
| Frontend (recommended: Cloudflare Pages) | `https://app.pivotteam.online` | React SPA |
| Backend (Railway) | `https://api.pivotteam.online` | Flask API |

> If you actually intend to use `pivotsteam.online`, replace every occurrence of `pivotteam.online` below.

## 1. Build the frontend

```bash
npm ci
npm run build
```

The `dist/` folder is the deployable static site. It already contains:

- `index.html`
- `assets/`
- `_redirects` (SPA fallback for Cloudflare Pages / Netlify)
- `_headers` (security headers)

## 2. Deploy to Cloudflare Pages (recommended)

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com).
2. Go to **Pages** → **Create a project**.
3. Connect the `Tim200804/Pivot` GitHub repo, or upload the `dist/` folder directly.
4. Build settings (if connecting Git):
   - Framework preset: `None`
   - Build command: `npm ci && npm run build`
   - Build output directory: `dist`
5. Click **Save and Deploy**.
6. After the first deploy, go to **Custom domains** → **Set up a custom domain**.
7. Enter `app.pivotteam.online` and confirm.
8. Cloudflare will give you DNS records to add (usually a CNAME). Add them in the Cloudflare DNS tab.

## 3. Alternative: Deploy to Vercel

1. Import `Tim200804/Pivot` into [Vercel](https://vercel.com).
2. Framework preset: `Vite`.
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add custom domain `app.pivotteam.online` in project settings.

## 4. Alternative: Deploy to Netlify

1. Drag and drop the `dist/` folder to [Netlify](https://app.netlify.com/drop), or connect the Git repo.
2. Add custom domain `app.pivotteam.online` in site settings.

## 5. DNS records required

Wherever you bought `pivotteam.online`, add these DNS records **in Cloudflare** (recommended because Cloudflare Pages + DNS work together):

| Type | Name | Target | Proxy status |
|------|------|--------|--------------|
| CNAME | `app` | `<cloudflare-pages-target>` | Proxied |
| CNAME | `api` | `<railway-target-domain>` | DNS only (Railway requires this) |

> Railway will provide the exact CNAME target when you add the custom domain in Railway settings.

## 6. Railway backend configuration

1. Open your Railway project.
2. Go to the Flask service → **Settings** → **Domains**.
3. Click **Generate domain** or **Custom domain**, then enter `api.pivotteam.online`.
4. Copy the CNAME target Railway gives you.
5. Add the CNAME record in your DNS (see step 5).
6. In **Variables**, set:
   - `FRONTEND_URL=https://app.pivotteam.online`
   - `EMAIL_FROM=Pivot <noreply@pivotteam.online>` (already set)
7. Redeploy if Railway does not auto-deploy.

## 7. Resend email domain setup

1. Go to [Resend Domains](https://resend.com/domains).
2. Add `pivotteam.online`.
3. Add the DNS records Resend provides (SPF, DKIM, DMARC).
4. Wait for verification.

## 8. CORS

Backend CORS is already configured in `pivot-backend/app.py` to allow:

- `https://app.pivotteam.online`
- `https://www.pivotteam.online`
- `https://pivotteam.online`
- Existing WorkBuddy CloudStudio URL
- Local dev (`localhost:5173`)

If you add another frontend domain, set the `FRONTEND_URL` Railway variable.

## 9. Verify everything

After DNS propagates:

```bash
curl -I https://app.pivotteam.online
curl -I https://api.pivotteam.online
```

Both should return HTTP 200.

Then log in with the demo coach account to confirm the frontend can reach the backend.
