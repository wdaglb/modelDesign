import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { HelmetProvider } from 'react-helmet-async';

const rootEl = document.getElementById('root');
if (rootEl) {
  const root = ReactDOM.createRoot(rootEl);
  root.render(
    // <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>,
    // </React.StrictMode>,
  );
}
