import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MessageCircle, Lightbulb, Heart, Smile, Coffee, BookOpen, Music, Camera, Gamepad2 } from 'lucide-react';

interface ChatMessage {
  id: number;
  text: string;
  sender: 'user' | 'self';
  timestamp: Date;
  mood?: string;
  category?: string;
}

interface ConversationStarter {
  id: number;
  text: string;
  category: string;
  mood: string;
}

const SelfChatSystem: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [currentMood, setCurrentMood] = useState('neutral');
  const [chatSession, setChatSession] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Conversation starters database
  const conversationStarters: ConversationStarter[] = [
    // Self-reflection
    { id: 1, text: "What's something I'm grateful for today?", category: 'reflection', mood: 'grateful' },
    { id: 2, text: "What's a goal I want to achieve this week?", category: 'goals', mood: 'motivated' },
    { id: 3, text: "What's something I learned about myself recently?", category: 'reflection', mood: 'curious' },
    { id: 4, text: "What's a challenge I overcame recently?", category: 'achievement', mood: 'proud' },
    { id: 5, text: "What's something I'm looking forward to?", category: 'future', mood: 'excited' },
    
    // Creative prompts
    { id: 6, text: "If I could have any superpower, what would it be?", category: 'creative', mood: 'imaginative' },
    { id: 7, text: "What's my ideal vacation destination?", category: 'dreams', mood: 'adventurous' },
    { id: 8, text: "What's a skill I wish I had?", category: 'growth', mood: 'ambitious' },
    { id: 9, text: "What's my favorite childhood memory?", category: 'nostalgia', mood: 'warm' },
    { id: 10, text: "What's something that always makes me laugh?", category: 'joy', mood: 'happy' },
    
    // Relationship thoughts
    { id: 11, text: "What qualities do I value most in a friend?", category: 'relationships', mood: 'thoughtful' },
    { id: 12, text: "What's my love language?", category: 'relationships', mood: 'romantic' },
    { id: 13, text: "What's something I want to improve about myself?", category: 'growth', mood: 'determined' },
    { id: 14, text: "What's a compliment I received recently?", category: 'confidence', mood: 'appreciated' },
    { id: 15, text: "What's something I'm passionate about?", category: 'passion', mood: 'energetic' },
    
    // Fun questions
    { id: 16, text: "What's my favorite movie and why?", category: 'entertainment', mood: 'entertained' },
    { id: 17, text: "What's my dream job?", category: 'career', mood: 'ambitious' },
    { id: 18, text: "What's something I'm afraid of?", category: 'fears', mood: 'vulnerable' },
    { id: 19, text: "What's my biggest strength?", category: 'confidence', mood: 'confident' },
    { id: 20, text: "What's something I want to learn?", category: 'learning', mood: 'curious' },
    
    // Daily life
    { id: 21, text: "What's the best part of my day so far?", category: 'daily', mood: 'positive' },
    { id: 22, text: "What's something I'm looking forward to tomorrow?", category: 'future', mood: 'hopeful' },
    { id: 23, text: "What's a habit I want to develop?", category: 'habits', mood: 'focused' },
    { id: 24, text: "What's something that stressed me out today?", category: 'stress', mood: 'stressed' },
    { id: 25, text: "What's something I did today that I'm proud of?", category: 'achievement', mood: 'proud' }
  ];

  // Mood-based responses
  const getMoodResponse = (mood: string): string => {
    const responses = {
      grateful: [
        "That's beautiful! Gratitude is such a powerful emotion. What else are you thankful for?",
        "I love that you're focusing on the positive! It really changes your perspective, doesn't it?",
        "That's wonderful! Being grateful for the little things makes life so much richer."
      ],
      motivated: [
        "That's fantastic! You have such drive and determination. I believe in you!",
        "Setting goals is the first step to achieving them. You've got this!",
        "Your ambition is inspiring! What's your plan to reach this goal?"
      ],
      curious: [
        "Self-discovery is such an exciting journey! What else are you learning about yourself?",
        "That's really interesting! Self-awareness is a superpower. Tell me more!",
        "I love how you're always learning and growing. What sparked this realization?"
      ],
      proud: [
        "You should be proud! Overcoming challenges shows your strength and resilience.",
        "That's amazing! Your determination and hard work are really paying off.",
        "You've accomplished something great! How did you feel when you succeeded?"
      ],
      excited: [
        "That sounds wonderful! Your enthusiasm is contagious!",
        "I'm excited for you too! What makes this so special?",
        "That's going to be amazing! I can feel your positive energy!"
      ],
      imaginative: [
        "That's such a creative choice! I love your imagination!",
        "Your creativity knows no bounds! How would you use this power?",
        "That's brilliant! Your mind is so fascinating!"
      ],
      adventurous: [
        "That sounds like an incredible adventure! What draws you to that place?",
        "Your sense of adventure is inspiring! What would you do there?",
        "That's going to be an amazing experience! I can feel your wanderlust!"
      ],
      ambitious: [
        "Your drive to improve yourself is admirable! What's your plan to develop this skill?",
        "That's a great goal! Your ambition will take you far.",
        "I love your growth mindset! What's the first step toward learning this?"
      ],
      warm: [
        "That's such a beautiful memory! It must bring you so much joy.",
        "Childhood memories are so precious! What made this moment special?",
        "That's heartwarming! Those memories shape who we are."
      ],
      happy: [
        "Laughter is the best medicine! Your joy is infectious!",
        "That's wonderful! Finding humor in life is such a gift.",
        "Your happiness is beautiful! What else brings you joy?"
      ]
    };

    const moodResponses = responses[mood as keyof typeof responses] || [
      "That's really interesting! Tell me more about that.",
      "I love hearing your thoughts on this!",
      "That's a great perspective! What else is on your mind?"
    ];

    return moodResponses[Math.floor(Math.random() * moodResponses.length)];
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    setIsSending(true);
    const userMessage: ChatMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date(),
      mood: currentMood
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate thinking time
    setTimeout(() => {
      const selfResponse = getMoodResponse(currentMood);
      const selfMessage: ChatMessage = {
        id: Date.now() + 1,
        text: selfResponse,
        sender: 'self',
        timestamp: new Date(),
        mood: currentMood
      };

      setMessages(prev => [...prev, selfMessage]);
      setIsTyping(false);
      setIsSending(false);
    }, 1000 + Math.random() * 2000); // Random delay between 1-3 seconds
  };

  const handleConversationStarter = (starter: ConversationStarter) => {
    const starterMessage: ChatMessage = {
      id: Date.now(),
      text: starter.text,
      sender: 'self',
      timestamp: new Date(),
      mood: starter.mood,
      category: starter.category
    };

    setMessages(prev => [...prev, starterMessage]);
    setCurrentMood(starter.mood);
  };

  const startNewSession = () => {
    setMessages([]);
    setChatSession(prev => prev + 1);
    setCurrentMood('neutral');
  };

  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case 'happy': return <Smile className="h-4 w-4" />;
      case 'grateful': return <Heart className="h-4 w-4" />;
      case 'motivated': return <Lightbulb className="h-4 w-4" />;
      case 'excited': return <Coffee className="h-4 w-4" />;
      case 'curious': return <BookOpen className="h-4 w-4" />;
      case 'adventurous': return <Camera className="h-4 w-4" />;
      case 'creative': return <Music className="h-4 w-4" />;
      case 'focused': return <Gamepad2 className="h-4 w-4" />;
      default: return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'happy': return 'bg-yellow-100 text-yellow-800';
      case 'grateful': return 'bg-green-100 text-green-800';
      case 'motivated': return 'bg-blue-100 text-blue-800';
      case 'excited': return 'bg-orange-100 text-orange-800';
      case 'curious': return 'bg-purple-100 text-purple-800';
      case 'adventurous': return 'bg-indigo-100 text-indigo-800';
      case 'creative': return 'bg-pink-100 text-pink-800';
      case 'focused': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="space-y-6">
      {/* Chat Interface */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-2 border-blue-200/50">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl font-bold text-blue-800 dark:text-blue-200">
            <MessageCircle className="h-6 w-6" />
            Self Chat System
            <MessageCircle className="h-6 w-6" />
          </CardTitle>
          <p className="text-muted-foreground">Have a conversation with yourself and discover new insights!</p>
          <div className="flex items-center justify-center gap-2">
            <Badge className={getMoodColor(currentMood)}>
              {getMoodIcon(currentMood)}
              {currentMood}
            </Badge>
            <Badge variant="outline">Session {chatSession + 1}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Chat Messages */}
          <div className="h-96 border rounded-lg bg-white/50">
            <ScrollArea ref={scrollRef} className="h-full p-4">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Start a conversation with yourself!</p>
                  <p className="text-sm">Use conversation starters below or type your own message.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          message.sender === 'user'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.text}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs opacity-70">
                          {message.mood && (
                            <Badge className={`text-xs ${getMoodColor(message.mood)}`}>
                              {message.mood}
                            </Badge>
                          )}
                          <span>{message.timestamp.toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-sm text-muted-foreground">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type your message..."
              className="flex-1"
            />
            <Button 
              onClick={sendMessage} 
              disabled={!inputMessage.trim() || isTyping}
              loading={isSending}
              loadingText="Sending..."
            >
              <Send className="h-4 w-4" />
            </Button>
            <Button onClick={startNewSession} variant="outline">
              New Session
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Conversation Starters */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 border-2 border-green-200/50">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-green-800 dark:text-green-200">
            Conversation Starters
          </CardTitle>
          <p className="text-sm text-muted-foreground">Click any starter to begin a conversation with yourself!</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {conversationStarters.map((starter) => (
              <Button
                key={starter.id}
                onClick={() => handleConversationStarter(starter)}
                variant="outline"
                className="h-auto p-3 text-left border-green-300 hover:bg-green-50 dark:hover:bg-green-950/20"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {getMoodIcon(starter.mood)}
                    <Badge className={`text-xs ${getMoodColor(starter.mood)}`}>
                      {starter.category}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium">{starter.text}</p>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SelfChatSystem;