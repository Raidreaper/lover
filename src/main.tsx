import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('main.tsx: Starting app...');

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('main.tsx: DOM loaded, initializing React...');
  
  try {
    const rootElement = document.getElementById("root");
    console.log('main.tsx: Root element found:', rootElement);
    
    if (rootElement) {
      const root = createRoot(rootElement);
      console.log('main.tsx: Root created, rendering App...');
      root.render(<App />);
    } else {
      console.error('main.tsx: Root element not found!');
      document.body.innerHTML = '<div style="padding: 20px; background: red; color: white;">ERROR: Root element not found!</div>';
    }
  } catch (error) {
    console.error('main.tsx: Error rendering app:', error);
    document.body.innerHTML = `<div style="padding: 20px; background: red; color: white;">ERROR: ${error?.toString()}</div>`;
  }
});

// Fallback if DOMContentLoaded doesn't fire
setTimeout(() => {
  if (!document.getElementById("root")?.hasChildNodes()) {
    console.log('main.tsx: Fallback initialization...');
    try {
      const rootElement = document.getElementById("root");
      if (rootElement) {
        const root = createRoot(rootElement);
        root.render(<App />);
      }
    } catch (error) {
      console.error('main.tsx: Fallback error:', error);
    }
  }
}, 100);
