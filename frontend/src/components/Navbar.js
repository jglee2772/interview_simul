import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  const location = useLocation();

  return (
    <div className="sidebar">
      {/* 홈 버튼 */}
      <div className="sidebar-top">
        <Link
          to="/"
          className={`sidebar-link ${location.pathname === "/" ? "active" : ""}`}
        >
          <span className="emoji">🏠</span>
          <span className="label">홈</span>
        </Link>
      </div>

      {/* 나머지 메뉴 */}
      <div className="sidebar-content">
        <Link
          to="/interview"
          className={`sidebar-link ${location.pathname === "/interview" ? "active" : ""}`}
        >
          <span className="emoji">💬</span>
          <span className="label">시뮬레이션</span>
        </Link>

        <Link
          to="/assessment"
          className={`sidebar-link ${location.pathname === "/assessment" ? "active" : ""}`}
        >
          <span className="emoji">📄</span>
          <span className="label">인적성검사</span>
        </Link>

        <Link
          to="/resume"
          className={`sidebar-link ${location.pathname === "/resume" ? "active" : ""}`}
        >
          <span className="emoji">✍️</span>
          <span className="label">이력서 작성</span>
        </Link>
      </div>
    </div>
  );
};

export default Navbar;
