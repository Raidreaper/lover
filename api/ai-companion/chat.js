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
} catch (error) {
  console.error('❌ Failed to initialize Gemini AI:', error.message);
  model = null;
}

// Validation functions
function validateMessage(message) {
  if (!message || typeof message !== 'string') {
    throw new Error('Valid message is required');
  }
  
  const sanitizedMessage = String(message).trim().substring(0, 2000);
  
  if (sanitizedMessage.length === 0) {
    throw new Error('Message cannot be empty');
  }
  
  return sanitizedMessage;
}

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
    
    const { sessionId, conversationId } = req.body;
    const message = validateMessage(req.body.message);
    const companionConfig = validateCompanionConfig(req.body.companionConfig);
    
    // Find or create conversation in MongoDB
    let mongoConversation = null;
    if (mongoConnected) {
      try {
        mongoConversation = await AIConversation.findOne({ sessionId });
        if (!mongoConversation) {
          mongoConversation = await AIConversation.create({
            sessionId,
            conversationId,
            companionConfig,
            messages: [],
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
        
        // Save user message
        mongoConversation.messages.push({ 
          role: 'user', 
          content: message, 
          timestamp: new Date() 
        });
        mongoConversation.updatedAt = new Date();
        await mongoConversation.save();
      } catch (mongoError) {
        console.warn('⚠️  MongoDB operation failed:', mongoError.message);
      }
    }
    
    // Get conversation context
    let conversationContext = '';
    if (mongoConnected && mongoConversation && mongoConversation.messages.length > 0) {
      const mongoMessages = mongoConversation.messages.slice(-10);
      conversationContext = mongoMessages.map(msg => 
        `${msg.role === 'assistant' ? 'ai' : msg.role}: ${msg.content}`
      ).join('\n');
    }
    
    // Create AI context
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

    // Generate AI response
    let aiResponse = null;
    let retries = 3;
    
    while (retries > 0 && !aiResponse) {
      try {
        const result = await model.generateContent(context);
        const response = await result.response;
        aiResponse = response.text();
      } catch (apiError) {
        retries--;
        if (retries === 0) throw apiError;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (aiResponse && mongoConnected && mongoConversation) {
      // Save AI response to MongoDB
      mongoConversation.messages.push({ 
        role: 'assistant', 
        content: aiResponse, 
        timestamp: new Date() 
      });
      mongoConversation.updatedAt = new Date();
      await mongoConversation.save();
    }

    res.json({
      message: aiResponse || "I'm here for you! What's on your mind?",
      companionName: companionConfig.name,
      sessionId: sessionId || mongoConversation?.sessionId,
      conversationId: conversationId || mongoConversation?.conversationId,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('❌ AI Companion chat error:', error.message);
    
    const companionName = req.body.companionConfig?.name || 'your companion';
    const personality = req.body.companionConfig?.personality || 'caring';
    
    let fallbackResponse = "I'm here for you! What's on your mind?";
    
    // Context-aware fallback responses
    const message = req.body.message?.toLowerCase() || '';
    if (message.includes('hello') || message.includes('hi')) {
      fallbackResponse = `Hi there! I'm ${companionName} and I'm ${personality}. How are you feeling today?`;
    } else if (message.includes('how are you')) {
      fallbackResponse = `I'm doing great, thank you for asking! I'm here and ready to chat with you. How about you?`;
    } else if (message.includes('thank')) {
      fallbackResponse = `You're very welcome! I'm here for you whenever you need to talk.`;
    } else if (message.includes('bye') || message.includes('goodbye')) {
      fallbackResponse = `Take care! I'll be here when you want to chat again.`;
    }
    
    res.status(500).json({ 
      error: 'Failed to get AI response', 
      message: fallbackResponse,
      retryAfter: '30 seconds' 
    });
  }
} 