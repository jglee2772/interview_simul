/**
 * 파일: App.js
 * 역할: 메인 앱 컴포넌트 및 라우팅 설정
 * 설명:
 * - React Router를 사용하여 페이지 라우팅을 설정합니다
 * - 5개 페이지의 경로를 정의합니다:
 *   1. / - 메인 홈페이지
 *   2. /interview - 면접 시뮬레이션 페이지
 *   3. /assessment - 인적성검사 페이지
 *   4. /assessment-result/:id - 인적성검사 결과 페이지
 *   5. /resume - 이력서 작성 페이지
 * - 공통 컴포넌트(예: Navbar)를 배치합니다
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Interview from './pages/Interview';
import Assessment from './pages/Assessment';
import AssessmentResult from './pages/AssessmentResult';
import Resume from './pages/Resume';

function App() {
  return (
    <Router>
      {/* Navbar를 Router 바로 아래로 이동 - App div 밖으로 */}
      <Navbar />
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/interview" element={<Interview />} />
          <Route path="/assessment" element={<Assessment />} />
          <Route path="/assessment-result/:id" element={<AssessmentResult />} />
          <Route path="/resume" element={<Resume />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
