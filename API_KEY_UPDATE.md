# API Key Update Instructions

## New Gemini API Key

The new Gemini API key has been provided:
- **API Key**: `AIzaSyBVNBQXgd8fhONW51KR1GQxms4Ltz8_Aos`
- **Name**: `mindspace-ai`
- **Project**: `projects/184348418469`

## How to Update

### For Render Deployment:

1. Go to your Render Dashboard: https://dashboard.render.com
2. Navigate to your service: `lover` (srv-d27qeqggjchc738jbdag)
3. Go to **Environment** tab
4. Find the `GEMINI_API_KEY` environment variable
5. Update the value to: `AIzaSyBVNBQXgd8fhONW51KR1GQxms4Ltz8_Aos`
6. Click **Save Changes**
7. The service will automatically redeploy

### For Local Development:

Update your `backend/.env` file:
```
GEMINI_API_KEY=AIzaSyBVNBQXgd8fhONW51KR1GQxms4Ltz8_Aos
```

**Note**: Never commit API keys to git. They should only be stored in environment variables.

