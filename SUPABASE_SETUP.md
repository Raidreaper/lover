# Supabase Setup Guide

This guide will help you set up Supabase to replace MongoDB for your Lover's Code backend.

## 🚀 Quick Start

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Name**: `lovers-code` (or your preferred name)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to your Render deployment
   - **Pricing Plan**: Free tier is perfect to start

### 2. Get Your Supabase Credentials

Once your project is created:

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (this is your `SUPABASE_URL`)
   - **anon/public key** (this is your `SUPABASE_ANON_KEY`)

### 3. Set Up the Database Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Click **New Query**
3. Copy and paste the contents of `backend/supabase-schema.sql`
4. Click **Run** to execute the schema

This will create:
- `users` table for authentication
- `ai_conversations` table for AI chat sessions
- `ai_messages` table for conversation messages
- All necessary indexes and triggers

### 4. Configure Environment Variables

#### For Render Deployment:

1. Go to your Render dashboard
2. Select your service
3. Go to **Environment** tab
4. Add these variables:

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

**Remove** the old `MONGODB_URI` variable if it exists.

#### For Local Development:

Create a `.env` file in the `backend/` directory:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_jwt_secret
PORT=4000
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

### 5. Install Dependencies

```bash
cd backend
npm install
```

This will install `@supabase/supabase-js` which is already added to `package.json`.

### 6. Deploy

1. Commit your changes:
   ```bash
   git add .
   git commit -m "Migrate from MongoDB to Supabase"
   git push origin main
   ```

2. Render will automatically redeploy with the new configuration

## ✅ Verification

After deployment, check your Render logs. You should see:

```
✅ Supabase connected successfully
```

If you see warnings about tables not existing, make sure you ran the SQL schema in step 3.

## 🔄 Migration from MongoDB

If you have existing MongoDB data:

1. Export your MongoDB data
2. Transform it to match the Supabase schema
3. Use Supabase's import tools or write a migration script

For now, new users will be created in Supabase, and the app will fall back to SQLite if Supabase is unavailable.

## 🎯 Benefits of Supabase

- ✅ **PostgreSQL**: Robust, SQL-based database
- ✅ **Real-time**: Built-in real-time subscriptions
- ✅ **Authentication**: Can use Supabase Auth (optional)
- ✅ **Storage**: File storage available
- ✅ **Free Tier**: Generous free tier for development
- ✅ **No DNS Issues**: HTTP-based, no connection string problems
- ✅ **Better with Render**: Works seamlessly with Render deployments

## 🔒 Security Notes

- The `SUPABASE_ANON_KEY` is safe to use in client-side code (it's public)
- Row Level Security (RLS) is enabled but permissive by default
- For production, consider tightening RLS policies
- Never commit your `.env` file to version control

## 🆘 Troubleshooting

### "Supabase connection test failed"
- Make sure you ran the SQL schema
- Check that your `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct
- Verify your Supabase project is active

### "User not found" errors
- Check that the `users` table exists
- Verify RLS policies allow operations
- Check Supabase logs in the dashboard

### Still using SQLite?
- The app falls back to SQLite if Supabase is unavailable
- Check your environment variables are set correctly
- Look for connection errors in the logs

## 📚 Next Steps

- Consider using Supabase Auth for authentication (replaces JWT)
- Use Supabase Storage for file uploads
- Enable real-time features for multiplayer
- Set up database backups in Supabase dashboard

