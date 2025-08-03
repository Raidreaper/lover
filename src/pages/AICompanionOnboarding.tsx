import React, { useState } from "react";
import { ArrowLeft, Sparkles, Heart, Bot, User, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface CompanionConfig {
  name: string;
  personality: string;
  identity: string;
  gender: string;
  role: string;
}

const AICompanionOnboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<CompanionConfig>({
    name: "",
    personality: "",
    identity: "",
    gender: "",
    role: ""
  });

  const handleInputChange = (field: keyof CompanionConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleComplete = () => {
    localStorage.setItem('aiCompanionConfig', JSON.stringify(config));
    navigate('/ai-companion');
  };

  const isStepValid = () => {
    switch (step) {
      case 1: return config.name.trim().length > 0;
      case 2: return config.personality.trim().length > 0;
      case 3: return config.identity.trim().length > 0 && config.gender;
      case 4: return config.role.trim().length > 0;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 dark:from-pink-950 dark:via-rose-950 dark:to-purple-950">
      <div className="relative z-10 min-h-screen flex flex-col">
        <header className="p-6 border-b border-pink-200/30 bg-white/50 dark:bg-black/20 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="text-pink-600 hover:text-pink-700 hover:bg-pink-100/50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-display font-bold text-pink-800 dark:text-pink-200">
                Create Your AI Companion
              </h1>
              <Badge variant="secondary" className="bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300">
                Step {step} of 4
              </Badge>
            </div>
          </div>
        </header>

        <div className="px-6 py-4">
          <div className="w-full bg-pink-200/30 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-pink-500 to-rose-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(step / 4) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="w-full max-w-2xl border-pink-200/50 bg-white/80 dark:bg-black/40 backdrop-blur-sm">
            <CardContent className="p-8">
              {step === 1 && (
                <div className="space-y-6">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full flex items-center justify-center mx-auto">
                      <Bot className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-display font-bold text-pink-800 dark:text-pink-200">
                      What should I call your companion?
                    </h2>
                    <p className="text-muted-foreground">
                      Choose a name that feels right for your AI companion.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <Label htmlFor="name" className="text-pink-700 dark:text-pink-300">
                      Companion Name
                    </Label>
                    <Input
                      id="name"
                      value={config.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="e.g., Luna, Atlas, Nova, Phoenix..."
                      className="border-pink-200 focus:border-pink-400"
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center mx-auto">
                      <Sparkles className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-display font-bold text-pink-800 dark:text-pink-200">
                      What's their personality like?
                    </h2>
                    <p className="text-muted-foreground">
                      Describe how your companion should behave and interact with you.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <Label htmlFor="personality" className="text-pink-700 dark:text-pink-300">
                      Personality Description
                    </Label>
                    <Textarea
                      id="personality"
                      value={config.personality}
                      onChange={(e) => handleInputChange('personality', e.target.value)}
                      placeholder="Describe their personality, communication style, and how they should interact with you. For example: 'Warm, empathetic, and encouraging. Loves to ask thoughtful questions and share positive energy. Communicates with enthusiasm and genuine interest in my well-being.'"
                      className="border-pink-200 focus:border-pink-400 min-h-32"
                    />
                    <div className="text-sm text-muted-foreground">
                      <p className="mb-2"><strong>Tips for better responses:</strong></p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>Be specific about communication style (warm, playful, intellectual, etc.)</li>
                        <li>Include emotional characteristics (empathetic, encouraging, supportive)</li>
                        <li>Mention how they should react to different situations</li>
                        <li>Describe their energy level and enthusiasm</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-rose-400 to-purple-500 rounded-full flex items-center justify-center mx-auto">
                      <User className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-display font-bold text-pink-800 dark:text-pink-200">
                      Tell me about their identity
                    </h2>
                    <p className="text-muted-foreground">
                      Help shape who your companion is as a person.
                    </p>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <Label htmlFor="identity" className="text-pink-700 dark:text-pink-300">
                        Background & Identity
                      </Label>
                      <Textarea
                        id="identity"
                        value={config.identity}
                        onChange={(e) => handleInputChange('identity', e.target.value)}
                        placeholder="Describe their background, interests, experiences, and what makes them unique. For example: 'A creative soul who loves art, music, and deep conversations. Has traveled extensively and enjoys learning about different cultures. Passionate about helping others discover their potential.'"
                        className="border-pink-200 focus:border-pink-400 min-h-32"
                      />
                      <div className="text-sm text-muted-foreground">
                        <p className="mb-2"><strong>Make them interesting:</strong></p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                          <li>Include hobbies, interests, or passions</li>
                          <li>Add life experiences or background</li>
                          <li>Mention what makes them unique</li>
                          <li>Include values or beliefs they hold</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <Label htmlFor="gender" className="text-pink-700 dark:text-pink-300">
                        Gender Identity
                      </Label>
                      <Select value={config.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                        <SelectTrigger className="border-pink-200 focus:border-pink-400">
                          <SelectValue placeholder="Select gender identity" />
                        </SelectTrigger>
                        <SelectContent>
                          {["Female", "Male", "Non-binary", "Gender fluid", "Prefer not to specify"].map((gender) => (
                            <SelectItem key={gender} value={gender}>
                              {gender}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center mx-auto">
                      <Heart className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-display font-bold text-pink-800 dark:text-pink-200">
                      What role will they play in your life?
                    </h2>
                    <p className="text-muted-foreground">
                      Define how your companion should support and interact with you.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <Label htmlFor="role" className="text-pink-700 dark:text-pink-300">
                      Companion Role
                    </Label>
                    <Textarea
                      id="role"
                      value={config.role}
                      onChange={(e) => handleInputChange('role', e.target.value)}
                      placeholder="Describe the role they should play in your life. For example: 'A supportive friend who encourages me to pursue my dreams, celebrates my successes, and helps me through challenges. Someone who asks thought-provoking questions and helps me grow as a person.'"
                      className="border-pink-200 focus:border-pink-400 min-h-32"
                    />
                    <div className="text-sm text-muted-foreground">
                      <p className="mb-2"><strong>Define their purpose:</strong></p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>How should they support you emotionally?</li>
                        <li>What kind of advice or guidance should they offer?</li>
                        <li>How should they help you grow or improve?</li>
                        <li>What role do they play in your daily life?</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="p-6 border-t border-pink-200/30 bg-white/50 dark:bg-black/20 backdrop-blur-sm">
          <div className="flex justify-between items-center max-w-2xl mx-auto">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 1}
              className="border-pink-200 text-pink-700 hover:bg-pink-100"
            >
              Back
            </Button>
            
            <div className="flex gap-2">
              {step === 4 ? (
                <Button
                  onClick={handleComplete}
                  disabled={!isStepValid()}
                  className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Create Companion
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={!isStepValid()}
                  className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white"
                >
                  Next
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AICompanionOnboarding; 