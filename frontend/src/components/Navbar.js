/**
 * 파일: Navbar.js
 * 역할: 네비게이션 바 컴포넌트 작성
 * 설명:
 * - 상단 네비게이션 바 UI를 작성합니다
 * - 5개 페이지로 이동할 수 있는 링크를 배치합니다
 * - React Router의 Link 컴포넌트를 사용합니다
 * - 재사용 가능한 컴포넌트로 작성합니다
 */

import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* 상단바 (햄버거 버튼만 표시) */}
      <div className="topbar">
        <button className="menu-btn" onClick={toggleMenu}>
          ☰
        </button>
        <span className="topbar-title">면접 시뮬레이션</span>
      </div>

      {/* 사이드 오버레이 메뉴 */}
      <div className={`overlay ${isOpen ? "open" : ""}`}>
        <div className="overlay-content">
          <Link
            to="/"
            className={`overlay-link ${
              location.pathname === "/" ? "active" : ""
            }`}
            onClick={toggleMenu}
          >
            홈
          </Link>
          <Link
            to="/interview"
            className={`overlay-link ${
              location.pathname === "/interview" ? "active" : ""
            }`}
            onClick={toggleMenu}
          >
            면접 시뮬레이션
          </Link>
          <Link
            to="/assessment"
            className={`overlay-link ${
              location.pathname === "/assessment" ? "active" : ""
            }`}
            onClick={toggleMenu}
          >
            인적성검사
          </Link>
          <Link
            to="/resume"
            className={`overlay-link ${
              location.pathname === "/resume" ? "active" : ""
            }`}
            onClick={toggleMenu}
          >
            이력서 작성
          </Link>
        </div>
      </div>

      {/* 오버레이 열렸을 때 배경 클릭 시 닫힘 */}
      {isOpen && <div className="overlay-bg" onClick={toggleMenu}></div>}
    </>
  );
};

export default Navbar;