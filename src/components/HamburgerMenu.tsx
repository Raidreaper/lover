import React, { useState } from "react";
import { Menu, X, Heart, Users, MessageCircle, Share2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";

interface HamburgerMenuProps {
  currentPage: 'solo' | 'multiplayer' | 'ai-companion';
  sessionId?: string;
  onCopySessionId?: () => void;
  onResetCompanion?: () => void;
}

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ 
  currentPage, 
  sessionId, 
  onCopySessionId,
  onResetCompanion 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const navigate = useNavigate();

  const handleNavigation = (page: string) => {
    setIsOpen(false);
    navigate(`/${page}`);
  };

  const copySessionId = () => {
    if (sessionId && onCopySessionId) {
      onCopySessionId();
    }
    setShowShareDialog(false);
  };

  return (
    <>
      {/* Hamburger Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="text-white hover:bg-purple-700/20 lg:hidden"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu Panel */}
          <div className="absolute top-0 right-0 w-80 h-full bg-white dark:bg-gray-900 shadow-xl transform transition-transform duration-300 ease-in-out">
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Menu
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Navigation Links */}
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  className={`w-full justify-start text-left ${
                    currentPage === 'solo' 
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => handleNavigation('solo')}
                >
                  <Heart className="w-4 h-4 mr-3" />
                  Solo Journey
                </Button>
                
                <Button
                  variant="ghost"
                  className={`w-full justify-start text-left ${
                    currentPage === 'multiplayer' 
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => handleNavigation('multiplayer')}
                >
                  <Users className="w-4 h-4 mr-3" />
                  Multiplayer
                </Button>
                
                <Button
                  variant="ghost"
                  className={`w-full justify-start text-left ${
                    currentPage === 'ai-companion' 
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => handleNavigation('ai-companion-onboarding')}
                >
                  <MessageCircle className="w-4 h-4 mr-3" />
                  AI Companion
                </Button>
              </div>

              {/* Mode Badges */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Current Mode
                </h4>
                <div className="space-y-2">
                  {currentPage === 'solo' && (
                    <Badge variant="secondary" className="w-full justify-center bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Growth Mode
                    </Badge>
                  )}
                  {currentPage === 'multiplayer' && (
                    <Badge variant="secondary" className="w-full justify-center bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                      <Users className="w-3 h-3 mr-1" />
                      Connection Mode
                    </Badge>
                  )}
                  {currentPage === 'ai-companion' && (
                    <>
                      <Badge variant="secondary" className="w-full justify-center bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Learning Mode
                      </Badge>
                      <Badge variant="secondary" className="w-full justify-center bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300">
                        <Heart className="w-3 h-3 mr-1" />
                        Empathy Level: High
                      </Badge>
                    </>
                  )}
                </div>
              </div>

              {/* Share Button */}
              {sessionId && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Session
                  </h4>
                  <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="default" 
                        className="w-full bg-purple-500 hover:bg-purple-600 text-white"
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        Share Session
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Share Session</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-800 rounded">
                          <Badge variant="secondary" className="font-mono">{sessionId}</Badge>
                          <Button size="sm" onClick={copySessionId}>
                            Copy
                          </Button>
                        </div>
                        <Button className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600">
                          Share via...
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}

              {/* Settings for AI Companion */}
              {currentPage === 'ai-companion' && onResetCompanion && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Settings
                  </h4>
                  <Button 
                    variant="outline" 
                    className="w-full border-pink-300 hover:bg-pink-50 dark:border-pink-700 dark:hover:bg-pink-900/20"
                    onClick={() => {
                      setIsOpen(false);
                      onResetCompanion();
                    }}
                  >
                    Reset Companion
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HamburgerMenu; 