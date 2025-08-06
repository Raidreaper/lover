import express from 'express';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import http from 'http';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import ServerMonitor from './monitoring.js';
import DatabaseManager from './database.js';
import AIConversation from './ai_conversation.js'; // Added import for AIConversation
import User from './user_model.js'; // Added import for User model
import mongoose from 'mongoose';

// Load environment variables
dotenv.config({ path: 'config.env' });

// Debug: Check if environment variables are loaded
console.log('🔍 Environment check:');
console.log('  GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'Found' : 'Not found');
console.log('  MONGODB_URI:', process.env.MONGODB_URI ? 'Found' : 'Not found');
console.log('  PORT:', process.env.PORT || 'Using default');
console.log('  CORS_ORIGIN:', process.env.CORS_ORIGIN || 'Using default');

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://kteams200:RemGUNZhXdPySZMe@cluster0.stsut.mongodb.net/lovers_code?retryWrites=true&w=majority';
let mongoConnected = false;

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    mongoConnected = true;
  })
  .catch((error) => {
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('🔍 Connection details:', {
      uri: MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'), // Hide credentials in logs
      error: error.name,
      code: error.code
    });
    console.log('⚠️  Using SQLite only for data storage');
    mongoConnected = false;
  });

const app = express();
const PORT = process.env.PORT || 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// Initialize monitoring and database
const monitor = new ServerMonitor();
const db = new DatabaseManager();

// Initialize Gemini AI with error handling
let genAI, model;
try {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyD0vDWiSPZe2A7-O3ocsxD3s73CLgy13oE';
  if (!GEMINI_API_KEY) {
    console.warn('⚠️  No GEMINI_API_KEY found in environment variables');
    console.error('❌ Gemini AI initialization failed - no API key provided');
    model = null;
  } else {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    console.log('✅ Gemini AI initialized with API key');
  }
} catch (error) {
  console.error('❌ Failed to initialize Gemini AI:', error.message);
  model = null;
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 AI requests per minute
  message: {
    error: 'Too many AI requests, please slow down.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Speed limiting
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // allow 50 requests per 15 minutes without delay
  delayMs: () => 500, // add 500ms delay per request after delayAfter
});

// Apply rate limiting
app.use('/api/', limiter);
app.use('/api/ai-companion/', aiLimiter);
app.use(speedLimiter);

// --- CORS and Preflight Logic ---
import cors from 'cors';

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:3000',
  'https://lover-livid.vercel.app',
  'https://lover-livid.vercel.app/'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, curl, etc.)
    if (!origin) return callback(null, true);
    // Normalize for trailing slash
    const normalizedOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;
    if (
      allowedOrigins.includes(origin) ||
      allowedOrigins.includes(normalizedOrigin)
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight for all routes

// Body parsing with limits
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      res.status(400).json({ error: 'Invalid JSON' });
      throw new Error('Invalid JSON');
    }
  }
}));

