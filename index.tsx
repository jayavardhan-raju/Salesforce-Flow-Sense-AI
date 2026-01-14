import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Inject Tailwind styles for the web app
const injectStyles = () => {
  if (!document.getElementById('flowsense-tailwind')) {
    const script = document.createElement('script');
    script.id = 'flowsense-tailwind';
    script.src = "https://cdn.tailwindcss.com";
    script.onload = () => {
      // @ts-ignore
      if (window.tailwind) {
        // @ts-ignore
        window.tailwind.config = {
          darkMode: 'class',
          theme: {
            extend: {
              colors: {
                sf: {
                  blue: '#0176D3',
                  dark: '#014486',
                  light: '#E0F5FF',
                  text: '#032D60'
                }
              },
              fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
              }
            }
          }
        }
      }
    };
    document.head.appendChild(script);
  }
};

injectStyles();

const rootElement = document.getElementById('root') || document.body.appendChild(document.createElement('div'));
rootElement.id = 'root';
// Ensure root takes full viewport in web app mode
rootElement.style.height = '100vh';
rootElement.style.width = '100vw';
rootElement.style.margin = '0';
rootElement.style.overflow = 'hidden';

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);