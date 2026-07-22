# Dynamic Clover Menu Display

Digital menu board application powered by Clover POS REST API v3.

## Deployment on Cloudflare Pages

### Option A: Via GitHub (Recommended)
1. Push this project folder to your GitHub repository.
2. Go to the [Cloudflare Dashboard](https://dash.cloudflare.com/) -> **Workers & Pages**.
3. Click **Create Application** -> **Pages** -> **Connect to Git**.
4. Select your repository.
5. Set Build Settings:
   - **Framework preset**: `None`
   - **Build command**: *(leave blank)*
   - **Build output directory**: `/` or `.`
6. Click **Save and Deploy**.

### Option B: Direct Deployment via Wrangler CLI
Run the following command in your terminal:
```bash
npx wrangler pages deploy . --project-name=clover-menu-screens
```