app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware with monitoring
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`📨 ${req.method} ${req.path} - ${req.ip} - ${new Date().toISOString()}`);
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`📤 ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
    monitor.logRequest(req, res, duration);
  });
  
  next();
});

// Input validation middleware
const validateCompanionConfig = (req, res, next) => {
  const { companionConfig } = req.body;
  
  if (!companionConfig) {
    return res.status(400).json({ error: 'Companion configuration is required' });
  }
  
  const requiredFields = ['name', 'personality', 'identity', 'gender', 'role'];
  const missingFields = requiredFields.filter(field => !companionConfig[field]);
  
  if (missingFields.length > 0) {
    return res.status(400).json({ 
      error: 'Missing required fields', 
      missingFields 
    });
  }
  
  // Sanitize inputs
  const sanitizedConfig = {
    name: String(companionConfig.name).trim().substring(0, 50),
    personality: String(companionConfig.personality).trim().substring(0, 1000),
    identity: String(companionConfig.identity).trim().substring(0, 1000),
    gender: String(companionConfig.gender).trim().substring(0, 20),
    role: String(companionConfig.role).trim().substring(0, 500)
  };
  
  req.sanitizedConfig = sanitizedConfig;
  next();
};

const validateMessage = (req, res, next) => {
  const { message } = req.body;
  
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Valid message is required' });
  }
  
  const sanitizedMessage = String(message).trim().substring(0, 2000);
  
  if (sanitizedMessage.length === 0) {
    return res.status(400).json({ error: 'Message cannot be empty' });
  }
  
  req.sanitizedMessage = sanitizedMessage;
  next();
};

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling']
});

// Store active sessions and their participants with cleanup
const sessions = new Map();
const aiCompanions = new Map();
const userConnections = new Map(); // Track user connections for cleanup

// Cleanup old sessions every 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, sessionData] of sessions.entries()) {
    if (now - sessionData.lastActivity > 30 * 60 * 1000) { // 30 minutes
      sessions.delete(sessionId);
      console.log(`🧹 Cleaned up inactive session: ${sessionId}`);
    }
  }
}, 30 * 60 * 1000);

io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);
  userConnections.set(socket.id, { connectedAt: Date.now() });
  monitor.updateConnectionCount(io.engine.clientsCount);

  // Join a specific session
  socket.on('join-session', (data) => {
    // Handle both old format (string) and new format (object)
    const sessionId = typeof data === 'string' ? data : data.sessionId;
    const playerName = typeof data === 'string' ? null : data.playerName;
    
    if (!sessionId || typeof sessionId !== 'string') {
      socket.emit('error', { message: 'Invalid session ID' });
      return;
    }
    
    socket.join(sessionId);
    
    // Store player name with socket
    socket.playerName = playerName || 'Anonymous';
    
    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, { 
        participants: new Set(),
        lastActivity: Date.now()
      });
      
      // Create session in database
      try {
        db.createMultiplayerSession(sessionId, `Multiplayer Session ${sessionId}`);
        console.log(`📊 Created multiplayer session in database: ${sessionId}`);
      } catch (error) {
        // If session already exists, just log it
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
          console.log(`📊 Session ${sessionId} already exists in database`);
        } else {
          console.error('❌ Failed to create multiplayer session in database:', error);
        }
      }
    }
    
    const session = sessions.get(sessionId);
    session.participants.add(socket.id);
    session.lastActivity = Date.now();
    
    // Update participant count in database
    try {
      db.updateMultiplayerParticipantCount(sessionId, session.participants.size);
    } catch (error) {
      console.error('❌ Failed to update participant count:', error);
    }
    
    console.log(`👥 User ${socket.playerName} (${socket.id}) joined session ${sessionId}`);
    console.log(`📊 Session ${sessionId} now has ${session.participants.size} participants`);
    
    // Notify all users in the session that someone joined
    io.to(sessionId).emit('user-joined', { 
      sessionId, 
      userId: socket.id,
      playerName: socket.playerName 
    });
  });

  // Handle chat messages within a session
  socket.on('chat message', (data) => {
    if (!data || !data.sessionId || !data.text) {
      socket.emit('error', { message: 'Invalid message data' });
      return;
    }
    
    const playerName = socket.playerName || data.playerName || 'Anonymous';
    
    console.log(`💬 Message in session ${data.sessionId} from ${playerName}: ${data.text.substring(0, 50)}...`);
    
    // Update session activity
    const session = sessions.get(data.sessionId);
    if (session) {
      session.lastActivity = Date.now();
    }
    
    // Save message to database
    try {
      const messageType = data.text.length <= 2 && /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(data.text) ? 'emoji' : 'chat';
      db.addMultiplayerMessage(data.sessionId, playerName, data.text, messageType);
    } catch (error) {
      console.error('❌ Failed to save multiplayer message to database:', error);
    }
    
    // Broadcast message to all users in the session (except sender)
    socket.to(data.sessionId).emit('chat message', {
      text: data.text,
      sender: playerName,
      timestamp: data.timestamp,
      playerName: playerName
    });
  });

  // Handle question asking
  socket.on('ask-question', (data) => {
    if (!data || !data.sessionId || !data.question) {
      socket.emit('error', { message: 'Invalid question data' });
      return;
    }
    
    const playerName = socket.playerName || data.playerName || 'Anonymous';
    
    console.log(`❓ Question asked in session ${data.sessionId} by ${playerName}: ${data.question.substring(0, 50)}...`);
    
    // Save question to database
    try {
      db.addMultiplayerMessage(data.sessionId, playerName, data.question, 'question');
    } catch (error) {
      console.error('❌ Failed to save question to database:', error);
    }
    
    // Send question to other user in the session
    socket.to(data.sessionId).emit('question-asked', {
      question: data.question,
      playerName: playerName
    });
  });

  // Handle question answers
  socket.on('question-answer', (data) => {
    if (!data || !data.sessionId || !data.answer) {
      socket.emit('error', { message: 'Invalid answer data' });
      return;
    }
    
    const playerName = socket.playerName || data.playerName || 'Anonymous';
    
    console.log(`✅ Question answered in session ${data.sessionId} by ${playerName}: ${data.answer.substring(0, 50)}...`);
    
    // Save answer to database
    try {
      db.addMultiplayerMessage(data.sessionId, playerName, data.answer, 'answer');
    } catch (error) {
      console.error('❌ Failed to save answer to database:', error);
    }
    
    // Send answer to all users in the session (including sender)
    io.to(data.sessionId).emit('question-answered', {
      question: data.question,
      answer: data.answer,
      sender: data.sender,
      playerName: playerName
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const playerName = socket.playerName || 'Anonymous';
    console.log(`🔌 User ${playerName} (${socket.id}) disconnected`);
    userConnections.delete(socket.id);
    monitor.updateConnectionCount(io.engine.clientsCount);
    
    // Remove user from all sessions they were in
    for (const [sessionId, sessionData] of sessions.entries()) {
      if (sessionData.participants.has(socket.id)) {
        sessionData.participants.delete(socket.id);
        console.log(`👋 User ${playerName} (${socket.id}) left session ${sessionId}`);
        
        // Update participant count in database
        try {
          db.updateMultiplayerParticipantCount(sessionId, sessionData.participants.size);
        } catch (error) {
          console.error('❌ Failed to update participant count on disconnect:', error);
        }
        
        // If session is empty, remove it
        if (sessionData.participants.size === 0) {
          sessions.delete(sessionId);
          console.log(`🏁 Session ${sessionId} ended (no more participants)`);
          
          // Deactivate session in database
          try {
            db.deactivateMultiplayerSession(sessionId);
            console.log(`📊 Deactivated multiplayer session in database: ${sessionId}`);
          } catch (error) {
            console.error('❌ Failed to deactivate multiplayer session:', error);
          }
        } else {
          // Notify remaining users that someone left
          io.to(sessionId).emit('user-left', { 
            sessionId, 
            userId: socket.id,
            playerName: playerName 
          });
        }
      }
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  const health = monitor.isHealthy();
  const stats = monitor.getStats();
  
  res.json({
    status: health.healthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: stats.uptime,
    memory: stats.performance.memoryUsage,
    activeSessions: sessions.size,
    totalConnections: io.engine.clientsCount,
    health: health,
    stats: stats
  });
});

// Detailed stats endpoint
app.get('/api/stats', (req, res) => {
  res.json(monitor.getStats());
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'Lover\'s Code Backend server is running!',
    version: '1.0.0',
    activeSessions: Array.from(sessions.keys()),
    totalConnections: io.engine.clientsCount,
    environment: process.env.NODE_ENV || 'development',
    allowedOrigins: allowedOrigins
  });
});

// API endpoint to get session info
app.get('/api/sessions/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  
  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({ error: 'Invalid session ID' });
  }
  
  const session = sessions.get(sessionId);
  
  if (session) {
    res.json({
      sessionId,
      participantCount: session.participants.size,
      isActive: true,
      lastActivity: session.lastActivity
    });
  } else {
    res.status(404).json({
      sessionId,
      participantCount: 0,
      isActive: false
    });
  }
});

// --- AI Companion API endpoints with MongoDB persistence ---

// /api/ai-companion/initialize
app.post('/api/ai-companion/initialize', validateCompanionConfig, async (req, res) => {
  try {
    const companionConfig = req.sanitizedConfig;
    // Create or get companion in SQLite (legacy/local)
    let companionId;
    let sessionId;
    let conversationId;
    
    try {
      const existingCompanion = db.getCompanionByName(companionConfig.name);
      if (existingCompanion) {
        companionId = existingCompanion.id;
        db.updateCompanion(companionId, companionConfig);
      } else {
        companionId = db.createCompanion(companionConfig);
      }
      // Generate session ID
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      // Create conversation in SQLite (legacy/local)
      conversationId = db.createConversation(companionId, sessionId, `Chat with ${companionConfig.name}`);
    } catch (dbError) {
      console.warn('⚠️  SQLite operations failed, using fallback IDs:', dbError.message);
      // Generate fallback IDs if database operations fail
      companionId = 1;
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      conversationId = Date.now();
    }
    // Generate initial greeting with enhanced context
    const context = `You are ${companionConfig.name}, an AI companion with the following characteristics:

