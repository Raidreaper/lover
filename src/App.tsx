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

const App = () => {
  console.log('App component rendering...');
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
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
};

export default App;
