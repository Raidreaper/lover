# Render Deployment Guide

## Backend Deployment (Updated)

### 1. Environment Variables in Render Dashboard
Set these environment variables in your Render service:

```
GEMINI_API_KEY=AIzaSyD0vDWiSPZe2A7-O3ocsxD3s73CLgy13oE
MONGODB_URI=mongodb+srv://kteams200:RemGUNZhXdPySZMe@cluster0.stsut.mongodb.net/lovers_code?retryWrites=true&w=majority
PORT=4000
CORS_ORIGIN=https://your-vercel-app.vercel.app
JWT_SECRET=e9f72e1509ab69be9c2d9f3f8a45164b
```

### 2. Build Command
```
cd backend && npm install
```

### 3. Start Command
```
cd backend && node server.js
```

### 4. Root Directory
```
backend
```

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