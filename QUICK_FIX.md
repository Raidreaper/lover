# Quick Fix for Supabase Package Error

## The Issue
Render can't find `@supabase/supabase-js` because it's not being installed during build.

## Immediate Solution

### Option 1: Commit and Push (Recommended)

The `backend/package.json` already has the Supabase dependency. You just need to:

1. **Commit the render.yaml change:**
   ```bash
   git add render.yaml
   git commit -m "Update render.yaml build config"
   git push origin main
   ```

2. **Render will automatically redeploy** and should install the package.

### Option 2: Manual Build Command Update in Render

If the above doesn't work:

1. Go to Render dashboard → Your service → Settings
2. Find **Build Command**
3. Change it to: `npm install`
4. Make sure **Root Directory** is set to: `backend`
5. Click **Save Changes**
6. Trigger a manual deploy

### Option 3: Verify Package Installation

Check the build logs in Render. You should see:
```
added 1 package, and audited X packages
```

If you see errors, the package might not be in package.json. Verify:
```bash
grep "@supabase/supabase-js" backend/package.json
```

Should show: `"@supabase/supabase-js": "^2.39.0"`

## Why This Happened

The `@supabase/supabase-js` package was added to `backend/package.json`, but Render needs to:
1. See the updated package.json (already committed ✓)
2. Run `npm install` in the `backend` directory during build
3. The `render.yaml` ensures this happens

## After Fix

Once deployed successfully, you should see in logs:
```
✅ Supabase connected successfully
```

Or if tables don't exist yet:
```
⚠️  Supabase connection test failed: ... (This is normal if tables don't exist yet)
```

Then run the SQL schema in Supabase dashboard.

