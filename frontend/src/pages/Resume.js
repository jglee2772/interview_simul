/**
 * 페이지: 이력서 작성 페이지
 * 역할: 이력서 작성 폼 UI 및 로직 작성
 * 설명:
 * - 이력서 작성 폼을 제공합니다
 * - 개인정보, 학력, 경력, 자격증, 자기소개서 등을 입력받습니다
 * - JavaScript에서 Axios(resumeAPI.js)를 사용하여 API를 호출하고 백엔드에 저장합니다
 * - React 컴포넌트와 폼 상태 관리 로직을 작성합니다
 */

import React, { useState } from 'react';
import resumeAPI from '../services/resumeAPI';
import './Resume.css';

const Resume = () => {
  // 상태 관리 로직 작성
  // 예: 이력서 데이터, 폼 상태 등

  // 폼 입력 핸들러 작성
  const handleInputChange = (e) => {
    // 입력값 변경 처리 로직 작성
  };

  // 이력서 저장 함수 작성 (Axios 사용)
  const saveResume = async () => {
    // resumeAPI.saveResume()을 사용하여 API 호출 로직 작성
    // 예: await resumeAPI.saveResume(formData);
  };

  return (
    <div className="resume">
      <div className="resume-container">
        <h1>이 페이지는 이력서 작성 페이지입니다</h1>
      </div>
    </div>
  );
};

export default Resume;

