import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { I18nProvider } from './utils/I18nContext.jsx'
import './utils/extensionRegistry.js'

// Check if we're rendering inside the WordPress admin page div
const rootElement = document.getElementById('qoracrm-root');

// Global Error Handler for sending JS errors to backend log
window.onerror = function (msg, url, lineNo, columnNo, error) {
  if (window.qoraCrmData?.apiUrl && window.qoraCrmData?.nonce) {
    const errorMsg = `${msg} \nURL: ${url} \nLine: ${lineNo} \nColumn: ${columnNo} \nStack: ${error?.stack || ''}`;
    fetch(`${window.qoraCrmData.apiUrl}support/log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-WP-Nonce': window.qoraCrmData.nonce
      },
      body: JSON.stringify({ message: errorMsg, level: 'error' })
    }).catch(() => {}); // ignore fetch errors here
  }
  return false;
};

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <I18nProvider>
        <App />
      </I18nProvider>
    </React.StrictMode>,
  )
}
