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
import User from './user_model.js'; // Supabase-based User model
import validateEnvironment from './env-validator.js';
import { supabaseConnected } from './supabase-client.js';
import MultiplayerModel from './multiplayer_model.js'; // Import Supabase connection status

// Load environment variables
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

// Validate environment variables
validateEnvironment();

// Debug: Check if environment variables are loaded
console.log('🔍 Environment check:');
console.log('  GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'Found' : 'Not found');
console.log('  SUPABASE_URL:', process.env.SUPABASE_URL ? 'Found' : 'Not found');
console.log('  SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'Found' : 'Not found');
console.log('  PORT:', process.env.PORT || 'Using default');
console.log('  NODE_ENV:', process.env.NODE_ENV || 'development');

const app = express();
const PORT = process.env.PORT || 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'https://lover-livid.vercel.app/';

// Trust proxy for Render (required for rate limiting behind proxy)
// Set to 1 to trust only the first proxy (Render's load balancer)
app.set('trust proxy', 1);

// Initialize monitoring and database
const monitor = new ServerMonitor();
const db = new DatabaseManager();

// MongoDB connection status (set to false since we're using Supabase)
const mongoConnected = false;

// Initialize Gemini AI with error handling
let genAI, model;
try {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    console.warn('⚠️  No GEMINI_API_KEY found in environment variables');
    console.error('❌ Gemini AI initialization failed - no API key provided');
    model = null;
  } else {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    // Try gemini-pro first (most widely available), then fallback to other models
    try {
      model = genAI.getGenerativeModel({ model: "gemini-pro" });
      console.log('✅ Gemini AI initialized with API key (model: gemini-pro)');
    } catch (modelError) {
      try {
        model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
        console.log('✅ Gemini AI initialized with API key (model: gemini-1.5-pro)');
      } catch (fallbackError) {
        try {
          model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
          console.log('✅ Gemini AI initialized with API key (model: gemini-1.5-flash)');
        } catch (finalError) {
          console.error('❌ Failed to initialize any Gemini model:', finalError.message);
          model = null;
        }
      }
    }
  }
} catch (error) {
  console.error('❌ Failed to initialize Gemini AI:', error.message);
  model = null;
}

// Security middleware with enhanced configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

// Rate limiting with improved configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  keyGenerator: (req) => {
    // Use IP + user agent for better rate limiting
    return req.ip + ':' + (req.headers['user-agent'] || 'unknown');
  }
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
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  keyGenerator: (req) => {
    // Use IP + user agent for better rate limiting
    return req.ip + ':' + (req.headers['user-agent'] || 'unknown');
  }
});

// Auth-specific rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth attempts per 15 minutes
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip + ':' + (req.headers['user-agent'] || 'unknown');
  }
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
app.use('/api/auth/', authLimiter);
app.use(speedLimiter);



// Build allowed origins array - normalize trailing slashes
const buildAllowedOrigins = () => {
  if (process.env.NODE_ENV === 'production') {
    // Use CORS_ORIGIN from env var, normalize trailing slash
    const corsOrigin = (CORS_ORIGIN || '').trim();
    const normalized = corsOrigin.endsWith('/') ? corsOrigin.slice(0, -1) : corsOrigin;
    return normalized ? [normalized, corsOrigin] : ['https://lover-livid.vercel.app'];
  }
  return ['http://localhost:5173', 'http://localhost:8080', 'http://localhost:8081', 'http://localhost:3000'];
};