Personality: ${companionConfig.personality}
Identity: ${companionConfig.identity}
Gender: ${companionConfig.gender}
Role: ${companionConfig.role}

Instructions for your greeting:
- Introduce yourself as ${companionConfig.name}
- Express genuine excitement about being their companion
- Keep it warm, personal, and authentic (2-3 sentences maximum)
- Show your unique personality based on the characteristics above
- Be conversational and natural, not robotic
- Ask an engaging question to start the conversation

Generate a welcoming first message:`;
    // Check if AI model is available
    if (!model) {
      throw new Error('AI model not initialized');
    }
    
    // Retry logic for API overload
    let retries = 3;
    let greeting = null;
    let lastError = null;
    while (retries > 0 && !greeting) {
      try {
        const result = await model.generateContent(context);
        const response = await result.response;
        greeting = response.text();
      } catch (apiError) {
        retries--;
        lastError = apiError;
        if (retries === 0) throw apiError;
        const delay = Math.pow(2, 3 - retries) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    if (greeting) {
      // Save the greeting message to SQLite
      try {
        db.addMessage(conversationId, 'ai', greeting, 'welcoming');
      } catch (dbError) {
        console.warn('⚠️  SQLite write failed, continuing without saving greeting:', dbError.message);
      }
      
      // --- MongoDB: Create conversation document (optional) ---
      if (mongoConnected && sessionId && conversationId) {
        try {
          await AIConversation.create({
            sessionId,
            conversationId,
            companionConfig,
            messages: [{ role: 'assistant', content: greeting, timestamp: new Date() }],
            createdAt: new Date(),
            updatedAt: new Date()
          });
        } catch (mongoError) {
          console.warn('⚠️  MongoDB save failed, continuing with SQLite only:', mongoError.message);
        }
      }
      
      res.json({
        greeting,
        companionName: companionConfig.name,
        sessionId,
        conversationId,
        timestamp: new Date()
      });
    } else {
      throw new Error('Failed to get greeting after all retries');
    }
  } catch (error) {
    console.error('❌ AI Companion initialization error:', error.message);
    // Enhanced fallback greeting
    const companionName = req.sanitizedConfig?.name || 'your companion';
    const personality = req.sanitizedConfig?.personality || 'caring and supportive';
    const fallbackGreeting = `Hello! I'm ${companionName}, your AI companion. I'm ${personality} and I'm excited to be here with you today. What would you like to talk about?`;
    res.status(500).json({ 
      error: 'Failed to initialize companion',
      greeting: fallbackGreeting,
      retryAfter: '30 seconds'
    });
  }
});

