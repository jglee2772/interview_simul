/**
 * 페이지: 메인 홈페이지
 * 역할: 홈페이지 UI 컴포넌트 작성
 * 설명: 
 * - 메인 홈페이지의 레이아웃과 구조를 작성합니다
 * - 면접 시뮬레이션, 인적성검사, 이력서 작성으로 이동할 수 있는 링크를 배치합니다
 * - React 컴포넌트로 작성하며, CSS 파일로 스타일링합니다
 */

import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="home">
      <div className="home-container">
        <h1>이 페이지는 홈페이지입니다. 그리고 저는 바보입니다.</h1>
        <p>안뇽</p>
      </div>
    </div>
  );
};

export default Home;
