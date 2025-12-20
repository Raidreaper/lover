# Quick Supabase Setup - Your Credentials

## ✅ Your Supabase Credentials

- **Project URL**: `https://otwuwkbcoxujqejhjouw.supabase.co`
- **Anon/Public Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90d3V3a2Jjb3h1anFlamhqb3V3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyNTE4NTAsImV4cCI6MjA4MTgyNzg1MH0.WYX3wzFgzIU0SWS08GVUJyp7uE0OOqzQ1JyaImQROGQ`

## ✅ Correct Key Found

You're using the **anon/public** key, which is correct! This is the key that should be used in your environment variables.

## 🚀 Setup Steps

### Step 1: Run the Database Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Click **New Query**
3. Open `backend/supabase-schema.sql` from this project
4. Copy and paste the entire SQL into the editor
5. Click **Run** (or press Ctrl+Enter)

This creates all necessary tables.

### Step 2: Set Environment Variables in Render

1. Go to your Render dashboard: https://dashboard.render.com
2. Select your `lover` service
3. Go to **Environment** tab
4. Add/Update these variables:

```
SUPABASE_URL=https://otwuwkbcoxujqejhjouw.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90d3V3a2Jjb3h1anFlamhqb3V3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyNTE4NTAsImV4cCI6MjA4MTgyNzg1MH0.WYX3wzFgzIU0SWS08GVUJyp7uE0OOqzQ1JyaImQROGQ
```

**Important**: This is the anon/public key - safe to use in your backend. Never use the service_role key in client-side code or expose it publicly.

5. Click **Save Changes**

### Step 3: Deploy

Render will automatically redeploy when you save the environment variables. Or manually trigger a deploy.

### Step 4: Verify Connection

After deployment, check your Render logs. You should see:

```
✅ Supabase connected successfully
```

If you see a warning about tables not existing, go back to Step 1 and make sure you ran the SQL schema.

## 🔍 Troubleshooting

### "Supabase connection test failed"
- Make sure you ran the SQL schema (Step 1)
- Verify the `SUPABASE_ANON_KEY` is correct (check Settings → API)
- Check that RLS policies allow operations (the schema sets permissive policies)

### "User not found" after registration
- Check Supabase logs in the dashboard
- Verify the `users` table exists
- Check that RLS policies are set correctly

### Still using SQLite?
- Check environment variables are saved in Render
- Look for connection errors in logs
- Verify the Supabase URL format is correct (no trailing slash)

## 📝 Next Steps

Once Supabase is connected:
- Test user registration
- Test user login
- Check Supabase dashboard to see data being created
- Consider setting up database backups

