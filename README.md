# Lover's Code

A comprehensive relationship enhancement platform that combines AI companionship, interactive games, and relationship-building activities. It's designed to help users improve their relationships, practice communication skills, and explore emotional connections through technology.

## 🚀 Features

- **AI Companion**: Personalized AI companions for emotional support and conversation
- **Multiplayer Sessions**: Real-time chat with 400+ relationship questions
- **Solo Activities**: Individual relationship-building exercises
- **Conversation History**: Track and manage your interactions
- **Modern UI**: Beautiful, responsive design with dark mode support

## 🛠️ Technologies

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express, Socket.IO, MongoDB, SQLite
- **AI**: Google Gemini AI integration
- **Deployment**: Vercel (Frontend), Render (Backend)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>
cd lover's-code

# Install dependencies
npm install

# Start development server
npm run dev
```

### Backend Setup

```sh
# Navigate to backend directory
cd backend

# Install backend dependencies
npm install

# Create environment file
cp .env.example .env

# Add your API keys to .env file
# GEMINI_API_KEY=your_gemini_api_key_here
# MONGODB_URI=your_mongodb_uri_here

# Start backend server
npm run dev
```

## 🔧 Environment Variables

### Frontend (.env)
```env
NODE_ENV=development
```

### Backend (.env)
```env
GEMINI_API_KEY=your_gemini_api_key_here
MONGODB_URI=your_mongodb_uri_here
PORT=4000
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=your_jwt_secret_here
```

## 📱 Usage

1. **AI Companion**: Create a personalized AI companion and start meaningful conversations
2. **Multiplayer**: Join or create sessions to play relationship-building games with others
3. **Solo Activities**: Practice communication skills on your own
4. **History**: Review your past conversations and interactions

## 🚀 Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Backend (Render)
1. Connect your GitHub repository to Render
2. Set environment variables in Render dashboard
3. Deploy automatically on push to main branch

## 📚 API Documentation

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### AI Companion
- `POST /api/ai-companion/initialize` - Initialize AI companion
- `POST /api/ai-companion/chat` - Chat with AI companion

### Multiplayer
- WebSocket events for real-time communication
- Session management and message handling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please open an issue on GitHub or contact the development team.
