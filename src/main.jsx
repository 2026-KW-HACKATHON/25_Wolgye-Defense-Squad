import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {new URLSearchParams(window.location.search).has('legacy') ? <App /> : (
      <iframe
        src={`${import.meta.env.BASE_URL}midterm-demo.html`}
        title="월계밥상 중간발표 데모"
        style={{ width: '100%', height: '100dvh', border: 0, display: 'block' }}
      />
    )}
  </React.StrictMode>,
);
