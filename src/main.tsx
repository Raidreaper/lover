import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('main.tsx: Starting app...');

try {
  const rootElement = document.getElementById("root");
  console.log('main.tsx: Root element found:', rootElement);
  
  if (rootElement) {
    // Test if React is working at all
    rootElement.innerHTML = '<div style="background: red; color: white; padding: 20px;">React is loading...</div>';
    
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
