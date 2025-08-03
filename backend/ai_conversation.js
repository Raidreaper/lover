import mongoose from 'mongoose';

// Schema for individual AI messages
const aiMessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 10000
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Schema for AI conversations
const aiConversationSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  conversationId: {
    type: String,
    required: true,
    unique: true
  },
  companionConfig: {
    name: {
      type: String,
      required: true,
      maxlength: 50
    },
    personality: {
      type: String,
      required: true,
      maxlength: 1000
    },
    identity: {
      type: String,
      required: true,
      maxlength: 1000
    },
    gender: {
      type: String,
      required: true,
      maxlength: 20
    },
    role: {
      type: String,
      required: true,
      maxlength: 500
    }
  },
  messages: [aiMessageSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

// Update the updatedAt field before saving
aiConversationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for faster queries
aiConversationSchema.index({ sessionId: 1 });
aiConversationSchema.index({ conversationId: 1 });
aiConversationSchema.index({ createdAt: -1 });

const AIConversation = mongoose.model('AIConversation', aiConversationSchema);

export default AIConversation; 