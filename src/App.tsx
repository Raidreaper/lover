import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import SoloPage from "./pages/SoloPage";
import MultiplayerPage from "./pages/MultiplayerPage";
import AICompanionPage from "./pages/AICompanionPage";
import AICompanionOnboarding from "./pages/AICompanionOnboarding";
import UserOnboarding from "./pages/UserOnboarding";
import ConversationHistory from "./pages/ConversationHistory";
import MultiplayerHistory from "./pages/MultiplayerHistory";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Simple test component to debug
const TestComponent = () => {
  console.log('TestComponent rendering...');
  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: 'red', 
      color: 'white', 
      fontSize: '24px',
      textAlign: 'center',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div>
        <h1>🚨 TEST COMPONENT LOADED! 🚨</h1>
        <p>If you can see this, the app is working!</p>
        <p>Check the console for debug logs.</p>
      </div>
    </div>
  );
};

const App = () => {
  console.log('App component rendering...');
  
  try {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<TestComponent />} />
                <Route path="/index" element={<Index />} />
                <Route path="/onboarding" element={<UserOnboarding />} />
                <Route path="/solo" element={<SoloPage />} />
                <Route path="/multiplayer" element={<MultiplayerPage />} />
                <Route path="/ai-companion" element={<AICompanionPage />} />
                <Route path="/ai-companion-onboarding" element={<AICompanionOnboarding />} />
                <Route path="/conversations" element={<ConversationHistory />} />
                <Route path="/multiplayer-history" element={<MultiplayerHistory />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    );
  } catch (error) {
    console.error('Error in App component:', error);
    return (
      <div style={{ 
        padding: '20px', 
        backgroundColor: 'red', 
        color: 'white', 
        fontSize: '18px',
        minHeight: '100vh'
      }}>
        <h1>🚨 ERROR IN APP COMPONENT 🚨</h1>
        <pre>{error?.toString()}</pre>
      </div>
    );
  }
};

export default App;
