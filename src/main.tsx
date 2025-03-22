import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { useSettingsStore } from './lib/stores/settingsStore';

// In the browser environment, there's no need to try to connect to MongoDB
// The MongoDB connection code will be handled by the backend/API routes
// or mocked in the browser for development purposes

// Apply the theme from settings store before the app renders
const theme = useSettingsStore.getState().theme;
document.documentElement.classList.add(theme);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
