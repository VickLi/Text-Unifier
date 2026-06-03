import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// 全局错误捕获（调试用）
window.onerror = (msg, source, line, col, error) => {
  console.error('[GLOBAL ERROR]', msg, source, line, col, error);
  document.body.innerHTML = `<pre style="color:red;padding:20px;font-size:14px">
    <b>运行时错误：</b>${msg}
    ${error?.stack ? `\n\n${error.stack}` : ''}
  </pre>`;
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
