import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RotateCcw, Zap, Heart, Sparkles, Target, Crown } from 'lucide-react';

interface TruthOrDareItem {
  id: number;
  type: 'truth' | 'dare';
  content: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}

const TruthOrDareSpinner: React.FC = () => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentResult, setCurrentResult] = useState<TruthOrDareItem | null>(null);
  const [spinHistory, setSpinHistory] = useState<TruthOrDareItem[]>([]);
  const [spinCount, setSpinCount] = useState(0);
  const spinnerRef = useRef<HTMLDivElement>(null);

  // Truth or Dare database
  const truthOrDareItems: TruthOrDareItem[] = [
    // Truths - Easy
    { id: 1, type: 'truth', content: "What's your biggest fear?", difficulty: 'easy', category: 'personal' },
    { id: 2, type: 'truth', content: "What's your favorite color and why?", difficulty: 'easy', category: 'preferences' },
    { id: 3, type: 'truth', content: "What's the last thing you searched on your phone?", difficulty: 'easy', category: 'personal' },
    { id: 4, type: 'truth', content: "What's your dream job?", difficulty: 'easy', category: 'career' },
    { id: 5, type: 'truth', content: "What's your favorite food?", difficulty: 'easy', category: 'preferences' },
    
    // Truths - Medium
    { id: 6, type: 'truth', content: "What's the most embarrassing thing that happened to you in school?", difficulty: 'medium', category: 'personal' },
    { id: 7, type: 'truth', content: "What's your biggest regret?", difficulty: 'medium', category: 'personal' },
    { id: 8, type: 'truth', content: "What's the most money you've ever spent on something?", difficulty: 'medium', category: 'personal' },
    { id: 9, type: 'truth', content: "What's your biggest insecurity?", difficulty: 'medium', category: 'personal' },
    { id: 10, type: 'truth', content: "What's the worst lie you've ever told?", difficulty: 'medium', category: 'personal' },
    
    // Truths - Hard
    { id: 11, type: 'truth', content: "What's the most embarrassing thing in your search history?", difficulty: 'hard', category: 'personal' },
    { id: 12, type: 'truth', content: "What's your biggest secret that no one knows?", difficulty: 'hard', category: 'personal' },
    { id: 13, type: 'truth', content: "What's the most embarrassing thing you've done while drunk?", difficulty: 'hard', category: 'personal' },
    { id: 14, type: 'truth', content: "What's your biggest fantasy?", difficulty: 'hard', category: 'personal' },
    { id: 15, type: 'truth', content: "What's the most embarrassing thing you've done in public?", difficulty: 'hard', category: 'personal' },
    
    // Dares - Easy
    { id: 16, type: 'dare', content: "Send a selfie to your best friend", difficulty: 'easy', category: 'social' },
    { id: 17, type: 'dare', content: "Call someone and sing happy birthday", difficulty: 'easy', category: 'social' },
    { id: 18, type: 'dare', content: "Dance to a song for 30 seconds", difficulty: 'easy', category: 'fun' },
    { id: 19, type: 'dare', content: "Make a funny face and take a selfie", difficulty: 'easy', category: 'fun' },
    { id: 20, type: 'dare', content: "Tell a joke to someone", difficulty: 'easy', category: 'social' },
    
    // Dares - Medium
    { id: 21, type: 'dare', content: "Call a friend and tell them you love them", difficulty: 'medium', category: 'social' },
    { id: 22, type: 'dare', content: "Post something embarrassing on your social media for 1 hour", difficulty: 'medium', category: 'social' },
    { id: 23, type: 'dare', content: "Wear your clothes backwards for 10 minutes", difficulty: 'medium', category: 'fun' },
    { id: 24, type: 'dare', content: "Speak in a different accent for the next 5 minutes", difficulty: 'medium', category: 'fun' },
    { id: 25, type: 'dare', content: "Call someone and pretend to be a telemarketer", difficulty: 'medium', category: 'social' },
    
    // Dares - Hard
    { id: 26, type: 'dare', content: "Call your crush and confess your feelings", difficulty: 'hard', category: 'romantic' },
    { id: 27, type: 'dare', content: "Post a video of yourself singing on social media", difficulty: 'hard', category: 'social' },
    { id: 28, type: 'dare', content: "Call your ex and apologize for something", difficulty: 'hard', category: 'romantic' },
    { id: 29, type: 'dare', content: "Ask someone out on a date", difficulty: 'hard', category: 'romantic' },
    { id: 30, type: 'dare', content: "Propose to someone (jokingly)", difficulty: 'hard', category: 'romantic' },
    
    // Romantic Truths
    { id: 31, type: 'truth', content: "What's your ideal first date?", difficulty: 'medium', category: 'romantic' },
    { id: 32, type: 'truth', content: "What's your biggest turn-on?", difficulty: 'hard', category: 'romantic' },
    { id: 33, type: 'truth', content: "What's your biggest turn-off?", difficulty: 'medium', category: 'romantic' },
    { id: 34, type: 'truth', content: "What's your love language?", difficulty: 'easy', category: 'romantic' },
    { id: 35, type: 'truth', content: "What's your biggest relationship fear?", difficulty: 'medium', category: 'romantic' },
    
    // Romantic Dares
    { id: 36, type: 'dare', content: "Send a flirty text to someone you like", difficulty: 'medium', category: 'romantic' },
    { id: 37, type: 'dare', content: "Write a love letter to yourself", difficulty: 'easy', category: 'romantic' },
    { id: 38, type: 'dare', content: "Practice your pick-up line on a mirror", difficulty: 'easy', category: 'romantic' },
    { id: 39, type: 'dare', content: "Plan your dream wedding in 2 minutes", difficulty: 'medium', category: 'romantic' },
    { id: 40, type: 'dare', content: "Describe your perfect partner in detail", difficulty: 'medium', category: 'romantic' }
  ];

  const spinWheel = () => {
    if (isSpinning) return;
    
    setIsSpinning(true);
    setCurrentResult(null);
    
    // Add spinning animation
    if (spinnerRef.current) {
      spinnerRef.current.style.transform = 'rotate(3600deg)';
      spinnerRef.current.style.transition = 'transform 3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    }
    
    // Random selection with weighted difficulty
    const random = Math.random();
    let selectedDifficulty: 'easy' | 'medium' | 'hard';
    
    if (random < 0.5) {
      selectedDifficulty = 'easy';
    } else if (random < 0.8) {
      selectedDifficulty = 'medium';
    } else {
      selectedDifficulty = 'hard';
    }
    
    const filteredItems = truthOrDareItems.filter(item => item.difficulty === selectedDifficulty);
    const randomItem = filteredItems[Math.floor(Math.random() * filteredItems.length)];
    
    // Simulate spinning time
    setTimeout(() => {
      setCurrentResult(randomItem);
      setSpinHistory(prev => [randomItem, ...prev.slice(0, 4)]); // Keep last 5
      setSpinCount(prev => prev + 1);
      setIsSpinning(false);
      
      // Reset spinner
      if (spinnerRef.current) {
        spinnerRef.current.style.transform = 'rotate(0deg)';
        spinnerRef.current.style.transition = 'none';
      }
    }, 3000);
  };

  const resetSpinner = () => {
    setCurrentResult(null);
    setSpinHistory([]);
    setSpinCount(0);
    if (spinnerRef.current) {
      spinnerRef.current.style.transform = 'rotate(0deg)';
      spinnerRef.current.style.transition = 'none';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'truth' ? <Heart className="h-4 w-4" /> : <Zap className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Spinner Section */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 border-2 border-purple-200/50">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl font-bold text-purple-800 dark:text-purple-200">
            <Crown className="h-6 w-6" />
            Truth or Dare Gacha Spinner
            <Crown className="h-6 w-6" />
          </CardTitle>
          <p className="text-muted-foreground">Spin the wheel and discover your fate!</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Spinner Wheel */}
          <div className="flex justify-center">
            <div className="relative">
              <div
                ref={spinnerRef}
                className="w-64 h-64 rounded-full border-8 border-purple-300 bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center shadow-2xl"
              >
                <div className="w-48 h-48 rounded-full bg-white flex items-center justify-center shadow-inner">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🎯</div>
                    <div className="text-sm font-medium text-gray-600">Spin to Win!</div>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-purple-600"></div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-4">
            <Button
              onClick={spinWheel}
              disabled={isSpinning}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3 text-lg font-semibold"
            >
              {isSpinning ? (
                <>
                  <div className="animate-spin mr-2">🎰</div>
                  Spinning...
                </>
              ) : (
                <>
                  <Target className="mr-2 h-5 w-5" />
                  Spin the Wheel!
                </>
              )}
            </Button>
            <Button
              onClick={resetSpinner}
              variant="outline"
              className="border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>

          {/* Stats */}
          <div className="flex justify-center">
            <Badge variant="secondary" className="text-sm">
              Spins: {spinCount} | History: {spinHistory.length}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Result Section */}
      {currentResult && (
        <Card className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/50 dark:to-pink-950/50 border-2 border-rose-200/50 animate-fade-in">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-xl font-bold">
              {getTypeIcon(currentResult.type)}
              {currentResult.type.toUpperCase()} - {currentResult.difficulty.toUpperCase()}
              {getTypeIcon(currentResult.type)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="text-lg font-medium text-gray-800 dark:text-gray-200 p-4 bg-white/50 rounded-lg">
              "{currentResult.content}"
            </div>
            <div className="flex justify-center gap-2">
              <Badge className={getDifficultyColor(currentResult.difficulty)}>
                {currentResult.difficulty}
              </Badge>
              <Badge variant="outline" className="border-purple-300 text-purple-700">
                {currentResult.category}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              <Sparkles className="inline h-4 w-4 mr-1" />
              Challenge accepted! Time to step up your game!
            </div>
          </CardContent>
        </Card>
      )}

      {/* History Section */}
      {spinHistory.length > 0 && (
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50 border-2 border-indigo-200/50">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-indigo-800 dark:text-indigo-200">
              Recent Spins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {spinHistory.map((item, index) => (
                <div
                  key={`${item.id}-${index}`}
                  className="flex items-center justify-between p-3 bg-white/50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    {getTypeIcon(item.type)}
                    <span className="font-medium">{item.content}</span>
                  </div>
                  <Badge className={getDifficultyColor(item.difficulty)}>
                    {item.difficulty}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TruthOrDareSpinner;