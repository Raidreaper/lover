// Environment configuration
export const config = {
  // API Configuration
  api: {
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000',
    timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '15000'),
    retries: parseInt(import.meta.env.VITE_API_RETRIES || '3'),
  },
  
  // Socket Configuration
  socket: {
    url: import.meta.env.VITE_SOCKET_URL || 'ws://localhost:4000',
    reconnectAttempts: parseInt(import.meta.env.VITE_SOCKET_RECONNECT_ATTEMPTS || '5'),
    reconnectDelay: parseInt(import.meta.env.VITE_SOCKET_RECONNECT_DELAY || '1000'),
  },
  
  // Feature Flags
  features: {
    aiCompanion: import.meta.env.VITE_ENABLE_AI_COMPANION !== 'false',
    multiplayer: import.meta.env.VITE_ENABLE_MULTIPLAYER !== 'false',
    analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    debug: import.meta.env.VITE_DEBUG === 'true',
  },
  
  // App Configuration
  app: {
    name: import.meta.env.VITE_APP_NAME || "Lover's Code",
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    environment: import.meta.env.MODE || 'development',
  },
  
  // Performance Configuration
  performance: {
    renderThreshold: parseInt(import.meta.env.VITE_RENDER_THRESHOLD || '16'),
    logPerformance: import.meta.env.VITE_LOG_PERFORMANCE === 'true',
  }
};

// Validate required environment variables
export const validateEnvironment = () => {
  const required = [
    'VITE_API_BASE_URL'
  ];
  
  const missing = required.filter(key => !import.meta.env[key]);
  
  if (missing.length > 0 && config.app.environment === 'production') {
    console.error('Missing required environment variables:', missing);
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  return true;
};

export default config;
