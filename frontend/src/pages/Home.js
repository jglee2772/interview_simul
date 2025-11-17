/**
 * 페이지: 메인 홈페이지
 * 역할: 홈페이지 UI 컴포넌트 작성
 * 설명: 
 * - 메인 홈페이지의 레이아웃과 구조를 작성합니다
 * - 면접 시뮬레이션, 인적성검사, 이력서 작성으로 이동할 수 있는 링크를 배치합니다
 * - React 컴포넌트로 작성하며, CSS 파일로 스타일링합니다
 */

import React, { useState } from 'react';
import './Home.css';
import { useNavigate } from 'react-router-dom';

const STORAGE_KEY = 'resumeData';
const DATE_FORMAT_ERROR = '올바른 날짜 형식을 입력해주세요.';

const formatPhoneNumber = (value) => {
  const numbers = value.replace(/[^\d]/g, '');
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
};

const formatDate = (value) => {
  const numbers = value.replace(/[^\d]/g, '');
  if (numbers.length <= 4) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 4)}-${numbers.slice(4)}`;
  return `${numbers.slice(0, 4)}-${numbers.slice(4, 6)}-${numbers.slice(6, 8)}`;
};

const isValidDate = (dateString) => {
  if (!dateString || dateString.length !== 10) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false;
  
  const date = new Date(dateString);
  const [year, month, day] = dateString.split('-').map(Number);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
};

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const getToday = () => {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return today;
};

const validateDateRange = (dateString, options = {}) => {
  if (!dateString) return '';
  if (!isValidDate(dateString)) return DATE_FORMAT_ERROR;
  
  const date = new Date(dateString);
  const today = getToday();
  
  if (date > today) return options.futureError || '날짜는 오늘 이전이어야 합니다.';
  if (options.minDate && date < options.minDate) {
    return options.minDateError || '날짜가 너무 이전입니다.';
  }
  return '';
};

const validateBirthDate = (dateString) => {
  return validateDateRange(dateString, {
    minDate: new Date('1900-01-01'),
    futureError: '생년월일은 오늘 이전이어야 합니다.',
    minDateError: '생년월일은 1900년 이후여야 합니다.'
  });
};

const Home = () => {
  const navigate = useNavigate();
  const [basicInfo, setBasicInfo] = useState({
    name: '',
    gender: '',
    birthDate: '',
    phone: '',
    email: ''
  });
  const [emailError, setEmailError] = useState('');
  const [birthDateError, setBirthDateError] = useState('');
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'phone') {
      setBasicInfo(prev => ({ ...prev, [name]: formatPhoneNumber(value) }));
    } else if (name === 'birthDate') {
      const formatted = formatDate(value);
      setBasicInfo(prev => ({ ...prev, [name]: formatted }));
      setBirthDateError(validateBirthDate(formatted));
    } else {
      setBasicInfo(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setBasicInfo(prev => ({ ...prev, email: value }));
    setEmailError(value && !validateEmail(value) 
      ? '올바른 이메일 형식을 입력해주세요. (예: example@email.com)' 
      : '');
  };

  const handleNavigateToResume = () => {
    try {
      // 기존 저장된 데이터가 있으면 불러오기
      const existingData = localStorage.getItem(STORAGE_KEY);
      let resumeData = {};
      
      if (existingData) {
        resumeData = JSON.parse(existingData);
      }
      
      // 기본정보를 병합하여 저장
      const updatedData = {
        ...resumeData,
        ...basicInfo,
        // photo는 유지 (기존 데이터가 있으면)
        photo: resumeData.photo || null,
        photoBase64: resumeData.photoBase64 || null
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
      navigate('/resume');
    } catch (error) {
      console.error('데이터 저장 중 오류:', error);
      navigate('/resume');
    }
  };

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
            <div>
              <h3>기본정보</h3>
              <input 
                name="name" 
                type="text" 
                placeholder="이름"
                value={basicInfo.name}
                onChange={handleInputChange}
              />
              <select 
                name="gender" 
                value={basicInfo.gender}
                onChange={handleInputChange}
                className={basicInfo.gender === '' ? 'placeholder' : ''}
              >
                <option value="">성별 선택</option>
                <option value="남자">남자</option>
                <option value="여자">여자</option>
              </select>
              <input 
                name="birthDate" 
                type="text" 
                placeholder="생년월일 ex) 1990-01-01"
                value={basicInfo.birthDate}
                onChange={handleInputChange}
                className={birthDateError ? 'error' : ''}
              />
              {birthDateError && <span className="error-message">{birthDateError}</span>}
              <input 
                name="phone" 
                type="text" 
                placeholder="전화번호"
                value={basicInfo.phone}
                onChange={handleInputChange}
              />
              <input 
                name="email" 
                type="email" 
                placeholder="이메일"
                value={basicInfo.email}
                onChange={handleEmailChange}
                className={emailError ? 'error' : ''}
              />
              {emailError && <span className="error-message">{emailError}</span>}
            </div>
          </div>

          <div className="card" onClick={() => navigate('/interview')}>
            <img
              src="https://search.pstatic.net/common/?src=http%3A%2F%2Fblogfiles.naver.net%2FMjAyMDAyMjZfNTgg%2FMDAxNTgyNzI3MTgzODIz.kAibumvO911S6QYqh4OSpjUKvsCcrXSen4g_6gR2fQwg.nHNIAJWxrU-2cIdtHAWcpKhszRVPfnolRM1Vta5w_Zgg.PNG.kicox1964%2F002.png&type=a340"
              alt="ai 면접 아이콘"
              className="resume-icon"
            />
              <h3>가상 면접 시뮬레이션</h3>
          </div>

          <div className="card" onClick={() => navigate('/assessment')}>
              <img
              src="https://search.pstatic.net/common/?src=http%3A%2F%2Fblogfiles.naver.net%2FMjAyMDEyMjBfNTcg%2FMDAxNjA4NDM3OTgyNDM4.QkSTzzrWOLthFGb869TsZOZsWULt6jxWbpiHgV5mLO8g.To4Xw0N6DVYBEtqKC54H77CFrtd2XN_GpnBHXG5Tkygg.PNG.rykim09%2F3.png&type=sc960_832"
              alt="ai 면접 아이콘"
              className="resume-icon"
            />
            <h3>인적성 검사 바로가기</h3>

          </div>
        </div>

        <div className="bottom-section">
          {/* ✅ 이력서 작성해보기 카드 (이미지 추가) */}
          <div className="resume-card" onClick={handleNavigateToResume}>
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
