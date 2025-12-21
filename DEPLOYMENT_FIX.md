# Fix: Supabase Package Not Found

## The Problem
Render can't find `@supabase/supabase-js` because the package isn't being installed during the build.

## Solution

### Step 1: Verify package.json is Updated
Make sure `backend/package.json` includes:
```json
"@supabase/supabase-js": "^2.39.0"
```

### Step 2: Commit and Push Changes
```bash
git add backend/package.json render.yaml
git commit -m "Add Supabase dependency and update render config"
git push origin main
```

### Step 3: Check Render Configuration

In your Render dashboard, verify:

1. **Root Directory**: Should be `backend`
2. **Build Command**: Should be `npm install` (or `npm install --legacy-peer-deps`)
3. **Start Command**: Should be `npm start`

### Step 4: Manual Deploy (if needed)

If automatic deploy doesn't work:

1. Go to Render dashboard
2. Click **Manual Deploy** → **Deploy latest commit**
3. Watch the build logs to ensure `npm install` runs and installs `@supabase/supabase-js`

### Step 5: Verify Installation

In the build logs, you should see:
```
added 1 package, and audited X packages
```

If you see errors about the package, the `package.json` might not be committed yet.

## Alternative: Manual Package Installation

If the above doesn't work, you can also:

1. In Render dashboard, go to your service
2. Go to **Shell** tab (if available)
3. Run: `cd backend && npm install @supabase/supabase-js`

But this is temporary - the proper fix is to ensure `package.json` is committed.

## Verify Files Are Committed

Run this to check:
```bash
git status
git log --oneline -5
```

Make sure `backend/package.json` shows as committed (not in "Changes not staged" or "Untracked files").

