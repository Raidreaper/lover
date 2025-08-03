import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, MessageCircle, Clock, User, Bot, Download, Trash2, Edit3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Conversation {
  id: number;
  session_id: string;
  title: string;
  companion_name: string;
  message_count: number;
  last_message: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

interface Message {
  id: number;
  sender: 'user' | 'ai';
  content: string;
  emotion: string;
  timestamp: string;
}

const ConversationHistory: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showMessages, setShowMessages] = useState(false);
  const [editingTitle, setEditingTitle] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch('http://localhost:4000/api/conversations');
      if (!response.ok) throw new Error('Failed to fetch conversations');
      const data = await response.json();
      if (!data.conversations) throw new Error('Malformed response from server');
      setConversations(data.conversations);
    } catch (error: any) {
      setError(error.message || 'Failed to fetch conversations');
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const searchConversations = async () => {
    if (!searchTerm.trim()) {
      fetchConversations();
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:4000/api/conversations/search?q=${encodeURIComponent(searchTerm)}`);
      if (!response.ok) throw new Error('Failed to search conversations');
      const data = await response.json();
      if (!data.conversations) throw new Error('Malformed response from server');
      setConversations(data.conversations);
    } catch (error: any) {
      setError(error.message || 'Failed to search conversations');
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (sessionId: string) => {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:4000/api/conversations/${sessionId}`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      const data = await response.json();
      if (!data.messages) throw new Error('Malformed response from server');
      setMessages(data.messages);
      setShowMessages(true);
    } catch (error: any) {
      setError(error.message || 'Failed to fetch messages');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const exportConversation = async (conversationId: number) => {
    try {
      const response = await fetch(`http://localhost:4000/api/conversations/${conversationId}/export`);
      const data = await response.json();
      
      // Create and download JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conversation_${conversationId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export conversation:', error);
    }
  };

  const updateTitle = async (conversationId: number, newTitle: string) => {
    try {
      await fetch(`http://localhost:4000/api/conversations/${conversationId}/title`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle })
      });
      
      // Update local state
      setConversations(prev => prev.map(conv => 
        conv.id === conversationId ? { ...conv, title: newTitle } : conv
      ));
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update title:', error);
    }
  };

  const deleteConversation = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      return;
    }

    try {
      await fetch(`http://localhost:4000/api/conversations/${sessionId}`, {
        method: 'DELETE'
      });
      
      // Remove from local state
      setConversations(prev => prev.filter(conv => conv.session_id !== sessionId));
      if (selectedConversation?.session_id === sessionId) {
        setSelectedConversation(null);
        setShowMessages(false);
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getEmotionColor = (emotion: string) => {
    const colors: { [key: string]: string } = {
      'welcoming': 'bg-green-100 text-green-800',
      'empathetic': 'bg-blue-100 text-blue-800',
      'responsive': 'bg-purple-100 text-purple-800',
      'apologetic': 'bg-yellow-100 text-yellow-800',
      'neutral': 'bg-gray-100 text-gray-800'
    };
    return colors[emotion] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading conversations...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600 bg-red-50 border border-red-200 rounded-lg p-6">
            Error: {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Conversation History</h1>
        <Button onClick={() => navigate('/')} variant="outline">
          Back to Home
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversation List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Conversations ({conversations.length})
              </CardTitle>
              <div className="flex gap-2">
                <Input
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchConversations()}
                />
                <Button onClick={searchConversations} size="sm">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {conversations.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    No conversations found
                  </div>
                ) : (
                  <div className="space-y-2">
                    {conversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedConversation?.id === conversation.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => {
                          setSelectedConversation(conversation);
                          fetchMessages(conversation.session_id);
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium truncate">{conversation.title}</h3>
                            <p className="text-sm text-muted-foreground truncate">
                              {conversation.companion_name}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {conversation.message_count} messages
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(conversation.updated_at)}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-1 ml-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                exportConversation(conversation.id);
                              }}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteConversation(conversation.session_id);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Messages View */}
        <div className="lg:col-span-2">
          {selectedConversation && showMessages ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && updateTitle(selectedConversation.id, editingTitle)}
                        />
                        <Button
                          size="sm"
                          onClick={() => updateTitle(selectedConversation.id, editingTitle)}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsEditing(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <CardTitle>{selectedConversation.title}</CardTitle>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingTitle(selectedConversation.title);
                            setIsEditing(true);
                          }}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {selectedConversation.companion_name}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => exportConversation(selectedConversation.id)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Export
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Created: {formatDate(selectedConversation.created_at)} | 
                  Last updated: {formatDate(selectedConversation.updated_at)}
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${
                          message.sender === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${
                            message.sender === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {message.sender === 'user' ? (
                              <User className="h-4 w-4" />
                            ) : (
                              <Bot className="h-4 w-4" />
                            )}
                            <span className="text-sm font-medium">
                              {message.sender === 'user' ? 'You' : selectedConversation.companion_name}
                            </span>
                            {message.emotion && (
                              <Badge className={`text-xs ${getEmotionColor(message.emotion)}`}>
                                {message.emotion}
                              </Badge>
                            )}
                          </div>
                          <p className="whitespace-pre-wrap">{message.content}</p>
                          <div className="flex items-center gap-1 mt-2 text-xs opacity-70">
                            <Clock className="h-3 w-3" />
                            {formatDate(message.timestamp)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-96">
                <div className="text-center text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a conversation to view messages</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationHistory;