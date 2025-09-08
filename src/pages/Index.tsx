
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Sparkles, ArrowRight, Star, Moon, Sun, Cloud, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import logger from "@/lib/logger";

const Index = () => {
  logger.log('Index component rendering...');
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleGetStarted = () => {
    if (user) {
      // User is logged in, go to solo journey (main hub)
      navigate('/solo');
    } else {
      // User needs to register/login
      navigate('/onboarding');
    }
  };

  const handleFeatureClick = (feature: string) => {
    if (user) {
      // User is logged in, navigate directly to feature
      switch (feature) {
        case 'solo':
          navigate('/solo');
          break;
        case 'multiplayer':
          navigate('/multiplayer');
          break;
        case 'ai-companion':
          navigate('/ai-companion-onboarding');
          break;
        default:
          navigate('/solo');
      }
    } else {
      // User needs to register/login first
      navigate('/onboarding');
    }
  };

  const isNight = currentTime.getHours() >= 18 || currentTime.getHours() < 6;

  return (
    <div className={`min-h-screen transition-all duration-1000 ${
      isNight 
        ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800' 
        : 'bg-gradient-to-br from-slate-100 via-purple-50 to-slate-200'
    }`}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating Hearts */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-purple-300/10 rounded-full blur-xl animate-float"></div>
        <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-pink-300/10 rounded-full blur-xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/4 left-1/3 w-20 h-20 bg-indigo-300/10 rounded-full blur-xl animate-float" style={{ animationDelay: '4s' }}></div>
        
        {/* Stars for night mode */}
        {isNight && (
          <>
            <div className="absolute top-1/6 left-1/6 w-2 h-2 bg-white/40 rounded-full animate-sparkle"></div>
            <div className="absolute top-1/3 right-1/6 w-1 h-1 bg-white/30 rounded-full animate-sparkle" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-2/3 left-1/4 w-1.5 h-1.5 bg-white/35 rounded-full animate-sparkle" style={{ animationDelay: '3s' }}></div>
            <div className="absolute bottom-1/3 right-1/3 w-1 h-1 bg-white/25 rounded-full animate-sparkle" style={{ animationDelay: '2s' }}></div>
          </>
        )}
        
        {/* Subtle elements for day mode */}
        {!isNight && (
          <>
            <div className="absolute top-1/6 left-1/6 w-16 h-8 bg-white/20 rounded-full blur-sm animate-float"></div>
            <div className="absolute top-1/4 right-1/4 w-12 h-6 bg-white/15 rounded-full blur-sm animate-float" style={{ animationDelay: '3s' }}></div>
          </>
        )}
      </div>

              <main className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4 sm:p-6">
        {/* Time and Weather Indicator */}
        <div className="absolute top-4 sm:top-6 right-4 sm:right-6 flex items-center gap-2 text-slate-600 dark:text-slate-300">
          {isNight ? <Moon className="w-4 h-4 sm:w-5 sm:h-5" /> : <Sun className="w-4 h-4 sm:w-5 sm:h-5" />}
          <span className="text-xs sm:text-sm font-medium">
            {currentTime.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: true 
            })}
          </span>
        </div>

                {/* Main Content */}
        <div className="text-center max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Logo and Title */}
          <div className="mb-8 sm:mb-12">
            <div className="flex flex-col sm:flex-row items-center justify-center mb-6 sm:mb-8 gap-4 sm:gap-0">
              <div className="relative order-1 sm:order-1">
                <Heart className="w-8 h-8 sm:w-12 sm:h-12 text-purple-400 sm:mr-4 animate-pulse-slow" fill="currentColor" />
                <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-4 sm:h-4 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full animate-glow"></div>
              </div>
              <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-500 bg-clip-text text-transparent animate-fade-in order-2">
                Lover's Code
              </h1>
              <div className="relative sm:ml-4 order-3 sm:order-3">
                <Heart className="w-8 h-8 sm:w-12 sm:h-12 text-purple-400 animate-pulse-slow" fill="currentColor" />
                <div className="absolute -top-1 -left-1 w-2 h-2 sm:w-4 sm:h-4 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full animate-glow"></div>
              </div>
            </div>
            
            <p className="text-lg sm:text-xl md:text-2xl text-slate-700 dark:text-slate-200 max-w-3xl mx-auto leading-relaxed mb-4 sm:mb-6 animate-fade-in px-4" style={{ animationDelay: '0.5s' }}>
              Where digital hearts find their rhythm, and love stories are written in the language of connection.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 text-slate-600 dark:text-slate-300 animate-fade-in px-4" style={{ animationDelay: '1s' }}>
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
              <span className="text-base sm:text-lg italic text-center">A sanctuary for meaningful connections</span>
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-pink-400" />
            </div>
          </div>

                    {/* Features Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8 lg:mb-12 animate-fade-in px-2 sm:px-4" style={{ animationDelay: '1.5s' }}>
            <Button
              onClick={() => handleFeatureClick('solo')}
              className="text-center p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl bg-white/20 dark:bg-slate-800/20 backdrop-blur-sm border border-slate-200/30 dark:border-slate-700/30 hover:bg-white/30 dark:hover:bg-slate-800/30 transition-all duration-300 transform hover:scale-105 h-auto flex flex-col items-center justify-center group"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 lg:mb-4">
                <Heart className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-white" />
              </div>
              <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-slate-800 dark:text-slate-200 mb-1 sm:mb-2">Solo Journey</h3>
              <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm mb-2 sm:mb-3">Discover yourself through <br/>introspection and self-reflection</p>
              <div className="flex items-center gap-1 text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="text-xs sm:text-sm font-medium">Explore</span>
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </div>
            </Button>
            
            <Button
              onClick={() => handleFeatureClick('multiplayer')}
              className="text-center p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl bg-white/20 dark:bg-slate-800/20 backdrop-blur-sm border border-slate-200/30 dark:border-slate-700/30 hover:bg-white/30 dark:hover:bg-slate-800/30 transition-all duration-300 transform hover:scale-105 h-auto flex flex-col items-center justify-center group"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 lg:mb-4">
                <Star className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-white" />
              </div>
              <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-slate-800 dark:text-slate-200 mb-1 sm:mb-2">Find Your Match</h3>
              <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm mb-2 sm:mb-3">Connect with real people <br/>seeking genuine relationships</p>
              <div className="flex items-center gap-1 text-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="text-xs sm:text-sm font-medium">Connect</span>
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </div>
            </Button>
            
            <Button
              onClick={() => handleFeatureClick('ai-companion')}
              className="text-center p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl bg-white/20 dark:bg-slate-800/20 backdrop-blur-sm border border-slate-200/30 dark:border-slate-700/30 hover:bg-white/30 dark:hover:bg-slate-800/30 transition-all duration-300 transform hover:scale-105 h-auto flex flex-col items-center justify-center group"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 lg:mb-4">
                <Music className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-white" />
              </div>
              <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-slate-800 dark:text-slate-200 mb-1 sm:mb-2">AI Companion</h3>
              <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm mb-2 sm:mb-3">Experience intelligent companionship <br/> that grows with you</p>
              <div className="flex items-center gap-1 text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="text-xs sm:text-sm font-medium">Chat</span>
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </div>
            </Button>
          </div>

                    {/* Call to Action */}
          <div className="animate-fade-in px-4" style={{ animationDelay: '2s' }}>
            <Button
              onClick={handleGetStarted}
              className="group bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white text-lg sm:text-xl font-semibold py-4 sm:py-6 px-8 sm:px-12 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl border-0 w-full sm:w-auto"
            >
              <span className="flex items-center gap-2 sm:gap-3">
                {user ? 'Continue Your Journey' : 'Start Your Adventure'}
                <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
            </Button>
            
            {user && (
              <p className="text-slate-600 dark:text-slate-300 mt-4 text-sm text-center">
                Welcome back, {user.username}! Ready to continue your journey?
              </p>
            )}
            
            {!user && (
              <p className="text-slate-600 dark:text-slate-300 mt-4 text-sm text-center">
                Choose a feature above or start your adventure to get registered
              </p>
            )}
          </div>

          {/* Inspirational Quote */}
          <div className="mt-12 sm:mt-16 text-center animate-fade-in px-4" style={{ animationDelay: '2.5s' }}>
            <div className="inline-block p-4 sm:p-6 rounded-2xl bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm border border-slate-200/40 dark:border-slate-700/40">
              <p className="text-slate-700 dark:text-slate-200 text-base sm:text-lg italic leading-relaxed">
                "In the symphony of life, every heart has its own melody. 
                <br />
                Here, we compose love stories that resonate with the soul."
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
