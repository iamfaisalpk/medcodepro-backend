# Backend Deployment Guide for Render

## Problem Fixed

The deployment error occurred because Render was looking for `/opt/render/project/src/src/server.js` (duplicate path) and trying to run the TypeScript source directly instead of the compiled JavaScript.

## Solution Applied

### 1. Created `render.yaml` Configuration

- **Build Command**: `npm install && npm run build` - Installs dependencies and compiles TypeScript
- **Start Command**: `npm start` - Runs the compiled `dist/server.js`
- **Environment Variables**: Configured all required env vars (you need to set their values in Render dashboard)

### 2. Updated `package.json`

- Added `postinstall` script to automatically build after npm install
- Ensures TypeScript is compiled to JavaScript before deployment

## Deployment Steps on Render

### Step 1: Push Your Code to GitHub

```bash
cd "c:\Users\hp\Desktop\Medical coding Track.app\Backend"
git add .
git commit -m "Fix deployment configuration"
git push origin main
```

### Step 2: Configure Render Dashboard

1. Go to your Render dashboard
2. Select your backend service
3. Go to **Settings** → **Build & Deploy**
4. Verify these settings:
   - **Root Directory**: Leave empty (or set to `Backend` if deploying from monorepo)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

### Step 3: Set Environment Variables

In Render Dashboard → **Environment** tab, add these variables:

**Required Variables:**

- `NODE_ENV` = `production`
- `MONGODB_URI` = Your MongoDB connection string
- `JWT_SECRET` = Your secret key (generate a strong random string)
- `JWT_EXPIRE` = `7d`
- `COOKIE_EXPIRE` = `7`
- `EMAIL_HOST` = Your SMTP host (e.g., smtp.gmail.com)
- `EMAIL_PORT` = Your SMTP port (e.g., 587)
- `EMAIL_USER` = Your email address
- `EMAIL_PASS` = Your email password/app password
- `EMAIL_FROM` = Your sender email
- `FRONTEND_URL` = Your frontend URL (e.g., https://your-app.vercel.app)

### Step 4: Deploy

1. Click **Manual Deploy** → **Deploy latest commit**
2. Watch the build logs
3. Deployment should succeed!

## Troubleshooting

### If Build Fails:

- Check that `tsconfig.json` exists in your Backend folder
- Verify all TypeScript dependencies are in `package.json`
- Check build logs for specific errors

### If Start Fails:

- Ensure `dist/server.js` was created during build
- Check that all environment variables are set
- Verify MongoDB connection string is correct

### If Module Not Found:

- Make sure `node_modules` is not in `.gitignore`
- Ensure `npm install` runs successfully in build logs

## File Structure Expected by Render

```
Backend/
├── src/
│   ├── server.ts (TypeScript source)
│   └── ... (other TypeScript files)
├── dist/
│   ├── server.js (Compiled JavaScript - created during build)
│   └── ... (other compiled files)
├── package.json
├── tsconfig.json
├── render.yaml (NEW - deployment config)
└── .env (local only, not deployed)
```

## Important Notes

1. **Never commit `.env` file** - Use Render's environment variables instead
2. **TypeScript is compiled during deployment** - The `dist` folder is created on Render's servers
3. **Build time**: First deployment may take 3-5 minutes
4. **Free tier limitations**:
   - Service spins down after 15 minutes of inactivity
   - First request after spin-down takes 30-60 seconds

## Success Indicators

✅ Build logs show: "TypeScript compilation successful"
✅ Start logs show: "Server running on port XXXX"
✅ Service status shows: "Live"
✅ API endpoints respond correctly

## Next Steps After Deployment

1. Test your API endpoints using the Render URL
2. Update your frontend `NEXT_PUBLIC_API_URL` to point to Render backend
3. Test authentication flow end-to-end
4. Monitor logs for any runtime errors
