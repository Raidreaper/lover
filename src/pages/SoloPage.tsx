import React, { useState } from "react";
import { ArrowLeft, Heart, Send, User, Crown, MessageCircle, Sparkles, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TruthOrDareSpinner from "@/components/TruthOrDareSpinner";
import SelfChatSystem from "@/components/SelfChatSystem";
import { Badge } from "@/components/ui/badge";
import HamburgerMenu from "@/components/HamburgerMenu";

const SoloPage = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Welcome to your solo journey! This is your personal space to practice conversations, explore your thoughts, and discover what makes your heart sing. What's on your mind today?",
      sender: "system",
      timestamp: new Date()
    }
  ]);
  const [activeTab, setActiveTab] = useState("chat");

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const newMessage = {
      id: messages.length + 1,
      text: message,
      sender: "user",
      timestamp: new Date()
    };

    setMessages([...messages, newMessage]);
    setMessage("");

    // Simulate a thoughtful response
    setTimeout(() => {
      const responses = [
        "That's a beautiful thought. Tell me more about what inspired you to share that.",
        "I can sense the emotions behind your words. How does that make you feel?",
        "Your perspective is unique and valuable. What would you like to explore next?",
        "There's poetry in your message. What does your heart want to say?",
      ];
      
      const response = {
        id: messages.length + 2,
        text: responses[Math.floor(Math.random() * responses.length)],
        sender: "system",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, response]);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-purple-50 to-slate-200 dark:from-slate-900 dark:via-purple-900 dark:to-slate-800 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-3 sm:p-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="text-white hover:bg-purple-700/20"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-sm sm:text-lg">Solo Journey</h1>
            <div className="flex items-center gap-1 sm:gap-2 text-xs">
              <span className="text-purple-100">Self-Discovery</span>
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-purple-100">Active</span>
            </div>
          </div>
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/multiplayer')}
            className="text-white hover:bg-purple-700/20"
          >
            <Users className="w-4 h-4 mr-1" />
            Multiplayer
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/ai-companion-onboarding')}
            className="text-white hover:bg-purple-700/20"
          >
            <MessageCircle className="w-4 h-4 mr-1" />
            AI Companion
          </Button>
          <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
            <Sparkles className="w-3 h-3 mr-1" />
            Growth Mode
          </Badge>
        </div>

        {/* Mobile Hamburger Menu */}
        <HamburgerMenu currentPage="solo" />
      </div>

      {/* Main Content: Two-column layout */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 sm:gap-6 max-w-7xl mx-auto w-full p-4 sm:p-6">
        {/* Main Tabs Area */}
        <div className="flex-1 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6 lg:mb-8 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                              <TabsTrigger value="chat" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <Heart className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Solo Chat</span>
                  <span className="sm:hidden">Chat</span>
                </TabsTrigger>
                <TabsTrigger value="spinner" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <Crown className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Truth or Dare</span>
                  <span className="sm:hidden">Dare</span>
                </TabsTrigger>
                <TabsTrigger value="selfchat" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Self Chat</span>
                  <span className="sm:hidden">Self</span>
                </TabsTrigger>
            </TabsList>

            {/* Solo Chat Tab */}
            <TabsContent value="chat" className="space-y-4 sm:space-y-6">
              <Card className="border-rose-200/50 bg-white/80 dark:bg-black/40 backdrop-blur-sm">
                <CardContent className="p-4 sm:p-6 h-80 sm:h-96 overflow-y-auto space-y-3 sm:space-y-4">
                  {messages.length === 0 && (
                    <div className="text-center py-6 sm:py-8 text-rose-400">
                      <Heart className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm sm:text-base">No messages yet. Start the conversation!</p>
                    </div>
                  )}
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                    >
                      <div className={`flex items-start gap-2 sm:gap-3 max-w-xs sm:max-w-lg ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-gradient-to-br ${
                          msg.sender === 'user' 
                            ? 'from-rose-400 to-pink-500' 
                            : 'from-purple-400 to-indigo-500'
                        }`}>
                          {msg.sender === 'user' ? (
                            <User className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                          ) : (
                            <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                          )}
                        </div>
                        <div className={`rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-3 ${
                          msg.sender === 'user' 
                            ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white' 
                            : 'bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/50 dark:to-indigo-900/50 text-foreground'
                        }`}>
                          <p className="text-xs sm:text-sm leading-relaxed">{msg.text}</p>
                          <div className="flex items-center justify-between mt-1 sm:mt-2">
                            <p className={`text-xs ${
                              msg.sender === 'user' 
                                ? 'text-rose-100' 
                                : 'text-muted-foreground'
                            }`}>
                              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
              {/* Message Input */}
              <div className="bg-white dark:bg-black/40 p-3 sm:p-4 border-t border-rose-200/40 dark:border-rose-800/40 sticky bottom-0 z-10">
                <form onSubmit={e => { e.preventDefault(); handleSendMessage(); }} className="flex items-center gap-2">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Share your thoughts, dreams, or questions..."
                    className="flex-1 border-rose-200 focus:border-rose-400 bg-white/80 dark:bg-black/40 backdrop-blur-sm text-sm"
                  />
                  <Button
                    type="submit"
                    disabled={!message.trim()}
                    className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white px-3 sm:px-4"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
              <p className="text-sm text-muted-foreground text-center italic mt-4">
                "In solitude, we find the strength to love others and ourselves more deeply."
              </p>
            </TabsContent>

            {/* Truth or Dare Spinner Tab */}
            <TabsContent value="spinner" className="space-y-4 sm:space-y-6">
              <Card className="border-purple-200/50 bg-white/80 dark:bg-black/40 backdrop-blur-sm">
                <CardContent>
                  <TruthOrDareSpinner />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Self Chat System Tab */}
            <TabsContent value="selfchat" className="space-y-4 sm:space-y-6">
              <Card className="border-blue-200/50 bg-white/80 dark:bg-black/40 backdrop-blur-sm">
                <CardContent>
                  <SelfChatSystem />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        {/* Sidebar */}
        <div className="w-full lg:w-80 space-y-4 sm:space-y-6 mt-6 sm:mt-8 lg:mt-0">
          {/* Self-Reflection Stats */}
          <Card className="border-rose-200/50 bg-white/80 dark:bg-black/40 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-rose-800 dark:text-rose-200 flex items-center gap-2 text-sm sm:text-base">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                Self-Reflection Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-muted-foreground">Messages Sent</span>
                <span className="font-bold text-rose-600 text-sm sm:text-base">{messages.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-muted-foreground">Longest Streak</span>
                <span className="font-bold text-rose-600 text-sm sm:text-base">{Math.max(...messages.map(m => (m.text || '').split(' ').length), 0)} words</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-muted-foreground">First Message</span>
                <span className="font-bold text-rose-600 text-sm sm:text-base">{messages[0]?.text?.slice(0, 16) || '-'}</span>
              </div>
            </CardContent>
          </Card>
          {/* Quick Prompts */}
          <Card className="border-rose-200/50 bg-white/80 dark:bg-black/40 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-rose-800 dark:text-rose-200 text-sm sm:text-base">Quick Prompts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {["Gratitude", "Dreams", "Goals", "Fears", "Memories", "Passion"].map((topic) => (
                  <Button
                    key={topic}
                    variant="outline"
                    size="sm"
                    className="text-xs border-rose-200 hover:bg-rose-100 hover:border-rose-300"
                    onClick={() => setMessage(`Let's talk about ${topic.toLowerCase()}`)}
                  >
                    {topic}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Footer */}
      <div className="text-center p-4 sm:p-6">
        <p className="text-xs sm:text-sm text-muted-foreground italic">
          "In solitude, we find the strength to love others and ourselves more deeply."
        </p>
      </div>
    </div>
  );
};

export default SoloPage;