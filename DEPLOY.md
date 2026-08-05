# Deploying 7osa

7osa is a **server-rendered Next.js app** (server actions, middleware, SSR that talks to
Supabase). It needs a **live Node.js process** — it cannot be uploaded as static files to
plain shared hosting. The Supabase backend is already hosted, so only this frontend deploys.

Production build is verified (`npm run build` passes, all routes compile).

## Environment variables (required on the host)

```
NEXT_PUBLIC_SUPABASE_URL=https://xgjywqhkdwuhbypnooow.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_Z6FZOiEsjWnhKpnKjnMwpg_O2HZtyHZ
```

Both are safe to expose (publishable/anon, guarded by RLS). No service-role key is needed —
every privileged write goes through a security-definer RPC. The app listens on `$PORT`
(defaults to 3000) — set `PORT` if your host expects a specific one.

---

## Path A — Hostinger VPS / Cloud (recommended: full Node.js)

SSH into the VPS, then:

```bash
# 1. Node 20+ (once)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git nginx
sudo npm i -g pm2

# 2. Get the code
git clone https://github.com/mustafaalhaffar1-lab/7osa.git
cd 7osa

# 3. Env + build
printf 'NEXT_PUBLIC_SUPABASE_URL=https://xgjywqhkdwuhbypnooow.supabase.co\nNEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_Z6FZOiEsjWnhKpnKjnMwpg_O2HZtyHZ\nPORT=3000\n' > .env.local
npm ci
npm run build

# 4. Run + keep alive
pm2 start "npm run start" --name 7osa
pm2 save && pm2 startup   # run the command it prints
```

Point your domain at it with nginx (`/etc/nginx/sites-available/7osa`):

```nginx
server {
  listen 80;
  server_name 7osa.ae www.7osa.ae;   # your domain
  location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/7osa /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d 7osa.ae -d www.7osa.ae   # free HTTPS
```

Redeploy after a push: `git pull && npm ci && npm run build && pm2 restart 7osa`.

---

## Path B — Hostinger shared Web Hosting (hPanel "Node.js App")

Only if your plan has **hPanel → Advanced → Setup Node.js App**. Passenger-based; works for
SSR but is more limited than a VPS.

1. Create a Node.js app: Node 20, application root = the uploaded project, startup file per
   Hostinger's Next guide (`node_modules/next/dist/bin/next` with `start`, or a small
   `server.js`). Set the two env vars in the app's Environment section.
2. Upload the repo (Git deploy in hPanel, or SFTP). Run `npm install` then `npm run build`
   from the app's terminal/NPM panel.
3. Start the app. Map your domain to it in hPanel.

If the Node.js App tool isn't in your plan, use Path A (VPS) or Path C.

---

## Path C — keep the domain on Hostinger, host the app on Vercel (easiest)

1. vercel.com/new → import `mustafaalhaffar1-lab/7osa` (authorize the private repo).
2. Framework auto-detects Next.js. Add the two env vars above. Deploy.
3. Every `git push` to `main` auto-deploys.
4. Add your custom domain in Vercel → it shows the DNS records; add those in Hostinger's DNS
   zone editor (an `A`/`CNAME` for the apex + `www`).

---

## After deploying (any path) — Supabase Auth

In Supabase → Authentication → URL Configuration, set:
- **Site URL**: your production URL (e.g. `https://7osa.ae`)
- **Redirect URLs**: add the same origin.

Real sign-ups currently require **email confirmation** (Authentication → Providers → Email).
Turn it off for a frictionless demo, or leave on for production (needs email delivery — SMTP
or a provider).