const allowedOrigins = buildAllowedOrigins();

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Normalize origin (remove trailing slash for comparison)
    const normalizedOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;
    
    // Check both original and normalized versions
    const isAllowed = allowedOrigins.some(allowed => {
      const normalizedAllowed = allowed.endsWith('/') ? allowed.slice(0, -1) : allowed;
      return origin === allowed || origin === normalizedAllowed || 
             normalizedOrigin === allowed || normalizedOrigin === normalizedAllowed;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`🚫 CORS blocked origin: ${origin}. Allowed: ${allowedOrigins.join(', ')}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
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
  const timestamp = new Date().toISOString();
  
  // Log request details
  console.log(`📨 ${req.method} ${req.path} - ${req.ip} - ${timestamp}`);
  
  // Add request ID for tracking
  req.requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const statusEmoji = status >= 500 ? '💥' : status >= 400 ? '⚠️' : status >= 300 ? '🔄' : '✅';
    
    console.log(`${statusEmoji} ${req.method} ${req.path} - ${status} - ${duration}ms [${req.requestId}]`);
    monitor.logRequest(req, res, duration);
    
    // Log slow requests
    if (duration > 1000) {
      console.warn(`🐌 Slow request: ${req.method} ${req.path} took ${duration}ms`);
    }
  });
  
  next();
});

// Input validation middleware
const validateCompanionConfig = (req, res, next) => {
  const { companionConfig } = req.body;
  
  if (!companionConfig) {
    console.error('❌ Validation failed: companionConfig is missing from request body');
    console.error('Request body keys:', Object.keys(req.body || {}));
    return res.status(400).json({ error: 'Companion configuration is required' });
  }
  
  const requiredFields = ['name', 'personality', 'identity', 'gender', 'role'];
  const missingFields = requiredFields.filter(field => !companionConfig[field]);
  
  if (missingFields.length > 0) {
    console.error('❌ Validation failed: Missing required fields:', missingFields);
    console.error('Received companionConfig:', JSON.stringify(companionConfig, null, 2));
    return res.status(400).json({ 
      error: 'Missing required fields', 
      missingFields 
    });
  }
  
  // Enhanced input validation
  const validationErrors = [];
  
  if (companionConfig.name && companionConfig.name.length < 2) {
    validationErrors.push('Name must be at least 2 characters long');
  }
  
  if (companionConfig.personality && companionConfig.personality.length < 10) {
    validationErrors.push('Personality must be at least 10 characters long');
  }
  
  if (validationErrors.length > 0) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: validationErrors 
    });
  }
  
  // Sanitize inputs with XSS protection
  const sanitizeInput = (input) => {
    return String(input)
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .substring(0, 1000);
  };
  
  const sanitizedConfig = {
    name: sanitizeInput(companionConfig.name).substring(0, 50),
    personality: sanitizeInput(companionConfig.personality),
    identity: sanitizeInput(companionConfig.identity),
    gender: sanitizeInput(companionConfig.gender).substring(0, 20),
    role: sanitizeInput(companionConfig.role).substring(0, 500)
  };
  
  req.sanitizedConfig = sanitizedConfig;
  next();
};

const validateMessage = (req, res, next) => {
  const { message } = req.body;
  
  if (!message || typeof message !== 'string') {
    console.error('❌ Validation failed: message is missing or invalid');
    console.error('Request body keys:', Object.keys(req.body || {}));
    console.error('Message value:', message);
    return res.status(400).json({ error: 'Valid message is required' });
  }
  
  const sanitizedMessage = String(message).trim().substring(0, 2000);
  
  if (sanitizedMessage.length === 0) {
    console.error('❌ Validation failed: message is empty after sanitization');
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
    let sessionId = typeof data === 'string' ? data : data.sessionId;
    const playerName = typeof data === 'string' ? null : data.playerName;
    
    if (!sessionId || typeof sessionId !== 'string') {
      socket.emit('error', { message: 'Invalid session ID' });
      return;
    }
    
    // Trim whitespace from sessionId to prevent issues
    sessionId = sessionId.trim();
    
    // Leave any previous sessions this socket was in
    for (const room of socket.rooms) {
      if (room !== socket.id) { // Don't leave the socket's own room
        socket.leave(room);
        const oldSession = sessions.get(room);
        if (oldSession) {
          oldSession.participants.delete(socket.id);
          if (oldSession.participants.size === 0) {
            sessions.delete(room);
          }
        }
      }
    }
    
    // Join the new session
    socket.join(sessionId);
    
    // Store player name with socket
    socket.playerName = playerName || 'Anonymous';
    
    // Initialize session if it doesn't exist in memory
    if (!sessions.has(sessionId)) {
      console.log(`🆕 Creating new in-memory session: "${sessionId}"`);
      sessions.set(sessionId, { 
        participants: new Set(),
        lastActivity: Date.now()
      });
      
      // Check database for existing session before creating
      try {
        const existingSession = db.getMultiplayerSession(sessionId);
        if (!existingSession) {
          db.createMultiplayerSession(sessionId, `Multiplayer Session ${sessionId}`);
          console.log(`📊 Created new multiplayer session in database: ${sessionId}`);
        } else {
          console.log(`📊 Session ${sessionId} already exists in database, using existing`);
        }
      } catch (error) {
        // If session already exists, just log it
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
          console.log(`📊 Session ${sessionId} already exists in database (constraint)`);
        } else {
          console.error('❌ Failed to create multiplayer session in database:', error);
        }
      }
    } else {
      console.log(`✅ Joining existing in-memory session: "${sessionId}" (current participants: ${sessions.get(sessionId).participants.size})`);
    }
    
    const session = sessions.get(sessionId);
    if (!session) {
      console.error(`❌ CRITICAL: Session "${sessionId}" not found after creation/retrieval!`);
      socket.emit('error', { message: 'Failed to join session' });
      return;
    }
    
    // Add this socket to the session participants
    const wasAlreadyInSession = session.participants.has(socket.id);
    session.participants.add(socket.id);
    session.lastActivity = Date.now();
    
    if (wasAlreadyInSession) {
      console.log(`⚠️  Socket ${socket.id} was already in session "${sessionId}"`);
    }
    
    // Update participant count in database
    try {
      db.updateMultiplayerParticipantCount(sessionId, session.participants.size);
    } catch (error) {
      console.error('❌ Failed to update participant count:', error);
    }
    
    // Verify room membership
    const room = io.sockets.adapter.rooms.get(sessionId);
    const roomSize = room ? room.size : 0;
    
    console.log(`👥 User ${socket.playerName} (${socket.id}) joined session "${sessionId}"`);
    console.log(`📊 Session "${sessionId}" now has ${session.participants.size} participants (room size: ${roomSize})`);
    console.log(`🔍 All active sessions:`, Array.from(sessions.keys()));
    console.log(`🔍 Session "${sessionId}" participants:`, Array.from(session.participants));
    
    // Load previous messages from database and send to the joining user
    try {
      const previousMessages = db.getMultiplayerMessages(sessionId, 100, 0);
      if (previousMessages && previousMessages.length > 0) {
        console.log(`📜 Loading ${previousMessages.length} previous messages for session ${sessionId}`);
        // Send previous messages to the joining user
        socket.emit('chat-history', {
          sessionId,
          messages: previousMessages.map(msg => ({
            text: msg.content,
            sender: msg.sender,
            timestamp: msg.timestamp,
            playerName: msg.sender,
            type: msg.message_type || 'chat',
            sessionId: sessionId
          }))
        });
      }
    } catch (error) {
      console.error('❌ Failed to load chat history:', error);
    }
    
    // Send confirmation to the joining user
    socket.emit('session-joined', {
      sessionId,
      playerName: socket.playerName,
      participantCount: session.participants.size
    });
    
    // Notify all users in the session that someone joined (including the joiner)
    io.to(sessionId).emit('user-joined', { 
      sessionId, 
      userId: socket.id,
      playerName: socket.playerName,
      participantCount: session.participants.size
    });
  });

  // Handle chat messages within a session
  socket.on('chat message', (data) => {
    if (!data || !data.sessionId || (!data.text && !data.imageData && !data.imageUrl)) {
      socket.emit('error', { message: 'Invalid message data' });
      return;
    }
    
    const playerName = socket.playerName || data.playerName || 'Anonymous';
    
    // Verify socket is in the session
    if (!socket.rooms.has(data.sessionId)) {
      console.warn(`⚠️  Socket ${socket.id} tried to send message to session ${data.sessionId} but is not in that room`);
      socket.emit('error', { message: 'You are not in this session. Please rejoin.' });
      return;
    }
    
    // Verify session exists
    const session = sessions.get(data.sessionId);
    if (!session) {
      console.warn(`⚠️  Session ${data.sessionId} does not exist`);
      socket.emit('error', { message: 'Session does not exist' });
      return;
    }
    
    const messageType = data.type || (data.imageData || data.imageUrl ? 'image' : 'text');
    const messageText = data.text || (messageType === 'image' ? '📷 Image' : '');
    
    console.log(`💬 ${messageType === 'image' ? '📷 Image' : 'Message'} in session ${data.sessionId} from ${playerName} (${socket.id})${messageText && messageText.length > 0 ? ': ' + messageText.substring(0, 50) + '...' : ''}`);
    console.log(`📊 Session ${data.sessionId} has ${session.participants.size} participants:`, Array.from(session.participants));
    
    // Update session activity
    session.lastActivity = Date.now();
    
    // Save message to database
    try {
      let dbMessageType = 'chat';
      if (messageType === 'image') {
        dbMessageType = 'image';
      } else if (messageText && messageText.length > 0) {
        // Check if it's an emoji (short text with emoji characters)
        if (messageText.length <= 2 && /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(messageText)) {
          dbMessageType = 'emoji';
        }
      }
      // Save to Supabase
      if (supabaseConnected) {
        await MultiplayerModel.addMessage(
          data.sessionId,
          playerName,
          messageText || '',
          dbMessageType,
          null,
          data.imageData || null,
          data.imageUrl || null,
          data.imageType || null
        );
      }
      
      // SQLite fallback
      try {
        db.addMultiplayerMessage(data.sessionId, playerName, messageText || '', dbMessageType);
      } catch (sqliteError) {
        console.error('❌ Failed to save message to SQLite:', sqliteError);
      }
    } catch (error) {
      console.error('❌ Failed to save multiplayer message to database:', error);
    }
    
    // Prepare message object
    const messageData = {
      text: messageText,
      sender: playerName,
      timestamp: data.timestamp || new Date().toISOString(),
      playerName: playerName,
      sessionId: data.sessionId,
      type: messageType,
      imageData: data.imageData || null,
      imageUrl: data.imageUrl || null,
      imageType: data.imageType || null
    };
    
    // Broadcast message to ALL users in the session (including sender for consistency)
    // Using io.to() instead of socket.to() to ensure all participants receive it
    const room = io.sockets.adapter.rooms.get(data.sessionId);
    if (room) {
      console.log(`📤 Broadcasting ${messageType} message to ${room.size} sockets in room ${data.sessionId}`);
      io.to(data.sessionId).emit('chat message', messageData);
    } else {
      console.warn(`⚠️  Room ${data.sessionId} does not exist or is empty`);
      socket.emit('error', { message: 'No participants in session' });
    }
  });

  // Handle question asking
  socket.on('ask-question', (data) => {
    if (!data || !data.sessionId || !data.question) {
      socket.emit('error', { message: 'Invalid question data' });
      return;
    }
    
    // Verify socket is in the session
    if (!socket.rooms.has(data.sessionId)) {
      console.warn(`⚠️  Socket ${socket.id} tried to ask question in session ${data.sessionId} but is not in that room`);
      socket.emit('error', { message: 'You are not in this session. Please rejoin.' });
      return;
    }
    
    const playerName = socket.playerName || data.playerName || 'Anonymous';
    
    console.log(`❓ Question asked in session ${data.sessionId} by ${playerName}: ${data.question.substring(0, 50)}...`);
    
    // Update session activity
    const session = sessions.get(data.sessionId);
    if (session) {
      session.lastActivity = Date.now();
    }
    
    // Save question to database
    try {
      // Save to Supabase
      if (supabaseConnected) {
        await MultiplayerModel.addMessage(data.sessionId, playerName, data.question, 'question');
      }
      // SQLite fallback
      try {
        db.addMultiplayerMessage(data.sessionId, playerName, data.question, 'question');
      } catch (sqliteError) {
        console.error('❌ Failed to save question to SQLite:', sqliteError);
      }
    } catch (error) {
      console.error('❌ Failed to save question to database:', error);
    }
    
    // Broadcast question to ALL users in the session (so both see it)
    const room = io.sockets.adapter.rooms.get(data.sessionId);
    if (room) {
      console.log(`📤 Broadcasting question to ${room.size} sockets in room ${data.sessionId}`);
      io.to(data.sessionId).emit('question-asked', {
        question: data.question,
        playerName: playerName,
        sessionId: data.sessionId
      });
    } else {
      console.warn(`⚠️  Room ${data.sessionId} does not exist for question`);
    }
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
      // Save to Supabase
      if (supabaseConnected) {
        await MultiplayerModel.addMessage(data.sessionId, playerName, data.answer, 'answer');
      }
      // SQLite fallback
      try {
        db.addMultiplayerMessage(data.sessionId, playerName, data.answer, 'answer');
      } catch (sqliteError) {
        console.error('❌ Failed to save answer to SQLite:', sqliteError);
      }
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

  // Handle Truth or Dare spinner events
  socket.on('truth-or-dare-spin-start', (data) => {
    if (!data || !data.sessionId) {
      socket.emit('error', { message: 'Invalid spin data' });
      return;
    }
    
    // Verify socket is in the session
    if (!socket.rooms.has(data.sessionId)) {
      console.warn(`⚠️  Socket ${socket.id} tried to spin in session ${data.sessionId} but is not in that room`);
      socket.emit('error', { message: 'You are not in this session. Please rejoin.' });
      return;
    }
    
    const playerName = socket.playerName || data.playerName || 'Anonymous';
    
    console.log(`🎲 Truth or Dare spin started in session ${data.sessionId} by ${playerName}`);
    
    // Broadcast spin start to ALL users in the session
    const room = io.sockets.adapter.rooms.get(data.sessionId);
    if (room) {
      io.to(data.sessionId).emit('truth-or-dare-spin-start', {
        playerName: playerName,
        sessionId: data.sessionId,
        timestamp: new Date().toISOString()
      });
    }
  });

  socket.on('truth-or-dare-spin-result', (data) => {
    if (!data || !data.sessionId || !data.result) {
      socket.emit('error', { message: 'Invalid spin result data' });
      return;
    }
    
    // Verify socket is in the session
    if (!socket.rooms.has(data.sessionId)) {
      console.warn(`⚠️  Socket ${socket.id} tried to send spin result in session ${data.sessionId} but is not in that room`);
      socket.emit('error', { message: 'You are not in this session. Please rejoin.' });
      return;
    }
    
    const playerName = socket.playerName || data.playerName || 'Anonymous';
    
    console.log(`🎲 Truth or Dare result in session ${data.sessionId} by ${playerName}: ${data.result.type} - ${data.result.content.substring(0, 50)}...`);
    
    // Update session activity
    const session = sessions.get(data.sessionId);
    if (session) {
      session.lastActivity = Date.now();
    }
    
    // Save result to database and format as chat message
    const typeLabel = data.result.type === 'truth' ? 'Truth' : 'Dare';
    const difficultyEmoji = data.result.difficulty === 'easy' ? '🟢' : data.result.difficulty === 'medium' ? '🟡' : '🔴';
    const messageText = `🎲 ${typeLabel} ${difficultyEmoji}: ${data.result.content}`;
    
    try {
        // Save to Supabase
        if (supabaseConnected) {
          await MultiplayerModel.addMessage(data.sessionId, playerName, messageText, 'game');
        }
        // SQLite fallback
        try {
          db.addMultiplayerMessage(data.sessionId, playerName, messageText, 'game');
        } catch (sqliteError) {
          console.error('❌ Failed to save game result to SQLite:', sqliteError);
        }
    } catch (error) {
      console.error('❌ Failed to save spin result to database:', error);
    }
    
    // Broadcast result to ALL users in the session (so everyone sees it)
    const room = io.sockets.adapter.rooms.get(data.sessionId);
    if (room) {
      console.log(`📤 Broadcasting Truth or Dare result to ${room.size} sockets in room ${data.sessionId}`);
      
      // Emit as Truth or Dare event (for spinner UI)
      io.to(data.sessionId).emit('truth-or-dare-spin-result', {
        result: data.result,
        playerName: playerName,
        sessionId: data.sessionId,
        timestamp: new Date().toISOString()
      });
      
      // Also emit as a chat message so it appears in chat (like number questions)
      const chatMessageData = {
        text: messageText,
        sender: playerName,
        timestamp: new Date().toISOString(),
        playerName: playerName,
        sessionId: data.sessionId,
        type: 'game'
      };
      
      io.to(data.sessionId).emit('chat message', chatMessageData);
    } else {
      console.warn(`⚠️  Room ${data.sessionId} does not exist or is empty`);
      socket.emit('error', { message: 'No participants in session' });
    }
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
  const memoryUsage = process.memoryUsage();
  
  const healthData = {
    status: health.healthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: stats.uptime,
    memory: {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
    },
    activeSessions: sessions.size,
    totalConnections: io.engine.clientsCount,
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    health: health,
    stats: stats
  };
  
  // Set appropriate status code
  const statusCode = health.healthy ? 200 : 503;
  res.status(statusCode).json(healthData);
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
      
      // --- MongoDB: Create conversation document (optional) - DISABLED (using Supabase) ---
      // MongoDB is disabled - using SQLite for persistence
      // if (mongoConnected && sessionId && conversationId) {
      //   try {
      //     await AIConversation.create({
      //       sessionId,
      //       conversationId,
      //       companionConfig,
      //       messages: [{ role: 'assistant', content: greeting, timestamp: new Date() }],
      //       createdAt: new Date(),
      //       updatedAt: new Date()
      //     });
      //   } catch (mongoError) {
      //     console.warn('⚠️  MongoDB save failed, continuing with SQLite only:', mongoError.message);
      //   }
      // }
      
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
    // --- MongoDB: Find conversation (optional) - DISABLED (using Supabase) ---
    let mongoConversation = null;
    // MongoDB is disabled - using Supabase for persistence
    // if (mongoConnected && sessionId) {
    //   try {
    //     mongoConversation = await AIConversation.findOne({ sessionId });
    //     if (!mongoConversation && sessionId && conversationId) {
    //       mongoConversation = await AIConversation.create({
    //         sessionId,
    //         conversationId,
    //         companionConfig,
    //         messages: [],
    //         createdAt: new Date(),
    //         updatedAt: new Date()
    //       });
    //     }
    //     if (mongoConversation) {
    //       mongoConversation.messages.push({ role: 'user', content: message, timestamp: new Date() });
    //       mongoConversation.updatedAt = new Date();
    //       await mongoConversation.save();
    //     }
    //   } catch (mongoError) {
    //     console.warn('⚠️  MongoDB operation failed, continuing with SQLite only:', mongoError.message);
    //   }
    // }
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
    // Get recent conversation history (using SQLite, MongoDB disabled)
    let conversationContext = '';
    // MongoDB is disabled - using SQLite for conversation history
    // if (mongoConnected && mongoConversation && mongoConversation.messages.length > 0) {
    //   const mongoMessages = mongoConversation.messages.slice(-10);
    //   conversationContext = mongoMessages.map(msg => `${msg.role === 'assistant' ? 'ai' : msg.role}: ${msg.content}`).join('\n');
    // } else {
    // Fallback to SQLite conversation history
    try {
      const sqliteMessages = db.getRecentMessages(conversation.id, 10);
      conversationContext = sqliteMessages.map(msg => `${msg.sender}: ${msg.content}`).join('\n');
    } catch (dbError) {
      console.warn('⚠️  SQLite history retrieval failed, using empty context:', dbError.message);
      conversationContext = '';
    }
    // }
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
      // Save AI response to MongoDB (optional) - DISABLED (using Supabase)
      // if (mongoConnected && mongoConversation) {
      //   try {
      //     mongoConversation.messages.push({ role: 'assistant', content: aiResponse, timestamp: new Date() });
      //     mongoConversation.updatedAt = new Date();
      //     await mongoConversation.save();
      //   } catch (mongoError) {
      //     console.warn('⚠️  MongoDB save failed, continuing with SQLite only:', mongoError.message);
      //   }
      // }
      
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
    
    // Context-aware fallback responses (use req.sanitizedMessage)
    const userMessage = req.sanitizedMessage || '';
    if (userMessage.toLowerCase().includes('hello') || userMessage.toLowerCase().includes('hi')) {
      fallbackResponse = `Hi there! I'm ${companionName} and I'm ${personality}. How are you feeling today?`;
    } else if (userMessage.toLowerCase().includes('how are you')) {
      fallbackResponse = `I'm doing great, thank you for asking! I'm here and ready to chat with you. How about you?`;
    } else if (userMessage.toLowerCase().includes('thank')) {
      fallbackResponse = `You're very welcome! I'm here for you whenever you need to talk.`;
    } else if (userMessage.toLowerCase().includes('bye') || userMessage.toLowerCase().includes('goodbye')) {
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
  
  // Don't expose internal error details to client
  const isDevelopment = process.env.NODE_ENV === 'development';
  const errorResponse = {
    error: 'Internal server error',
    message: 'Something went wrong. Please try again later.',
    ...(isDevelopment && { details: err.message })
  };
  
  res.status(500).json(errorResponse);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`🛑 ${signal} received, shutting down gracefully...`);
  
  // Stop accepting new connections
  server.close(() => {
    console.log('✅ HTTP server closed');
    
    // Close database connections
    // Supabase uses HTTP connections, no need to close
    // Close SQLite database
    db.close();
    console.log('✅ SQLite database closed');
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.error('❌ Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

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
    
    // --- MongoDB: Fetch conversation (optional) - DISABLED (using Supabase) ---
    // MongoDB is disabled - using SQLite for persistence
    // if (mongoConnected) {
    //   try {
    //     const mongoConversation = await AIConversation.findOne({ sessionId });
    //     if (mongoConversation) {
    //       return res.json({
    //         conversation: {
    //           sessionId: mongoConversation.sessionId,
    //           companionConfig: mongoConversation.companionConfig,
    //           createdAt: mongoConversation.createdAt,
    //           updatedAt: mongoConversation.updatedAt
    //         },
    //         messages: mongoConversation.messages.map(msg => ({
    //           sender: msg.role === 'assistant' ? 'ai' : msg.role,
    //           content: msg.content,
    //           timestamp: msg.timestamp
    //         }))
    //       });
    //     }
    //   } catch (mongoError) {
    //     console.warn('⚠️  MongoDB fetch failed, falling back to SQLite:', mongoError.message);
    //   }
    // }
    
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
    const { limit = 20, offset = 0, activeOnly = 'false' } = req.query;
    const sessionsList = db.getMultiplayerSessions(parseInt(limit), parseInt(offset));
    
    // Filter active sessions if requested
    let filteredSessions = sessionsList;
    if (activeOnly === 'true') {
      filteredSessions = sessionsList.filter(s => s.is_active === 1);
    }
    
    // Enrich with real-time participant count from in-memory sessions
    const enrichedSessions = filteredSessions.map(session => {
      const inMemorySession = sessions.get(session.session_id);
      return {
        ...session,
        currentParticipants: inMemorySession ? inMemorySession.participants.size : 0
      };
    });
    
    res.json({
      sessions: enrichedSessions,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: enrichedSessions.length
      }
    });
  } catch (error) {
    console.error('❌ Error fetching multiplayer sessions:', error);
    monitor.logError(error, { endpoint: '/api/multiplayer/sessions' });
    res.status(500).json({ error: 'Failed to fetch multiplayer sessions' });
  }
});

// Create a named multiplayer session
app.post('/api/multiplayer/sessions', (req, res) => {
  try {
    const { title, sessionId } = req.body;
    
    if (!title || title.trim().length === 0) {
      return res.status(400).json({ error: 'Session title is required' });
    }
    
    // Generate session ID if not provided
    const finalSessionId = sessionId || (() => {
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substring(2, 6);
      return `${timestamp}${random}`.toUpperCase();
    })();
    
    // Create session in database
    try {
      db.createMultiplayerSession(finalSessionId, title.trim());
      console.log(`📊 Created named multiplayer session: ${finalSessionId} - ${title.trim()}`);
      
      res.status(201).json({
        sessionId: finalSessionId,
        title: title.trim(),
        message: 'Session created successfully'
      });
    } catch (error) {
      if (error.message === 'Session already exists and is active') {
        return res.status(409).json({ error: 'Session ID already exists' });
      }
      throw error;
    }
  } catch (error) {
    console.error('❌ Error creating multiplayer session:', error);
    monitor.logError(error, { endpoint: 'POST /api/multiplayer/sessions' });
    res.status(500).json({ error: 'Failed to create session' });
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

// Test route to verify server is working
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!', timestamp: new Date().toISOString() });
});

// Simple auth test route
app.get('/api/auth/test', (req, res) => {
  res.json({ message: 'Auth routes are working!', timestamp: new Date().toISOString() });
});

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

    // Check if Supabase is available
    if (supabaseConnected) {
      try {
        // Check if user already exists in Supabase
        const existingUserByUsername = await User.findOne({ username });
        const existingUserByEmail = await User.findOne({ email });

        if (existingUserByUsername || existingUserByEmail) {
          return res.status(409).json({ error: 'Username or email already exists' });
        }

        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create user in Supabase
        const user = await User.create({
          username,
          email,
          password: hashedPassword
        });

        // Generate JWT token
        const token = jwt.sign(
          { userId: user.id, username: user.username },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        return res.status(201).json({
          message: 'User registered successfully',
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            createdAt: user.createdAt
          }
        });
      } catch (supabaseError) {
        console.warn('⚠️  Supabase registration failed, falling back to SQLite:', supabaseError.message);
      }
    }

    // Fallback to SQLite registration
    try {
      // Check if user already exists in SQLite
      const existingUser = db.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ error: 'Username already exists' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);
      const newUserId = `user-${Date.now()}`;
      
      // Create user in SQLite
      const user = db.createUser(newUserId, username, email, passwordHash);
      
      // Generate JWT token
      const token = jwt.sign(
        { userId: newUserId, username: username },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt
        }
      });

    } catch (sqliteError) {
      console.error('❌ SQLite registration failed:', sqliteError.message);
      if (sqliteError.message.includes('already exists')) {
        return res.status(409).json({ error: sqliteError.message });
      }
      return res.status(500).json({ error: 'Registration system unavailable' });
    }

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

    // Check if Supabase is available
    if (supabaseConnected) {
      try {
        // Find user in Supabase
        const user = await User.findOne({ username });

        if (!user) {
          return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
          return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Update last login
        await User.updateLastLogin(user.id);

        // Generate JWT token
        const token = jwt.sign(
          { userId: user.id, username: user.username },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        return res.json({
          message: 'Login successful',
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            lastLogin: new Date()
          }
        });
      } catch (supabaseError) {
        console.warn('⚠️  Supabase login failed, falling back to SQLite:', supabaseError.message);
      }
    }

    // Fallback to SQLite authentication
    try {
      // Find user in SQLite
      const user = db.getUserByUsername(username);
      
      if (!user) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      // Update last login
      db.updateUserLastLogin(user.id);

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          lastLogin: new Date()
        }
      });

    } catch (sqliteError) {
      console.error('❌ SQLite authentication failed:', sqliteError.message);
      return res.status(500).json({ error: 'Authentication system unavailable' });
    }

  } catch (error) {
    console.error('❌ Login error:', error);
    monitor.logError(error, { endpoint: '/api/auth/login' });
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get Current User Profile (requires authentication)
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Check if this is a SQLite user ID (starts with "user-")
    const isSQLiteUser = typeof userId === 'string' && userId.startsWith('user-');
    
    // Try Supabase first if connected and user ID looks like UUID (Supabase format)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    if (supabaseConnected && !isSQLiteUser && isUUID) {
      try {
        const user = await User.findById(userId);
        if (user) {
          return res.json({
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              createdAt: user.createdAt,
              lastLogin: user.lastLogin
            }
          });
        }
      } catch (supabaseError) {
        // If Supabase query fails, fall through to SQLite
        console.warn('⚠️  Supabase profile fetch failed, falling back to SQLite:', supabaseError.message);
      }
    }
    
    // Fallback to SQLite user (or if Supabase not connected)
    if (isSQLiteUser || !supabaseConnected) {
      try {
        const user = db.getUserById(userId);
        if (user) {
          return res.json({
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              createdAt: user.created_at,
              lastLogin: user.last_login
            }
          });
        }
      } catch (dbError) {
        console.warn('⚠️  SQLite user fetch failed:', dbError.message);
      }
      
      // Fallback: return basic info from JWT token if user not found in DB
      return res.json({
        user: {
          id: userId,
          username: req.user.username || 'User',
          email: `${req.user.username || 'user'}@example.com`,
          createdAt: new Date(parseInt(userId.split('-')[1]) || Date.now()),
          lastLogin: new Date()
        }
      });
    }

    return res.status(404).json({ error: 'User not found' });

  } catch (error) {
    console.error('❌ Profile fetch error:', error);
    monitor.logError(error, { endpoint: '/api/auth/profile' });
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Get Current User (token validation only - no authentication required)
app.get('/api/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify token
    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      try {
        // Check if Supabase is available
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decoded.userId);
        if (supabaseConnected && isUUID) {
          try {
            const user = await User.findById(decoded.userId);
            if (user) {
              return res.json({
                user: {
                  id: user.id,
                  username: user.username,
                  email: user.email,
                  createdAt: user.createdAt,
                  lastLogin: user.lastLogin
                }
              });
            }
          } catch (supabaseError) {
            console.warn('⚠️  Supabase user fetch failed:', supabaseError.message);
          }
        }

        // Fallback for SQLite users or when Supabase is unavailable
        // For now, return the decoded token info
        return res.json({
          user: {
            id: decoded.userId,
            username: decoded.username,
            email: `${decoded.username}@example.com`,
            createdAt: new Date(),
            lastLogin: new Date()
          }
        });

      } catch (error) {
        console.error('❌ User fetch error:', error);
        return res.status(500).json({ error: 'Failed to fetch user' });
      }
    });

  } catch (error) {
    console.error('❌ Auth check error:', error);
    res.status(500).json({ error: 'Authentication check failed' });
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
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(409).json({ error: 'Username already exists' });
      }
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({ error: 'Email already exists' });
      }
    }

    // Update in Supabase or SQLite
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.user.userId);
    if (supabaseConnected && isUUID) {
      const updateData = {};
      if (username) updateData.username = username;
      if (email) updateData.email = email;
      
      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', req.user.userId)
        .select()
        .single();
      
      if (error) throw error;
      
      return res.json({
        message: 'Profile updated successfully',
        user: {
          id: data.id,
          username: data.username,
          email: data.email,
          createdAt: data.created_at,
          lastLogin: data.last_login
        }
      });
    } else {
      // SQLite update would go here
      return res.status(500).json({ error: 'Profile update not yet implemented for SQLite users' });
    }

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

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password and update in Supabase or SQLite
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    if (supabaseConnected && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.user.userId)) {
      // Update in Supabase
      const { error } = await supabase
        .from('users')
        .update({ password_hash: hashedPassword })
        .eq('id', req.user.userId);
      
      if (error) throw error;
    } else {
      // Update in SQLite (would need to implement this in DatabaseManager)
      return res.status(500).json({ error: 'Password update not yet implemented for SQLite users' });
    }

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

// Debug route to see all registered routes
app.get('/api/debug/routes', (req, res) => {
  const routes = [];
  app._router.stack.forEach(function(r){
    if (r.route && r.route.path){
      routes.push(`${Object.keys(r.route.methods).join(',').toUpperCase()} ${r.route.path}`);
    }
  });
  res.json({ routes });
});

// 404 handler - must be last
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested resource was not found.'
  });
}); 
