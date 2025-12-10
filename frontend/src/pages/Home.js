import React, { useState, useEffect } from 'react';
import './Home.css';
import { useNavigate } from 'react-router-dom';
import homepageAPI from '../services/homepageAPI';

// 이미지 import
import img1 from '../assets/interview1.jpg'; 
import img2 from '../assets/interview2.jpg'; 
import img3 from '../assets/interview3.jpg'; 

// [2] 구직 사이트 로고 이미지 import (파일이 assets 폴더에 있어야 합니다!)
// 예시 파일명입니다. 실제 파일명으로 바꿔주세요.
import logoSaramin from '../assets/사람인.jpg';   
import logoJobkorea from '../assets/잡코리아.png'; 
import logoWanted from '../assets/원티드.png';     
import logoIncruit from '../assets/인쿠르트.png';   
import logoWorknet from '../assets/워크넷.jpg';  

const STORAGE_KEY = 'resumeData';
const DATE_FORMAT_ERROR = '올바른 날짜 형식을 입력해주세요.';

// [3] 구직 사이트 데이터 수정 (이미지 + 링크 추가)
const jobSites = [
  { 
    name: '사람인', 
    url: 'https://www.saramin.co.kr', 
    img: logoSaramin 
  },
  { 
    name: '잡코리아', 
    url: 'https://www.jobkorea.co.kr', 
    img: logoJobkorea 
  },
  { 
    name: '원티드', 
    url: 'https://www.wanted.co.kr', 
    img: logoWanted 
  },
  { 
    name: '인크루트', 
    url: 'https://www.incruit.com', 
    img: logoIncruit 
  },
  { 
    name: '워크넷', 
    url: 'https://www.work.go.kr', 
    img: logoWorknet 
  },
];

