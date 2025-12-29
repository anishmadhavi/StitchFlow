/**
 * index.tsx
 * Purpose: Application Entry Point.
 * Description: Mounts the React application to the DOM.
 * Compatibility: Standard React DOM entry, compatible with any web host (Cloudflare Pages, Vercel, Netlify).
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);