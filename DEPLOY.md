# Jitox — live URLs & client APK testing

## Production URLs

| Service | URL |
|---------|-----|
| **API (Render)** | https://jitox.onrender.com |
| **Web dashboard (Vercel)** | https://jitox.vercel.app |

Health check: `GET https://jitox.onrender.com/` → `{"ok":true,"service":"jitox-api"}`

## After pushing to `main`

1. **Render** — auto-deploys `Code/Jitox-api` if the service is connected to `Shubham-Radadiya/jitox`.
   - Root directory: `Code/Jitox-api`
   - Build: `npm install --include=dev && npm run build`
   - Start: `npm start`
   - Required env: `MONGO_URI`, `JWT_SECRET_KEY`, `NODE_ENV=production`
   - Optional: `ALLOW_BOOTSTRAP_USERS=true` (seeds default admin + sample territories on deploy)

2. **Vercel** — auto-deploys dashboard. Set:
   - `VITE_API_BASE_URL` = `https://jitox.onrender.com`

## Default login (when bootstrap enabled)

- Admin: `admin@gmail.com` / `123456`
- Manager: `manager@gmail.com` / `123456`
- User: `testuser@gmail.com` / `123456`

## App launch flow (after fix)

1. Splash → Onboarding (first time only) or **Login**
2. After successful login → Home (field dashboard)
3. Leave / Task screens open only when the user navigates there — not on cold start

If an old APK still opens Leave directly: uninstall the app, install the new APK, or use **Logout** in the drawer.

## Build Android APK (points to live API)

From `Code/jitox_agro_app`:

```bash
flutter pub get
flutter build apk --release --dart-define=API_BASE_URL=https://jitox.onrender.com
```

APK path: `build/app/outputs/flutter-apk/app-release.apk`

Share that file with the client. First API request after idle may take ~30s (Render free tier cold start).
