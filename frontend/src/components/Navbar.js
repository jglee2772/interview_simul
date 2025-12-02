import React from "react";
import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
  const location = useLocation();

  // 상단 탭 정보 (두 번째 이미지 기준: 초록색, 주황색, 분홍색)
  const topTabs = [
    { path: "/", label: "메인홈 페이지", color: "green", emoji: "🏠", index: 0 },
    { path: "/interview", label: "면접 시뮬레이션", color: "orange", emoji: "💬", index: 1 },
    { path: "/assessment", label: "인적성 검사", color: "pink", emoji: "📄", index: 2 },
    { path: "/resume", label: "이력서 작성", color: "purple", emoji: "✍️", index: 3 },
  ];

  return (
    <div className="top-tabs-container">
      <div className="top-tabs">
        {topTabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`top-tab ${tab.color} ${isActive ? "active" : ""} tab-index-${tab.index}`}
            >
              <span className="tab-emoji">{tab.emoji}</span>
              <span className="tab-label">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Navbar;