// /api/ai-companion/chat
app.post('/api/ai-companion/chat', validateMessage, validateCompanionConfig, async (req, res) => {
  try {
    const { sessionId, conversationId } = req.body;
    const message = req.sanitizedMessage;
    const companionConfig = req.sanitizedConfig;
    // --- MongoDB: Find conversation (optional) ---
    let mongoConversation = null;
    if (mongoConnected && sessionId) {
      try {
        mongoConversation = await AIConversation.findOne({ sessionId });
        if (!mongoConversation && sessionId && conversationId) {
          // If not found, create new (only if we have valid IDs)
          mongoConversation = await AIConversation.create({
            sessionId,
            conversationId,
            companionConfig,
            messages: [],
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
        // Save user message to MongoDB if conversation exists
        if (mongoConversation) {
          mongoConversation.messages.push({ role: 'user', content: message, timestamp: new Date() });
          mongoConversation.updatedAt = new Date();
          await mongoConversation.save();
        }
      } catch (mongoError) {
        console.warn('⚠️  MongoDB operation failed, continuing with SQLite only:', mongoError.message);
      }
    }
    // --- SQLite (legacy/local) ---
    let conversation = null;
    if (sessionId) {
      conversation = db.getConversation(sessionId);
    } else if (conversationId) {
      conversation = db.getConversationById(parseInt(conversationId));
    }
    if (!conversation) {
      try {
        let companionId = db.getCompanionByName(companionConfig.name)?.id;
        if (!companionId) {
          companionId = db.createCompanion(companionConfig);
        }
        const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newConversationId = db.createConversation(companionId, newSessionId, `Chat with ${companionConfig.name}`);
        conversation = db.getConversationById(newConversationId);
      } catch (dbError) {
        console.warn('⚠️  SQLite conversation creation failed, using fallback:', dbError.message);
        // Create fallback conversation object
        conversation = {
          id: Date.now(),
          session_id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: `Chat with ${companionConfig.name}`
        };
      }
    }
    try {
      db.addMessage(conversation.id, 'user', message, 'neutral');
    } catch (dbError) {
      console.warn('⚠️  SQLite write failed, continuing without saving message:', dbError.message);
    }
    // Get recent conversation history (prefer MongoDB, fallback to SQLite)
    let conversationContext = '';
    if (mongoConnected && mongoConversation && mongoConversation.messages.length > 0) {
      const mongoMessages = mongoConversation.messages.slice(-10);
      conversationContext = mongoMessages.map(msg => `${msg.role === 'assistant' ? 'ai' : msg.role}: ${msg.content}`).join('\n');
    } else {
      // Fallback to SQLite conversation history
      try {
        const sqliteMessages = db.getRecentMessages(conversation.id, 10);
        conversationContext = sqliteMessages.map(msg => `${msg.sender}: ${msg.content}`).join('\n');
      } catch (dbError) {
        console.warn('⚠️  SQLite history retrieval failed, using empty context:', dbError.message);
        conversationContext = '';
      }
    }
    // Create enhanced context for the AI
    const context = `You are ${companionConfig.name}, an AI companion with the following characteristics:

Personality: ${companionConfig.personality}
Identity: ${companionConfig.identity}
Gender: ${companionConfig.gender}
Role: ${companionConfig.role}

Core Guidelines:
- Stay in character as ${companionConfig.name} at all times
- Be empathetic, supportive, and authentic in your responses
- Keep responses concise and engaging (1-3 sentences unless user asks for more)
- Show your unique personality based on the characteristics above
- Be conversational and natural, not robotic or generic
- Ask follow-up questions when appropriate to keep the conversation flowing
- Respond to the user's emotions and needs
- Don't give generic responses like "I'm here to listen" - be specific and personal

Previous conversation context:
${conversationContext}

User's message: ${message}

Respond as ${companionConfig.name} with a personal, engaging response:`;
    
    // Check if AI model is available
    if (!model) {
      throw new Error('AI model not initialized');
    }
    
    // Retry logic for API overload with exponential backoff
    let retries = 3;
    let aiResponse = null;
    let lastError = null;
    while (retries > 0 && !aiResponse) {
      try {
        const result = await model.generateContent(context);
        const response = await result.response;
        aiResponse = response.text();
      } catch (apiError) {
        retries--;
        lastError = apiError;
        if (retries === 0) throw apiError;
        const delay = Math.pow(2, 3 - retries) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    if (aiResponse) {
      // Save AI response to MongoDB (optional)
      if (mongoConnected && mongoConversation) {
        try {
          mongoConversation.messages.push({ role: 'assistant', content: aiResponse, timestamp: new Date() });
          mongoConversation.updatedAt = new Date();
          await mongoConversation.save();
        } catch (mongoError) {
          console.warn('⚠️  MongoDB save failed, continuing with SQLite only:', mongoError.message);
        }
      }
      
      // Save AI response to SQLite
      try {
        db.addMessage(conversation.id, 'ai', aiResponse, 'responsive');
      } catch (dbError) {
        console.warn('⚠️  SQLite write failed, continuing without saving AI response:', dbError.message);
      }
      
      res.json({
        message: aiResponse,
        companionName: companionConfig.name,
        sessionId: sessionId || conversation.session_id,
        conversationId: conversationId || conversation.id,
        timestamp: new Date()
      });
    } else {
      throw new Error('Failed to get response after all retries');
    }
  } catch (error) {
    console.error('❌ AI Companion chat error:', error.message);
    // Enhanced fallback response
    const companionName = req.sanitizedConfig?.name || 'your companion';
    const personality = req.sanitizedConfig?.personality || 'caring';
    
    let fallbackResponse = "I'm here for you! What's on your mind?";
    
    // Context-aware fallback responses
    if (message.toLowerCase().includes('hello') || message.toLowerCase().includes('hi')) {
      fallbackResponse = `Hi there! I'm ${companionName} and I'm ${personality}. How are you feeling today?`;
    } else if (message.toLowerCase().includes('how are you')) {
      fallbackResponse = `I'm doing great, thank you for asking! I'm here and ready to chat with you. How about you?`;
    } else if (message.toLowerCase().includes('thank')) {
      fallbackResponse = `You're very welcome! I'm here for you whenever you need to talk.`;
    } else if (message.toLowerCase().includes('bye') || message.toLowerCase().includes('goodbye')) {
      fallbackResponse = `Take care! I'll be here when you want to chat again.`;
    }
    
    res.status(500).json({ 
      error: 'Failed to get AI response', 
      message: fallbackResponse,
      retryAfter: '30 seconds' 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('💥 Unhandled error:', err);
  monitor.logError(err, { 
    endpoint: req.path,
    method: req.method,
    ip: req.ip 
  });
  res.status(500).json({
    error: 'Internal server error',
    message: 'Something went wrong. Please try again later.'
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    db.close();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    db.close();
    process.exit(0);
  });
});

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

server.listen(PORT, () => {
  console.log(`🚀 Lover's Code server listening on http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 Allowed CORS origins: ${allowedOrigins.join(', ')}`);
  console.log(`🤖 AI Model: ${model ? 'Available' : 'Not Available'}`);
  console.log(`✅ Server is ready to accept connections!`);
}).on('error', (error) => {
  console.error('❌ Server failed to start:', error);
  process.exit(1);
}); 

// Database and conversation management endpoints
app.get('/api/conversations', (req, res) => {
  try {
    const { companion_id, limit = 20, offset = 0 } = req.query;
    const conversations = db.getConversations(
      companion_id ? parseInt(companion_id) : null,
      parseInt(limit),
      parseInt(offset)
    );
    
    res.json({
      conversations,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: conversations.length
      }
    });
  } catch (error) {
    console.error('❌ Error fetching conversations:', error);
    monitor.logError(error, { endpoint: '/api/conversations' });
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

app.get('/api/conversations/search', (req, res) => {
  try {
    const { q, limit = 20 } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'Search term is required' });
    }
    
    const conversations = db.searchConversations(q.trim(), parseInt(limit));
    res.json({ conversations, searchTerm: q });
  } catch (error) {
    console.error('❌ Error searching conversations:', error);
    monitor.logError(error, { endpoint: '/api/conversations/search' });
    res.status(500).json({ error: 'Failed to search conversations' });
  }
});

app.get('/api/conversations/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // --- MongoDB: Fetch conversation (optional) ---
    if (mongoConnected) {
      try {
        const mongoConversation = await AIConversation.findOne({ sessionId });
        if (mongoConversation) {
          return res.json({
            conversation: {
              sessionId: mongoConversation.sessionId,
              companionConfig: mongoConversation.companionConfig,
              createdAt: mongoConversation.createdAt,
              updatedAt: mongoConversation.updatedAt
            },
            messages: mongoConversation.messages.map(msg => ({
              sender: msg.role === 'assistant' ? 'ai' : msg.role,
              content: msg.content,
              timestamp: msg.timestamp
            }))
          });
        }
      } catch (mongoError) {
        console.warn('⚠️  MongoDB fetch failed, falling back to SQLite:', mongoError.message);
      }
    }
    
    // --- Fallback to SQLite ---
    const conversation = db.getConversation(sessionId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    const messages = db.getMessages(conversation.id);
    const companion = db.getCompanion(conversation.companion_id);
    
    res.json({
      conversation: {
        sessionId: conversation.session_id,
        companionConfig: companion,
        createdAt: conversation.created_at,
        updatedAt: conversation.updated_at
      },
      messages: messages.map(msg => ({
        sender: msg.sender,
        content: msg.content,
        emotion: msg.emotion,
        timestamp: msg.timestamp
      }))
    });
  } catch (error) {
    console.error('❌ Error fetching conversation:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

app.get('/api/conversations/:conversationId/export', (req, res) => {
  try {
    const { conversationId } = req.params;
    const exportData = db.exportConversation(parseInt(conversationId));
    
    if (!exportData) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    res.json(exportData);
  } catch (error) {
    console.error('❌ Error exporting conversation:', error);
    monitor.logError(error, { endpoint: '/api/conversations/:conversationId/export' });
    res.status(500).json({ error: 'Failed to export conversation' });
  }
});

app.put('/api/conversations/:conversationId/title', (req, res) => {
  try {
    const { conversationId } = req.params;
    const { title } = req.body;
    
    if (!title || title.trim().length === 0) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    db.updateConversationTitle(parseInt(conversationId), title.trim());
    res.json({ message: 'Title updated successfully' });
  } catch (error) {
    console.error('❌ Error updating conversation title:', error);
    monitor.logError(error, { endpoint: '/api/conversations/:conversationId/title' });
    res.status(500).json({ error: 'Failed to update title' });
  }
});

app.delete('/api/conversations/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    db.deactivateConversation(sessionId);
    res.json({ message: 'Conversation deactivated successfully' });
  } catch (error) {
    console.error('❌ Error deactivating conversation:', error);
    monitor.logError(error, { endpoint: '/api/conversations/:sessionId' });
    res.status(500).json({ error: 'Failed to deactivate conversation' });
  }
});

// Statistics endpoints
app.get('/api/stats/conversations', (req, res) => {
  try {
    const stats = db.getConversationStats();
    res.json(stats);
  } catch (error) {
    console.error('❌ Error fetching conversation stats:', error);
    monitor.logError(error, { endpoint: '/api/stats/conversations' });
    res.status(500).json({ error: 'Failed to fetch conversation stats' });
  }
});

app.get('/api/stats/messages', (req, res) => {
  try {
    const stats = db.getMessageStats();
    res.json(stats);
  } catch (error) {
    console.error('❌ Error fetching message stats:', error);
    monitor.logError(error, { endpoint: '/api/stats/messages' });
    res.status(500).json({ error: 'Failed to fetch message stats' });
  }
});

app.get('/api/stats/companions', (req, res) => {
  try {
    const stats = db.getCompanionStats();
    res.json(stats);
  } catch (error) {
    console.error('❌ Error fetching companion stats:', error);
    monitor.logError(error, { endpoint: '/api/stats/companions' });
    res.status(500).json({ error: 'Failed to fetch companion stats' });
  }
});

// Database maintenance
app.post('/api/maintenance/cleanup', (req, res) => {
  try {
    const { daysOld = 30 } = req.body;
    const result = db.cleanupOldConversations(parseInt(daysOld));
    res.json({ 
      message: 'Cleanup completed successfully',
      deletedCount: result.changes
    });
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    monitor.logError(error, { endpoint: '/api/maintenance/cleanup' });
    res.status(500).json({ error: 'Failed to perform cleanup' });
  }
});

app.get('/api/maintenance/size', (req, res) => {
  try {
    const size = db.getDatabaseSize();
    res.json({ 
      sizeBytes: size,
      sizeMB: (size / 1024 / 1024).toFixed(2)
    });
  } catch (error) {
    console.error('❌ Error getting database size:', error);
    monitor.logError(error, { endpoint: '/api/maintenance/size' });
    res.status(500).json({ error: 'Failed to get database size' });
  }
});

// Multiplayer API endpoints
app.get('/api/multiplayer/sessions', (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const sessions = db.getMultiplayerSessions(parseInt(limit), parseInt(offset));
    
    res.json({
      sessions,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: sessions.length
      }
    });
  } catch (error) {
    console.error('❌ Error fetching multiplayer sessions:', error);
    monitor.logError(error, { endpoint: '/api/multiplayer/sessions' });
    res.status(500).json({ error: 'Failed to fetch multiplayer sessions' });
  }
});

app.get('/api/multiplayer/sessions/search', (req, res) => {
  try {
    const { q, limit = 20 } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'Search term is required' });
    }
    
    const sessions = db.searchMultiplayerSessions(q.trim(), parseInt(limit));
    res.json({ sessions, searchTerm: q });
  } catch (error) {
    console.error('❌ Error searching multiplayer sessions:', error);
    monitor.logError(error, { endpoint: '/api/multiplayer/sessions/search' });
    res.status(500).json({ error: 'Failed to search multiplayer sessions' });
  }
});

app.get('/api/multiplayer/sessions/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = db.getMultiplayerSession(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Multiplayer session not found' });
    }
    
    const messages = db.getMultiplayerMessages(sessionId);
    res.json({ session, messages });
  } catch (error) {
    console.error('❌ Error fetching multiplayer session:', error);
    monitor.logError(error, { endpoint: '/api/multiplayer/sessions/:sessionId' });
    res.status(500).json({ error: 'Failed to fetch multiplayer session' });
  }
});

