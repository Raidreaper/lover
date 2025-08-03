# Lover's Code Backend Server

A fortified, production-ready backend server for the Lover's Code application with comprehensive security, monitoring, and performance optimizations.

## 🛡️ Security Features

### **Rate Limiting**
- **General API**: 100 requests per 15 minutes per IP
- **AI Endpoints**: 10 requests per minute per IP
- **Speed Limiting**: Progressive delays after 50 requests per 15 minutes

### **Security Headers**
- **Helmet.js**: Comprehensive security headers
- **Content Security Policy**: XSS protection
- **CORS**: Strict origin validation
- **Input Validation**: All inputs sanitized and validated

### **Input Sanitization**
- **Message Length**: Max 2000 characters
- **Companion Name**: Max 50 characters
- **Personality/Identity**: Max 1000 characters each
- **Role**: Max 500 characters
- **JSON Validation**: Strict JSON parsing with limits

## 📊 Monitoring & Logging

### **Real-time Monitoring**
- Request/response logging
- AI request success/failure tracking
- Memory usage monitoring
- Connection tracking
- Error logging with context

### **Health Checks**
- `/health` - Basic health status
- `/api/stats` - Detailed performance metrics
- Automatic health monitoring every 5 minutes

### **Log Files**
- `logs/requests.log` - All HTTP requests
- `logs/ai-requests.log` - AI API interactions
- `logs/errors.log` - Error tracking
- `logs/server-stats.log` - Periodic statistics

### **Auto-cleanup**
- Log files older than 7 days automatically deleted
- Memory usage optimization
- Inactive session cleanup (30 minutes)

## 🚀 Performance Optimizations

### **Connection Management**
- WebSocket optimization with ping/pong
- Connection pooling
- Graceful disconnection handling
- Session cleanup

### **Memory Management**
- Response time tracking (last 1000 requests)
- Memory usage monitoring
- Automatic garbage collection
- Memory leak prevention

### **Error Handling**
- Comprehensive error catching
- Graceful degradation
- Fallback responses
- Exponential backoff for API retries

## 🔧 API Endpoints

### **Health & Monitoring**
```
GET /health          - Server health status
GET /api/stats       - Detailed performance metrics
GET /api/sessions/:id - Session information
```

### **AI Companion**
```
POST /api/ai-companion/initialize - Initialize AI companion
POST /api/ai-companion/chat       - Chat with AI companion
```

### **WebSocket Events**
```
join-session         - Join a chat session
chat message         - Send/receive messages
ask-question         - Ask questions
question-answer      - Answer questions
```

## 🛠️ Installation & Setup

### **Prerequisites**
- Node.js 18+ 
- npm or yarn

### **Installation**
```bash
cd backend
npm install
```

### **Environment Variables**
Create a `.env` file:
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=4000
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

### **Running the Server**
```bash
# Development
npm run dev

# Production
npm start
```

## 🔍 Monitoring Dashboard

### **Health Metrics**
- **Uptime**: Server uptime in days/hours/minutes
- **Request Success Rate**: Percentage of successful requests
- **AI Success Rate**: Percentage of successful AI responses
- **Memory Usage**: Current memory consumption
- **Active Connections**: Real-time connection count

### **Performance Metrics**
- **Average Response Time**: Mean response time
- **Peak Connections**: Maximum concurrent connections
- **Error Rate**: Percentage of failed requests
- **AI Failure Rate**: Percentage of AI API failures

## 🚨 Alerts & Thresholds

### **Health Alerts**
- **Memory Usage > 1GB**: Server considered unhealthy
- **Error Rate > 20%**: High error rate alert
- **AI Failure Rate > 50%**: AI service issues

### **Performance Thresholds**
- **Response Time > 5s**: Slow response alert
- **Connection Count > 100**: High load alert
- **Memory Usage > 800MB**: Memory warning

## 🔒 Security Best Practices

### **Input Validation**
- All user inputs are validated and sanitized
- Length limits prevent DoS attacks
- Type checking prevents injection attacks

### **Rate Limiting**
- Prevents abuse and DoS attacks
- Configurable limits per endpoint
- IP-based tracking

### **Error Handling**
- No sensitive information in error messages
- Comprehensive error logging
- Graceful degradation

### **CORS Protection**
- Strict origin validation
- Configurable allowed origins
- Credential handling

## 📈 Scaling Considerations

### **Horizontal Scaling**
- Stateless design for easy scaling
- Session management via Redis (future)
- Load balancer ready

### **Vertical Scaling**
- Memory monitoring and optimization
- Connection pooling
- Efficient resource usage

### **Monitoring**
- Real-time metrics collection
- Performance tracking
- Alert system

## 🐛 Troubleshooting

### **Common Issues**

1. **AI API Failures**
   - Check Gemini API key
   - Verify API quota
   - Check network connectivity

2. **High Memory Usage**
   - Monitor memory trends
   - Check for memory leaks
   - Restart if necessary

3. **Rate Limiting**
   - Check request frequency
   - Implement client-side retry logic
   - Monitor rate limit headers

### **Log Analysis**
```bash
# View recent errors
tail -f logs/errors.log

# Monitor AI requests
tail -f logs/ai-requests.log

# Check server stats
tail -f logs/server-stats.log
```

## 🔄 Updates & Maintenance

### **Regular Maintenance**
- Monitor log files for issues
- Check health endpoints
- Review performance metrics
- Update dependencies

### **Backup Strategy**
- Log files backed up daily
- Configuration version controlled
- Environment variables secured

## 📞 Support

For issues or questions:
1. Check the logs in `./logs/`
2. Monitor the health endpoint
3. Review performance metrics
4. Check error tracking

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**Security Level**: Production Ready 