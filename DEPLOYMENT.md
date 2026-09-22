# Deploying bibig for free

This guide uses Cloudflare Pages for the React site, Render for the Express API,
and Supabase for PostgreSQL. It retains the existing application architecture and
gives the Android app and the website one HTTPS API.

Free services are suitable for a hobby application. Render sleeps a free API after
15 minutes without traffic, so the first API request after idle can take about a
minute. Supabase pauses an inactive free project after one week. Do not use Render's
free PostgreSQL service for persistent data because it expires after 30 days.

## 1. Put the project in a private GitHub repository

From the project root:

```powershell
git init
git add .
git commit -m "Prepare bibig for deployment"
git branch -M main
git remote add origin https://github.com/OriTauber/bibig.git
git push -u origin main
```

Create the GitHub repository without adding a README, `.gitignore`, or license
first. The included `.gitignore` prevents environment files, Android build output,
and signing material from being committed.

## 2. Create the Supabase PostgreSQL database

1. Create a free Supabase project and save its database password privately.
2. In **Connect**, copy the direct PostgreSQL URI. Use the URI with SSL enabled;
   it normally includes `sslmode=require`.
3. Temporarily set `DATABASE_URL` in your local `backend/.env` to that URI.
4. Run the migrations from the project root:

   ```powershell
   npm run backend:migrate
   ```

5. Restore your local database URI afterward if you still want local development.

The deployed API needs the same Supabase URI as its `DATABASE_URL` environment
variable. Never put this URI in the frontend `.env` or Cloudflare Pages settings.

## 3. Deploy the API to Render

1. In Render, choose **New** → **Blueprint** and select the GitHub repository.
   Render reads `render.yaml` and creates the `bibig-api` free web service.
2. Add these Render environment variables:

   ```text
   DATABASE_URL=<your Supabase PostgreSQL URI>
   GOOGLE_CLIENT_IDS=<web-client-id>,<android-client-id>
   CORS_ORIGINS=https://YOUR_PROJECT.pages.dev
   ```

3. Deploy, then open:

   ```text
   https://YOUR_RENDER_SERVICE.onrender.com/api/health
   ```

   It must return `{ "status": "ok" }`.

Keep the generated `JWT_SECRET`; do not replace it with the local development
secret. Add a custom web domain to `CORS_ORIGINS` later, separated with a comma.

## 4. Deploy the web app to Cloudflare Pages

1. In Cloudflare Pages, create a project from the same GitHub repository.
2. Use these build settings:

   ```text
   Build command: npm run build
   Build output directory: dist
   ```

3. Add production environment variables:

   ```text
   VITE_API_URL=https://YOUR_RENDER_SERVICE.onrender.com/api
   VITE_GOOGLE_CLIENT_ID=<web-client-id>
   ```

4. Deploy and copy the resulting `https://YOUR_PROJECT.pages.dev` address.
5. Update Render's `CORS_ORIGINS` to that exact address and redeploy the API.
6. In Google Cloud Console, add that exact address under **Authorized JavaScript
   origins** for the same Web OAuth client ID, then redeploy Cloudflare Pages if
   you changed its environment variables.

## 5. Point Android at the deployed HTTPS API

In the root `.env`, set:

```text
VITE_API_URL=https://YOUR_RENDER_SERVICE.onrender.com/api
```

Then build and sync Android:

```powershell
npm run android:sync
```

Open Android Studio and run the app, or build a release APK. HTTPS removes the
need for the current local-network HTTP setup. Do not commit this root `.env`.

## Post-deployment checks

1. Register and log in from the published website.
2. Use Google sign-in from both website and Android.
3. Create a workout on one client and confirm it appears after signing in on the
   other.
4. Test the API health URL after the service has been idle; the first request can
   be delayed while Render wakes it.

