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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Error boundary component
const ErrorFallback = ({ error }: { error: Error }) => {
  console.error('App Error:', error);
  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#fee2e2', 
      color: '#dc2626', 
      fontSize: '16px',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column'
    }}>
      <h1>🚨 Something went wrong</h1>
      <p>Please refresh the page or try again later.</p>
      <details style={{ marginTop: '20px' }}>
        <summary>Error Details</summary>
        <pre style={{ marginTop: '10px', fontSize: '12px' }}>{error.toString()}</pre>
      </details>
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
  } catch (error) {
    console.error('Error in App component:', error);
    return <ErrorFallback error={error as Error} />;
  }
};

export default App;
