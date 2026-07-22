# 🚀 Project Deployment & Configuration Guide

All project configuration, repository links, Cloudflare Workers settings, and simple 1-click deployment commands are documented here.

---

## 1. Quick One-Command Deploy & Commit

Whenever you edit any code (`app.js`, `style.css`, `index.html`), simply open your terminal and run:

```bash
python3 deploy.py
```

This single script will automatically:
1. Rebuild `_worker.js` with your latest HTML, CSS, JavaScript, and background image assets.
2. Deploy the updated application directly to **Cloudflare Worker** (`screens.testking932.workers.dev`).
3. Commit and push your code to **GitHub** (`https://github.com/testking932-star/Screens.git`).

---

## 2. Live Website & Credentials

- **Live Site URL**: [https://screens.testking932.workers.dev](https://screens.testking932.workers.dev)
- **Website Access Credentials**:
  - **Username**: `Kushi`
  - **Password**: `Kgf@2025`

---

## 3. GitHub & Repository Details

- **GitHub Repository**: [https://github.com/testking932-star/Screens](https://github.com/testking932-star/Screens)
- **Git Remote**: `https://github.com/testking932-star/Screens.git`
- **Default Branch**: `main`

---

## 4. Cloudflare Worker API & Security Details

- **Account ID**: `9fdc6d6dd3fbc47ec09bc39dcd9ad81a`
- **Worker Name**: `screens`
- **Local Secret File**: `.env` (contains `CLOUDFLARE_API_TOKEN` and `SERVER_CLOVER_TOKEN`)

> 🔒 *Note: The Clover Merchant ID and Access Token are injected strictly on Cloudflare's serverless edge and are never exposed in public client browser code or public GitHub commits.*
