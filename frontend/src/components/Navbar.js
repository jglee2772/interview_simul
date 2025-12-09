import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Navbar.css';

// 스타일은 각 페이지의 CSS(Home.css, Interview.css 등)에서 공통으로 정의된 .navbar 클래스를 사용하거나,
// 별도의 Navbar.css를 만들어서 import 할 수도 있습니다. 
// 현재 구조상 각 페이지 CSS에 navbar 스타일이 있으므로 별도 import는 생략 가능하지만, 
// 만약 스타일이 적용되지 않는다면 './Navbar.css'를 만들고 import 해야 합니다.

const Navbar = () => {
  const navigate = useNavigate();

  // 네비게이션 핸들러 함수들
  const handleNavigateHome = () => {
    navigate('/');
  };

  const handleNavigateToAssessment = () => {
    navigate('/assessment');
  };

  const handleNavigateToInterview = () => {
    navigate('/interview');
  };

  const handleNavigateToResume = () => {
    navigate('/resume');
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        {/* 로고 클릭 시 홈으로 이동 */}
        <div className="nav-logo" onClick={handleNavigateHome}>
          Interview Master
        </div>
        
        {/* 메뉴 링크들 */}
        <div className="nav-links">
          <div className="nav-item" onClick={handleNavigateToAssessment}>
            인적성 검사
          </div>
          <div className="nav-item" onClick={handleNavigateToInterview}>
            면접 연습
          </div>
          <div className="nav-item" onClick={handleNavigateToResume}>
            이력서
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;