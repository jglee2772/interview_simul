/**
 * 파일: Navbar.js
 * 역할: 네비게이션 바 컴포넌트 작성
 * 설명:
 * - 상단 네비게이션 바 UI를 작성합니다
 * - 5개 페이지로 이동할 수 있는 링크를 배치합니다
 * - React Router의 Link 컴포넌트를 사용합니다
 * - 재사용 가능한 컴포넌트로 작성합니다
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();

 return (
    <div className="navbar"> {/* 기존 nav → div로 변경 (CSS 매칭 명확하게) */}
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          면접 시뮬레이션
        </Link>
        <ul className="navbar-menu">
          <li className={location.pathname === '/' ? 'active' : ''}>
            <Link to="/" className="navbar-link">홈</Link>
          </li>
          <li className={location.pathname === '/interview' ? 'active' : ''}>
            <Link to="/interview" className="navbar-link">면접 시뮬레이션</Link>
          </li>
          <li className={location.pathname === '/assessment' ? 'active' : ''}>
            <Link to="/assessment" className="navbar-link">인적성검사</Link>
          </li>
          <li className={location.pathname === '/resume' ? 'active' : ''}>
            <Link to="/resume" className="navbar-link">이력서 작성</Link>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Navbar;