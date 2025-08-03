// API Configuration
const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://lover-0ekx.onrender.com' // Use Render backend in production
  : 'http://localhost:4000';

export const API_ENDPOINTS = {
  // AI Companion
  AI_INITIALIZE: `${API_BASE}/api/ai-companion/initialize`,
  AI_CHAT: `${API_BASE}/api/ai-companion/chat`,
  
  // Multiplayer (if needed)
  MULTIPLAYER_JOIN: `${API_BASE}/api/multiplayer/join`,
  MULTIPLAYER_MESSAGE: `${API_BASE}/api/multiplayer/message`,
  
  // Conversations
  CONVERSATIONS: `${API_BASE}/api/conversations`,
  CONVERSATION_EXPORT: `${API_BASE}/api/conversations/export`,
  
  // Statistics
  STATS_CONVERSATIONS: `${API_BASE}/api/stats/conversations`,
  STATS_MESSAGES: `${API_BASE}/api/stats/messages`,
  STATS_COMPANIONS: `${API_BASE}/api/stats/companions`,
};

export default API_ENDPOINTS; 