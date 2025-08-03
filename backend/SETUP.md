# AI Companion Setup Guide

## 🔑 API Key Configuration

### 1. Get Your Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

### 2. Create Environment File
Create a `.env` file in the `backend/` directory:

```env
# AI Companion Configuration
GEMINI_API_KEY=your_actual_gemini_api_key_here

# Server Configuration
PORT=4000
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

### 3. Security Best Practices
- ✅ Never commit your `.env` file to version control
- ✅ Use different API keys for development and production
- ✅ Regularly rotate your API keys
- ✅ Monitor your API usage to avoid unexpected charges

## 🚀 Running the Application

### Backend Setup
```bash
cd backend
npm install
npm run dev
```

### Frontend Setup
```bash
# In a new terminal
npm install
npm run dev
```

## 🔧 Troubleshooting

### Common Issues

1. **"Invalid or missing Gemini API key"**
   - Check that your `.env` file exists in the `backend/` directory
   - Verify the API key is correct and active
   - Ensure no extra spaces or quotes around the key

2. **Generic AI responses**
   - The API key might have limited quota
   - Check your Google AI Studio dashboard for usage limits
   - Consider upgrading your API plan if needed

3. **Connection errors**
   - Ensure the backend is running on port 4000
   - Check that CORS_ORIGIN matches your frontend URL
   - Verify network connectivity

### API Key Limits
- Free tier: 15 requests per minute
- Paid tier: Higher limits based on your plan
- Monitor usage at: https://makersuite.google.com/app/apikey

## 📝 Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `GEMINI_API_KEY` | Your Google Gemini API key | - | ✅ |
| `PORT` | Backend server port | 4000 | ❌ |
| `CORS_ORIGIN` | Frontend URL for CORS | http://localhost:5173 | ❌ |
| `NODE_ENV` | Environment mode | development | ❌ |

## 🎯 Next Steps

1. Test your AI companion with different personalities
2. Customize the conversation prompts in `backend/server.js`
3. Monitor API usage and costs
4. Consider implementing conversation history persistence 