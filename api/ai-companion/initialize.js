import { GoogleGenerativeAI } from '@google/generative-ai';
import mongoose from 'mongoose';
import AIConversation from '../../backend/ai_conversation.js';

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://kteams200:RemGUNZhXdPySZMe@cluster0.stsut.mongodb.net/lovers_code?retryWrites=true&w=majority';

let mongoConnected = false;

// Connect to MongoDB
async function connectDB() {
  if (!mongoConnected) {
    try {
      await mongoose.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      mongoConnected = true;
      console.log('✅ MongoDB connected successfully');
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      mongoConnected = false;
    }
  }
}

// Initialize Gemini AI
let genAI, model;
try {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyD0vDWiSPZe2A7-O3ocsxD3s73CLgy13oE';
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  console.log('✅ Gemini AI initialized');
} catch (error) {
  console.error('❌ Failed to initialize Gemini AI:', error.message);
  model = null;
}

// Validation middleware
function validateCompanionConfig(companionConfig) {
  if (!companionConfig) {
    throw new Error('Companion configuration is required');
  }
  
  const requiredFields = ['name', 'personality', 'identity', 'gender', 'role'];
  const missingFields = requiredFields.filter(field => !companionConfig[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }
  
  return {
    name: String(companionConfig.name).trim().substring(0, 50),
    personality: String(companionConfig.personality).trim().substring(0, 1000),
    identity: String(companionConfig.identity).trim().substring(0, 1000),
    gender: String(companionConfig.gender).trim().substring(0, 20),
    role: String(companionConfig.role).trim().substring(0, 500)
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    const companionConfig = validateCompanionConfig(req.body.companionConfig);
    
    // Generate session ID
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Generate initial greeting
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

    let greeting = null;
    let retries = 3;
    
    while (retries > 0 && !greeting) {
      try {
        const result = await model.generateContent(context);
        const response = await result.response;
        greeting = response.text();
      } catch (apiError) {
        retries--;
        if (retries === 0) throw apiError;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (greeting && mongoConnected) {
      // Save to MongoDB
      await AIConversation.create({
        sessionId,
        conversationId,
        companionConfig,
        messages: [{ role: 'assistant', content: greeting, timestamp: new Date() }],
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    res.json({
      greeting: greeting || `Hello! I'm ${companionConfig.name}, your AI companion. I'm excited to be here with you today. What would you like to talk about?`,
      companionName: companionConfig.name,
      sessionId,
      conversationId,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('❌ AI Companion initialization error:', error.message);
    
    const companionName = req.body.companionConfig?.name || 'your companion';
    const personality = req.body.companionConfig?.personality || 'caring and supportive';
    const fallbackGreeting = `Hello! I'm ${companionName}, your AI companion. I'm ${personality} and I'm excited to be here with you today. What would you like to talk about?`;
    
    res.status(500).json({ 
      error: 'Failed to initialize companion',
      greeting: fallbackGreeting,
      retryAfter: '30 seconds'
    });
  }
} 