/**
 * 페이지: 메인 홈페이지
 * 역할: 홈페이지 UI 컴포넌트 작성
 * 설명: 
 * - 메인 홈페이지의 레이아웃과 구조를 작성합니다
 * - 면접 시뮬레이션, 인적성검사, 이력서 작성으로 이동할 수 있는 링크를 배치합니다
 * - React 컴포넌트로 작성하며, CSS 파일로 스타일링합니다
 */

import React, { useState, useEffect } from 'react';
import './Home.css';
import { useNavigate } from 'react-router-dom';
import homepageAPI from '../services/homepageAPI';

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
  const [donationAmount, setDonationAmount] = useState(0);
  const [isDonating, setIsDonating] = useState(false);
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

  // 컴포넌트 마운트 시 로컬 스토리지에서 기본정보 불러오기
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        // 기본정보 필드만 추출하여 상태에 설정
        const basicInfoFields = {
          name: parsedData.name || '',
          gender: parsedData.gender || '',
          birthDate: parsedData.birthDate || '',
          phone: parsedData.phone || '',
          email: parsedData.email || ''
        };
        setBasicInfo(basicInfoFields);
        
        // 에러 상태도 확인하여 설정
        if (parsedData.birthDate) {
          setBirthDateError(validateBirthDate(parsedData.birthDate));
        }
        if (parsedData.email) {
          setEmailError(parsedData.email && !validateEmail(parsedData.email) 
            ? '올바른 이메일 형식을 입력해주세요. (예: example@email.com)' 
            : '');
        }
      }
    } catch (error) {
      console.error('로컬 스토리지 데이터 불러오기 중 오류:', error);
    }
  }, []);

  // 기본정보 저장 함수
  const handleSaveBasicInfo = () => {
    try {
      const existingData = localStorage.getItem(STORAGE_KEY);
      let resumeData = {};
      
      if (existingData) {
        resumeData = JSON.parse(existingData);
      }
      
      // 기본정보를 병합하여 저장 (photo는 유지)
      const updatedData = {
        ...resumeData,
        ...basicInfo,
        photo: resumeData.photo || null,
        photoBase64: resumeData.photoBase64 || null
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
      alert('기본정보가 저장되었습니다.');
    } catch (error) {
      console.error('데이터 저장 중 오류:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  // 기본정보 모두 지우기 함수
  const handleClearBasicInfo = () => {
    if (window.confirm('모든 기본정보를 지우시겠습니까?')) {
      setBasicInfo({
        name: '',
        gender: '',
        birthDate: '',
        phone: '',
        email: ''
      });
      setEmailError('');
      setBirthDateError('');
      
      // 로컬 스토리지에서도 기본정보 필드만 제거 (photo는 유지)
      try {
        const existingData = localStorage.getItem(STORAGE_KEY);
        if (existingData) {
          const resumeData = JSON.parse(existingData);
          const { photo, photoBase64, ...otherData } = resumeData;
          // 기본정보 필드 제거
          const { name, gender, birthDate, phone, email, ...restData } = otherData;
          
          // photo만 남기고 저장
          const cleanedData = {
            ...restData,
            photo: photo || null,
            photoBase64: photoBase64 || null
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanedData));
        }
      } catch (error) {
        console.error('데이터 삭제 중 오류:', error);
      }
      
      alert('기본정보가 모두 지워졌습니다.');
    }
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

    const handleNavigateToAssessment = () => {
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
      navigate('/Assessment');
    } catch (error) {
      console.error('데이터 저장 중 오류:', error);
      navigate('/Assessment');
    }
  };

  // 토스페이먼츠 결제 위젯 초기화
  useEffect(() => {
    // 토스페이먼츠 위젯이 로드되었는지 확인
    if (typeof window !== 'undefined' && window.TossPayments) {
      // 위젯 사용 가능
    }
  }, []);

  // 후원하기 핸들러 (토스페이먼츠 결제)
  const handleDonate = async () => {
    if (donationAmount === 0) {
      alert('후원 금액을 선택해주세요.');
      return;
    }

    if (!window.confirm(`${donationAmount.toLocaleString()}원을 후원하시겠습니까?`)) {
      return;
    }

    setIsDonating(true);
    try {
      // 1. 주문 정보 생성
      const requestResponse = await homepageAPI.requestPayment({
        amount: donationAmount,
        donor_name: basicInfo.name || '',
        message: '개발 응원 후원'
      });

      const { orderId, amount: paymentAmount, orderName, customerName } = requestResponse.data;

      // 2. 토스페이먼츠 결제창 호출
      // API 개별 연동 키 사용 (ck) - 사업자 등록 없이 사용 가능
      const TOSS_CLIENT_KEY = process.env.REACT_APP_TOSS_CLIENT_KEY || 'test_ck_26DIbXAaV0webj9q6nxd3qY50Q9R';
      
      // 프론트엔드 URL로 직접 설정 (토스페이먼츠가 자동으로 paymentKey, orderId, amount를 추가함)
      const frontendSuccessUrl = `${window.location.origin}?payment=success`;
      const frontendFailUrl = `${window.location.origin}?payment=fail`;
      
      // 토스페이먼츠 결제창 SDK 사용
      if (window.TossPayments) {
        try {
          const widget = window.TossPayments(TOSS_CLIENT_KEY);
          
          // 결제창 띄우기
          await widget.requestPayment('카드', {
            amount: paymentAmount,
            orderId: orderId,
            orderName: orderName,
            customerName: customerName,
            successUrl: frontendSuccessUrl,
            failUrl: frontendFailUrl,
          });
        } catch (error) {
          console.error('결제창 호출 오류:', error);
          
          // 사용자가 결제를 취소한 경우
          if (error.code === 'USER_CANCEL') {
            // 이미 catch 블록에서 처리됨
            throw error;
          } else {
            alert('결제창을 불러올 수 없습니다. 다시 시도해주세요.');
            throw error;
          }
        }
      } else {
        alert('토스페이먼츠 결제창을 불러올 수 없습니다. 페이지를 새로고침해주세요.');
      }
    } catch (error) {
      console.error('후원 오류:', error);
      
      // 사용자가 결제를 취소한 경우
      if (error.code === 'USER_CANCEL') {
        alert('결제가 취소되었습니다.');
      } else {
        alert('후원 처리 중 오류가 발생했습니다.');
      }
    } finally {
      setIsDonating(false);
    }
  };

  // 결제 성공/실패 처리 (URL 파라미터로 리다이렉트된 경우)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const orderId = urlParams.get('orderId');
    const paymentKey = urlParams.get('paymentKey');
    const amount = urlParams.get('amount');

    // 이미 처리된 결제인지 확인 (중복 실행 방지)
    const processedKey = sessionStorage.getItem(`payment_processed_${orderId}`);
    if (processedKey) {
      // 이미 처리된 결제는 URL 파라미터만 제거
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (paymentStatus === 'success' && orderId && paymentKey && amount) {
      // 처리 중 표시 (중복 실행 방지)
      sessionStorage.setItem(`payment_processed_${orderId}`, 'true');
      
      // 결제 성공 후 승인 처리
      const handlePaymentSuccess = async () => {
        try {
          setIsDonating(true);
          
          // 토스페이먼츠 결제 승인 API 호출
          const confirmResponse = await homepageAPI.confirmPayment({
            paymentKey: paymentKey,
            orderId: orderId,
            amount: parseInt(amount)
          });

          // 성공 응답 확인
          if (confirmResponse && confirmResponse.data) {
            alert('후원해주셔서 감사합니다! 🎉');
            setDonationAmount(0);
          }
          
          // URL 파라미터 제거
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (error) {
          console.error('결제 승인 오류:', error);
          const errorMessage = error.response?.data?.error || error.message || '알 수 없는 오류';
          alert(`결제 승인 처리 중 오류가 발생했습니다: ${errorMessage}`);
        } finally {
          setIsDonating(false);
          // URL 파라미터 제거
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      };
      
      handlePaymentSuccess();
    } else if (paymentStatus === 'fail') {
      alert('결제에 실패했습니다. 다시 시도해주세요.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

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
              <div className="button-group">
                <button type='button' className='info-save' onClick={handleSaveBasicInfo}>기본정보 저장</button>
                <button type='button' className='info-clear' onClick={handleClearBasicInfo}>모두 지우기</button>
              </div>
            </div>
          </div>

          <div className="card card-interview" onClick={() => navigate('/interview')}>
            <h3>가상 면접 시뮬레이션</h3>
          </div>

          <div className="card card-assessment" onClick={handleNavigateToAssessment}>
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
            <p>아래 사이트를 통해 최신 채용 정보를 확인해보세요.</p>

             <div className="job-box-container">
               {/* 사람인 */}
                 <a
                   href="https://www.saramin.co.kr/zf_user/?NaPm=ct%3Dmi2jbdq3%7Cci%3Dcheckout%7Ctr%3Dds%7Ctrx%3Dnull%7Chk%3D421c780be98f757d363ab47053b9e738bd21c73e"
                   target="_blank"
                    rel="noopener noreferrer"
                   className="job-card-box"
                                >
                          <img
                           src="https://search.pstatic.net/common/?src=http%3A%2F%2Fcafefiles.naver.net%2FMjAxOTAxMTVfMjcw%2FMDAxNTQ3NTI0MDIyMTYx.WOjbU7yxId3APzJ9JZxyTd-Y5zWdjawv916XG3HXEgkg.jV_wmIhqmvhFNlejrwUmhC7ZyMUhXEm2pHAfpHwC0c0g.JPEG.ghdeodutls%2F00500067_20160812.JPG&type=a340"
                         alt="사람인"
                            />
                          <span>사람인 바로가기</span>
                            </a>           {/* 잡코리아 */}  <a
                  href="https://www.jobkorea.co.kr/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="job-card-box"
                >
            <img
              src="https://search.pstatic.net/common/?src=http%3A%2F%2Fblogfiles.naver.net%2FMjAyNDA4MjJfMjk2%2FMDAxNzI0MzMzODM2OTU3.w3j6fK-zuFCycDt6wR6l27sDnshYvKjYD_NRHwhN7bog.XDD5_e1F-1emlEU5kvI8RCnAX-CSjzUddjpEh6KQGwkg.JPEG%2F%25BD%25C9%25BA%25BC1.jpg&type=l340_165"
              alt="잡코리아"
            />
                <span>잡코리아 바로가기</span>
              </a>
            </div>
          </div>
          <div className='sponsor'>
            <h3>사이트 후원</h3>
            <p>개발하면서 힘내라고 응원을 해주세요!</p>
            
            <div className="donation-amount-selector">
              {[1000, 2000, 3000, 4000, 5000].map((amount) => (
                <button
                  key={amount}
                  type="button"
                  className={`amount-btn ${donationAmount === amount ? 'selected' : ''}`}
                  onClick={() => setDonationAmount(amount)}
                >
                  {amount.toLocaleString()}원
                </button>
              ))}
            </div>
            
            <button 
              type='button' 
              className='sp-btn' 
              onClick={handleDonate}
              disabled={isDonating || donationAmount === 0}
            >
              {isDonating ? '처리 중...' : '후원하기'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Home;