app.get('/api/multiplayer/sessions/:sessionId/export', (req, res) => {
  try {
    const { sessionId } = req.params;
    const exportData = db.exportMultiplayerSession(sessionId);
    
    if (!exportData) {
      return res.status(404).json({ error: 'Multiplayer session not found' });
    }
    
    res.json(exportData);
  } catch (error) {
    console.error('❌ Error exporting multiplayer session:', error);
    monitor.logError(error, { endpoint: '/api/multiplayer/sessions/:sessionId/export' });
    res.status(500).json({ error: 'Failed to export multiplayer session' });
  }
});

app.delete('/api/multiplayer/sessions/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    db.deactivateMultiplayerSession(sessionId);
    res.json({ message: 'Multiplayer session deactivated successfully' });
  } catch (error) {
    console.error('❌ Error deactivating multiplayer session:', error);
    monitor.logError(error, { endpoint: '/api/multiplayer/sessions/:sessionId' });
    res.status(500).json({ error: 'Failed to deactivate multiplayer session' });
  }
});

// Multiplayer statistics
app.get('/api/stats/multiplayer', (req, res) => {
  try {
    const stats = db.getMultiplayerStats();
    res.json(stats);
  } catch (error) {
    console.error('❌ Error fetching multiplayer stats:', error);
    monitor.logError(error, { endpoint: '/api/stats/multiplayer' });
    res.status(500).json({ error: 'Failed to fetch multiplayer stats' });
  }
});

