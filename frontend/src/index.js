/**
 * 파일: index.js
 * 역할: React 앱 진입점
 * 설명:
 * - React 앱의 진입점입니다
 * - ReactDOM을 사용하여 App 컴포넌트를 root에 렌더링합니다
 * - 전역 스타일을 import합니다
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
