# Render Deployment Guide

## Backend Deployment (Updated)

### Option 1: Using render.yaml (Recommended)
The `render.yaml` file in the root directory will automatically configure your Render service. Just connect your GitHub repository to Render and it will use these settings:

- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### Option 2: Manual Configuration
If you prefer to configure manually in the Render dashboard:

### 1. Environment Variables in Render Dashboard
Set these environment variables in your Render service:

```
GEMINI_API_KEY=your_gemini_api_key_here
MONGODB_URI=your_mongodb_connection_string
PORT=4000
CORS_ORIGIN=https://your-vercel-app.vercel.app
JWT_SECRET=your_jwt_secret_here
```

### 2. Build Command
```
npm install
```

### 3. Start Command
```
npm start
```

### 4. Root Directory
```
backend
```

**Important**: If Root Directory is set to `backend`, do NOT include `cd backend` in your build/start commands!

## Frontend Deployment (Vercel)

### 1. Update API Configuration
Your frontend is already configured to use the Render backend in production.

### 2. Environment Variables (if needed)
Set in Vercel dashboard:
```
NODE_ENV=production
```

## Security Notes

⚠️ **IMPORTANT**: 
- Never commit `config.env` to GitHub
- Add `config.env` to `.gitignore`
- Use environment variables in deployment platforms 