app.get('/api/stats/multiplayer-messages', (req, res) => {
  try {
    const stats = db.getMultiplayerMessageStats();
    res.json(stats);
  } catch (error) {
    console.error('❌ Error fetching multiplayer message stats:', error);
    monitor.logError(error, { endpoint: '/api/stats/multiplayer-messages' });
    res.status(500).json({ error: 'Failed to fetch multiplayer message stats' });
  }
});

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// User Registration
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({ error: 'Username must be between 3 and 30 characters' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }] 
    }).exec();

    if (existingUser) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = new User({
      username,
      email,
      password: hashedPassword,
      createdAt: new Date(),
      lastLogin: new Date()
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    monitor.logError(error, { endpoint: '/api/auth/register' });
    res.status(500).json({ error: 'Registration failed' });
  }
});

// User Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user
    const user = await User.findOne({ username }).exec();

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    monitor.logError(error, { endpoint: '/api/auth/login' });
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get Current User Profile
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).exec();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error('❌ Profile fetch error:', error);
    monitor.logError(error, { endpoint: '/api/auth/profile' });
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update User Profile
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { username, email } = req.body;
    const user = await User.findById(req.user.userId).exec();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if new username/email already exists
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username }).exec();
      if (existingUser) {
        return res.status(409).json({ error: 'Username already exists' });
      }
      user.username = username;
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email }).exec();
      if (existingUser) {
        return res.status(409).json({ error: 'Email already exists' });
      }
      user.email = email;
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error('❌ Profile update error:', error);
    monitor.logError(error, { endpoint: '/api/auth/profile' });
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Change Password
app.put('/api/auth/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    const user = await User.findById(req.user.userId).exec();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    user.password = hashedPassword;

    await user.save();

    res.json({ message: 'Password changed successfully' });

  } catch (error) {
    console.error('❌ Password change error:', error);
    monitor.logError(error, { endpoint: '/api/auth/password' });
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Logout (client-side token removal)
app.post('/api/auth/logout', authenticateToken, (req, res) => {
  res.json({ message: 'Logout successful' });
});

// 404 handler - must be last
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested resource was not found.'
  });
}); 
