# ART-AI Deployment Guide

## Vercel (Frontend)

### 1. Environment Variables
In your Vercel project settings → Environment Variables, add:

```
VITE_API_URL=https://your-backend.onrender.com
```

**Important:** No trailing slash.

### 2. Build Settings
- Framework Preset: **Vite**
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

### 3. Redeploy
After setting the environment variable, trigger a new deployment so Vite bakes the API URL into the bundle.

---

## Render (Backend)

### 1. Environment Variables
In your Render dashboard → Environment, add:

```
SECRET_KEY=<generate with: openssl rand -hex 32>
FRONTEND_URL=https://your-app.vercel.app
API_BASE_URL=https://your-backend.onrender.com
DATABASE_URL=sqlite:///./art_ai.db
```

Optional (for Vercel preview URLs):
```
EXTRA_ORIGINS=https://your-app-git-branch.vercel.app,https://another-preview.vercel.app
```

### 2. Start Command
```
uvicorn art_ai.main:app --host 0.0.0.0 --port $PORT
```

Render automatically sets the `$PORT` environment variable (usually 10000).

### 3. Disk Persistence Warning
**Render free tier has ephemeral storage.** Your SQLite database (`art_ai.db`) and generated images (`uploads/generated/`) will be **deleted on every deploy or restart**.

**Solutions:**
- Upgrade to Render's paid plan with persistent disk ($7/mo+)
- Switch to PostgreSQL (free tier available on Render)
- Use cloud storage for images (AWS S3, Cloudflare R2, etc.)

---

## What Works in Production

✅ User registration and login  
✅ AI image generation (Pollinations API)  
✅ AI chat copilot (Pollinations text API)  
✅ Compliance report generation  
✅ RL simulation in sandboxed environments  

---

## What Won't Work

❌ **Network Scanner** — Render blocks outbound connections to most ports. The scanner will return 0 open ports even on valid targets. This is a platform restriction, not a code bug.

**Workarounds:**
- Deploy the scanner endpoint to a different platform (AWS Lambda, DigitalOcean, VPS with no outbound restrictions)
- Accept that scanning only works locally
- Display a "scanner unavailable in cloud deployment" message

---

## Database Migration to PostgreSQL (Optional)

If you want persistent data on Render free tier:

### 1. Create a PostgreSQL database on Render
Go to Render Dashboard → New → PostgreSQL (free tier available)

### 2. Update backend environment variables
```
DATABASE_URL=postgresql://user:pass@host:5432/dbname
```

Use the **Internal Database URL** from Render's PostgreSQL dashboard.

### 3. Install psycopg2
Add to `requirements.txt`:
```
psycopg2-binary>=2.9.0
```

### 4. Redeploy
The database tables will be created automatically on startup. SQLite and PostgreSQL both work with SQLAlchemy without code changes.

---

## Testing the Deployment

### 1. Verify CORS
Visit your Vercel frontend and open browser DevTools → Console. If you see CORS errors, double-check:
- `FRONTEND_URL` is set correctly in Render
- `VITE_API_URL` is set correctly in Vercel
- Both URLs have no trailing slashes
- You redeployed after setting the variables

### 2. Verify API connectivity
Open your frontend and check the dashboard. The "AI Engine" metric should show "UP" if Pollinations is reachable.

### 3. Debug endpoint
Visit: `https://your-backend.onrender.com/debug`

It should return:
```json
{
  "frontend_url": "https://your-app.vercel.app",
  "origins": ["https://your-app.vercel.app", "http://127.0.0.1:5173", "http://localhost:5173"]
}
```

---

## Common Issues

### API calls fail with "Failed to fetch"
- Check that `VITE_API_URL` is set in Vercel
- Redeploy the frontend after setting it
- Verify the backend URL is reachable: `curl https://your-backend.onrender.com/health`

### CORS errors in browser console
- Verify `FRONTEND_URL` in Render matches your Vercel URL exactly
- No trailing slashes
- Redeploy the backend after changing it

### "Network Scanner returns 0 ports"
- Expected behavior on Render. Outbound TCP connections are blocked on non-standard ports.
- Works fine locally with `uvicorn art_ai.main:app --reload`

### All users disappear after restart
- SQLite on Render free tier is ephemeral
- Upgrade to persistent disk ($7/mo) or migrate to PostgreSQL (free)

---

## Local Development

Both frontend and backend work perfectly locally:

**Backend:**
```bash
cd backend
venv/Scripts/activate  # Windows
source venv/bin/activate  # macOS/Linux
uvicorn art_ai.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm run dev
```

The network scanner works fully in local development.

---

## Security Notes

- Never commit `.env` files
- Generate a strong `SECRET_KEY` for production (32+ random bytes)
- The network scanner should only be used on **authorized targets you own or have written permission to test**
- All offensive security features (scanner, simulation, exploits) are designed for **sandboxed environments and authorized testing only**

---

## Support

If CORS or connectivity issues persist:
1. Visit `/debug` on your backend
2. Check Render logs for startup errors
3. Check Vercel deployment logs for build errors
4. Verify both services are running (not in "sleeping" state on free tier)
