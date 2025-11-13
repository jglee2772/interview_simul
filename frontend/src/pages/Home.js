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
  const tips = [
  "회사와 직무에 대해 최소한의 정보는 알고 가야 해요!",
  "단정한 복장, 자신감 있는 인사, 밝은 표정이 중요해요!",
  "질문에 바로 핵심을 전달하고 장황하지 않게 답변해야 해요!",
  "면접관의 질문이 무엇을 알고 싶어 하는지 이해 후 답변하세요!",
  "모르는 질문이 나오면 솔직히 말하고, 유연하게 대응하세요!",
  "회사에 대해 궁금한 점 한두 개 정도 미리 준비하면 좋아요!",
  "긴장해도 괜찮아요, 당신의 진짜 모습이 가장 큰 강점입니다!",
  "한 걸음씩 준비한 만큼 자신감 있게 보여주세요, 잘할 수 있습니다!"
  ];

  return (
    <div className="home">
      <div className="home-container">
        <div className="home-header">
          <div className="tip-slider-container">
            <div className="tip-slider">
              {[...tips, ...tips].map((tip, index) => (
                <span key={index} className="tip-item">{tip}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="card-grid">
          <div className="card-info">
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
          {/* ✅ 이력서 작성해보기 카드 (이미지 추가) */}
          <div className="resume-card" onClick={() => navigate('/resume')}>
            <img
              src="https://i.pinimg.com/736x/c3/ec/da/c3ecda8195eb14dd0c201bbc52b49549.jpg"
              alt="이력서 아이콘"
              className="resume-icon"
            />
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
