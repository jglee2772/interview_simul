/**
 * 페이지: 메인 홈페이지
 * 역할: 홈페이지 UI 컴포넌트 작성
 * 설명: 
 * - 메인 홈페이지의 레이아웃과 구조를 작성합니다
 * - 면접 시뮬레이션, 인적성검사, 이력서 작성으로 이동할 수 있는 링크를 배치합니다
 * - React 컴포넌트로 작성하며, CSS 파일로 스타일링합니다
 */

import React from 'react';
import './Home.css';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home">
      <div className="home-container">
        <div className="home-header">
          <h2>면접 시뮬레이션 메인 페이지</h2>
        </div>

        <div className="card-grid">
          <div className="card" onClick={() => navigate('/info')}>
            <div className="card-icon"></div>
            <span className="card-title">기본정보</span>
          </div>

          <div className="card" onClick={() => navigate('/interview')}>
            <div className="card-icon"></div>
            <span className="card-title">면접 시뮬레이션 가기</span>
          </div>

          <div className="card" onClick={() => navigate('/assessment')}>
            <div className="card-icon"></div>
            <span className="card-title">인적성검사 가기</span>
          </div>
        </div>

        <div className="bottom-section">
          <div className="resume-card" onClick={() => navigate('/resume')}>
            <div className="card-icon"></div>
            <h3>이력서 작성해보기</h3>
          </div>

          <div className="job-section">
            <h3>구인사이트</h3>
            <p>추천 채용 사이트나 링크를 여기에 배치할 수 있습니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;