// --- 헬퍼 함수들 (기존 유지) ---
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
  if (options.minDate && date < options.minDate) return options.minDateError || '날짜가 너무 이전입니다.';
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = [img1, img2, img3];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 3000); 
    return () => clearInterval(interval);
  }, [images.length]);

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
    setEmailError(value && !validateEmail(value) ? '올바른 이메일 형식을 입력해주세요.' : '');
  };

  useEffect(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setBasicInfo({
          name: parsedData.name || '',
          gender: parsedData.gender || '',
          birthDate: parsedData.birthDate || '',
          phone: parsedData.phone || '',
          email: parsedData.email || ''
        });
        if (parsedData.birthDate) setBirthDateError(validateBirthDate(parsedData.birthDate));
        if (parsedData.email && !validateEmail(parsedData.email)) setEmailError('올바른 이메일 형식을 입력해주세요.');
      }
    } catch (error) { console.error(error); }
  }, []);

  const saveToLocalStorage = () => {
    try {
      const existingData = localStorage.getItem(STORAGE_KEY);
      let resumeData = existingData ? JSON.parse(existingData) : {};
      const updatedData = { ...resumeData, ...basicInfo };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const handleSaveBasicInfo = () => {
    if (saveToLocalStorage()) alert('기본정보가 저장되었습니다.');
    else alert('저장 중 오류가 발생했습니다.');
  };

  const handleClearBasicInfo = () => {
    if (window.confirm('모든 기본정보를 지우시겠습니까?')) {
      setBasicInfo({ name: '', gender: '', birthDate: '', phone: '', email: '' });
      setEmailError('');
      setBirthDateError('');
      try {
        const existingData = localStorage.getItem(STORAGE_KEY);
        if (existingData) {
          const { photo, photoBase64 } = JSON.parse(existingData);
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ photo, photoBase64 }));
        }
      } catch (e) {}
      alert('기본정보가 모두 지워졌습니다.');
    }
  };

  const handleNavigateToResume = () => {
    saveToLocalStorage();
    navigate('/resume');
  };

  const handleNavigateToAssessment = () => {
    saveToLocalStorage();
    navigate('/Assessment');
  };

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
      const requestResponse = await homepageAPI.requestPayment({
        amount: donationAmount,
        donor_name: basicInfo.name || '',
        message: '개발 응원 후원'
      });
      const { orderId, amount: paymentAmount, orderName, customerName } = requestResponse.data;
      const TOSS_CLIENT_KEY = process.env.REACT_APP_TOSS_CLIENT_KEY || 'test_ck_26DIbXAaV0webj9q6nxd3qY50Q9R';
      const frontendSuccessUrl = `${window.location.origin}?payment=success`;
      const frontendFailUrl = `${window.location.origin}?payment=fail`;
      
      if (window.TossPayments) {
        try {
          const widget = window.TossPayments(TOSS_CLIENT_KEY);
          await widget.requestPayment('카드', {
            amount: paymentAmount,
            orderId: orderId,
            orderName: orderName,
            customerName: customerName,
            successUrl: frontendSuccessUrl,
            failUrl: frontendFailUrl,
          });
        } catch (error) {
          if (error.code !== 'USER_CANCEL') alert('결제창 오류');
        }
      } else {
        alert('토스페이먼츠 오류');
      }
    } catch (error) {
      if (error.code === 'USER_CANCEL') alert('결제 취소');
      else alert('후원 오류');
    } finally {
      setIsDonating(false);
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const orderId = urlParams.get('orderId');
    const paymentKey = urlParams.get('paymentKey');
    const amount = urlParams.get('amount');
    const processedKey = sessionStorage.getItem(`payment_processed_${orderId}`);
    if (processedKey) {
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }
    if (paymentStatus === 'success' && orderId && paymentKey && amount) {
      sessionStorage.setItem(`payment_processed_${orderId}`, 'true');
      const handlePaymentSuccess = async () => {
        try {
          setIsDonating(true);
          const confirmResponse = await homepageAPI.confirmPayment({
            paymentKey: paymentKey,
            orderId: orderId,
            amount: parseInt(amount)
          });
          if (confirmResponse && confirmResponse.data) {
            alert('후원해주셔서 감사합니다! 🎉');
            setDonationAmount(0);
          }
        } catch (error) { alert('결제 승인 오류'); } 
        finally { 
          setIsDonating(false); 
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      };
      handlePaymentSuccess();
    } else if (paymentStatus === 'fail') {
      alert('결제 실패');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  return (
    <div className="home">
      


      {/* 2. 메인 대시보드 */}
      <div className="dashboard-container">
        <div className="dashboard-body">
          
          {/* [1] 왼쪽 통합 영역 */}
          <div className="left-intro-area">
            <h1 className="intro-title">
              <span>성공적인 취업을 위한</span>
              <span>스마트한 선택</span>
            </h1>

            <div className="image-slider-container">
              {images.map((img, index) => (
                <img 
                  key={index}
                  src={img} 
                  alt={`Slide ${index + 1}`} 
                  className={`slide-image ${index === currentImageIndex ? 'active' : ''}`} 
                />
              ))}
            </div>

            <p className="intro-desc">
              AI 면접 시뮬레이션부터 이력서 관리까지.<br />
              당신의 꿈을 현실로 만들어보세요.
            </p>
          </div>

          {/* [2] 오른쪽: 카드 그리드 */}
          <div className="right-grid-area">
            <div className="grid-column">
              {/* 기본정보 카드 */}
              <div className="clean-card h-tall">
                <h3>내 기본정보</h3>
                <div className="input-group">
                  <input className="clean-input" name="name" placeholder="이름" value={basicInfo.name} onChange={handleInputChange} />
                  <select className={`clean-input ${basicInfo.gender === '' ? 'placeholder' : ''}`} name="gender" value={basicInfo.gender} onChange={handleInputChange}>
                    <option value="">성별 선택</option>
                    <option value="남자">남자</option>
                    <option value="여자">여자</option>
                  </select>
                  <input className="clean-input" name="birthDate" placeholder="생년월일 (YYYY-MM-DD)" value={basicInfo.birthDate} onChange={handleInputChange} />
                  {birthDateError && <span className="error-text">{birthDateError}</span>}
                  <input className="clean-input" name="phone" placeholder="전화번호" value={basicInfo.phone} onChange={handleInputChange} />
                  <input className="clean-input" name="email" type="email" placeholder="이메일" value={basicInfo.email} onChange={handleEmailChange} />
                  {emailError && <span className="error-text">{emailError}</span>}

                  <div className="btn-row">
                    <button className="btn-primary" onClick={handleSaveBasicInfo}>기본정보 저장</button>
                    <button className="btn-secondary" onClick={handleClearBasicInfo}>모두 지우기</button>
                  </div>
                </div>
              </div>

              {/* 면접 시뮬레이션 */}
              <div className="clean-card card-accent h-tall" onClick={() => navigate('/interview')}>
                <h3>면접 시뮬레이션</h3>
                <p>AI 면접관과 함께하는 실전 연습</p>
                <div style={{marginTop: 'auto', fontSize: '2rem'}}>🎙️</div>
              </div>
            </div>

            <div className="grid-column">
              {/* 인적성 */}
              <div className="clean-card h-short" onClick={handleNavigateToAssessment}>
                <h3>인적성 검사</h3>
                <p>나의 성향 파악하기</p>
              </div>

              {/* 이력서 */}
              <div className="clean-card h-short" onClick={handleNavigateToResume}>
                <h3>이력서 작성</h3>
                <p>합격을 부르는 이력서</p>
              </div>

              {/* 후원 */}
              <div className="clean-card h-short">
                <h3>개발자 응원하기</h3>
                <div className="donation-chips">
                  {[1000, 3000, 5000].map(amount => (
                    <div key={amount} 
                         className={`chip ${donationAmount === amount ? 'active' : ''}`}
                         onClick={() => setDonationAmount(amount)}>
                      {amount.toLocaleString()}원
                    </div>
                  ))}
                </div>
                <button className="btn-primary" style={{width: '100%'}} onClick={handleDonate} disabled={isDonating}>
                  {isDonating ? '처리 중...' : '후원하기'}
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
      
      {/* [NEW] 구직 사이트 슬라이더 섹션 (무한 루프) */}
      <div className="job-slider-section">
        <h3 className="slider-title">함께하는 채용 파트너</h3>
        <div className="slider-track">
          {/* [핵심] 리스트 4번 반복 */}
          {[...jobSites, ...jobSites, ...jobSites, ...jobSites].map((site, index) => (
            <a 
              key={index} 
              href={site.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="job-logo-card"
            >
              {/* 이미지 로고가 있으면 img 사용, 없으면 텍스트 */}
              <img 
                src={site.img} 
                alt={site.name} 
                style={{ maxWidth: '80%', maxHeight: '60%', objectFit: 'contain' }} 
              />
              {/* <span style={{ color: site.color }}>{site.name}</span> */}
            </a>
          ))}
        </div>
      </div>

    </div>
  );
};

export default Home;