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
  const [formData, setFormData] = useState({
    // 인적사항
    name: '',
    email: '',
    phone: '',
    address: '',
    birthDate: '',
    photo: null, // 증명사진 파일
    
    // 학력 (배열)
    educations: [{ school: '', major: '', graduationYear: '', degree: '' }],
    
    // 경력 (배열)
    experiences: [{ company: '', position: '', startDate: '', endDate: '', description: '' }],
    
    // 자격증 (배열)
    certificates: [{ name: '', issuer: '', date: '' }],
    
    // 자기소개서
    growthProcess: '', // 성장과정
    strengthsWeaknesses: '', // 성격의 장단점
    academicLife: '', // 학업생활
    motivation: '', // 지원동기와 입사 후 포부
  });

  // 이메일 검증 에러 메시지 상태
  const [emailError, setEmailError] = useState('');
  
  // 증명사진 미리보기 상태
  const [photoPreview, setPhotoPreview] = useState(null);

  // 전화번호 자동 포맷팅 함수
  const formatPhoneNumber = (value) => {
    // 숫자만 추출
    const numbers = value.replace(/[^\d]/g, '');
    
    // 길이에 따라 하이픈 추가
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else if (numbers.length <= 11) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
    } else {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  // 날짜 자동 포맷팅 함수 (1991-01-01 형식)
  const formatDate = (value) => {
    // 숫자와 하이픈만 허용
    const cleaned = value.replace(/[^\d-]/g, '');
    
    // 하이픈 제거 후 숫자만 추출
    const numbers = cleaned.replace(/-/g, '');
    
    // 길이에 따라 하이픈 추가
    if (numbers.length <= 4) {
      return numbers;
    } else if (numbers.length <= 6) {
      return `${numbers.slice(0, 4)}-${numbers.slice(4)}`;
    } else if (numbers.length <= 8) {
      return `${numbers.slice(0, 4)}-${numbers.slice(4, 6)}-${numbers.slice(6)}`;
    } else {
      return `${numbers.slice(0, 4)}-${numbers.slice(4, 6)}-${numbers.slice(6, 8)}`;
    }
  };

  // 폼 입력 핸들러 작성
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // 전화번호는 자동 포맷팅
    if (name === 'phone') {
      const formatted = formatPhoneNumber(value);
      setFormData(prev => ({ ...prev, [name]: formatted}));
    } else {
      setFormData(prev => ({ ...prev, [name]: value}));
    }
    // 입력값 변경 처리 로직 작성
  };

  // 학력/경력/자격증 입력 핸들러
  const handleArrayChange = (section, index, field, value) => {
    // 날짜 필드는 자동 포맷팅
    let formattedValue = value;
    if (field === 'startDate' || field === 'endDate' || field === 'date') {
      formattedValue = formatDate(value);
    }
    
    setFormData(prev => ({
      ...prev,
      [section]: prev[section].map((item, i) => 
        i === index ? { ...item, [field]: formattedValue } : item
      )
    }));
  };

  // 학력/경력/자격증 추가
  const addItem = (section, defaultItem) => {
    setFormData(prev => ({
      ...prev,
      [section]: [...prev[section], defaultItem]
    }));
  };

  // 학력/경력/자격증 삭제
  const removeItem = (section, index) => {
    setFormData(prev => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index)
    }));
  };

  // 이메일 형식 검증 함수
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // 이메일 실시간 검증
  const handleEmailChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, email: value}));
    
    // 이메일이 입력되어 있고 형식이 맞지 않으면 에러 메시지 표시
    if (value && !validateEmail(value)) {
      setEmailError('올바른 이메일 형식을 입력해주세요. (예: example@email.com)');
    } else {
      setEmailError('');
    }
  };

  // 증명사진 업로드 핸들러
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 파일 크기 제한 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('파일 크기는 5MB 이하여야 합니다.');
        return;
      }
      
      // 이미지 파일인지 확인
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.');
        return;
      }
      
      // 파일 저장
      setFormData(prev => ({ ...prev, photo: file}));
      
      // 미리보기 생성
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // 증명사진 삭제
  const handlePhotoRemove = () => {
    setFormData(prev => ({ ...prev, photo: null}));
    setPhotoPreview(null);
  };

  // 이력서 저장 함수 작성 (Axios 사용)
  const saveResume = async () => {
    // 이메일 형식 검증
    if (formData.email && !validateEmail(formData.email)) {
      alert('올바른 이메일 형식을 입력해주세요. (예: example@email.com)');
      return;
    }

    try {
      await resumeAPI.saveResume(formData);
      alert('저장 되었습니다.');
    } catch (error) {
      alert('저장 중 오류가 발생했습니다.');
    }
  };
    // resumeAPI.saveResume()을 사용하여 API 호출 로직 작성
    // 예: await resumeAPI.saveResume(formData);

  return (
    <div className="resume">
      <div className="resume-container">
        {/* 인적사항 섹션 */}
        <section className="resume-section personal-info">
          <h2 className="section-title">인적사항</h2>
          
          {/* 증명사진 업로드 */}
          <div className="form-group photo-upload">
            <div className="photo-preview-container">
              {photoPreview ? (
                <div className="photo-preview-wrapper">
                  <img 
                    src={photoPreview} 
                    alt="증명사진 미리보기" 
                    className="photo-preview"
                  />
                  <button
                    type="button"
                    className="photo-remove-button"
                    onClick={handlePhotoRemove}
                  >
                    삭제
                  </button>
                </div>
              ) : (
                <label className="photo-upload-label">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="photo-input"
                    style={{ display: 'none' }}
                  />
                  <div className="photo-upload-placeholder">
                    <span>+</span>
                    <span>증명사진 업로드</span>
                  </div>
                </label>
              )}
            </div>
          </div>
          
          <div className="form-group">
            <input
              className="resume-input"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="이름"
            />
          </div>
          <div className="form-group">
            <input
              className="resume-input"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleEmailChange}
              placeholder="이메일"
            />
            {emailError && (
              <span className="error-message">{emailError}</span>
            )}
          </div>
          <div className="form-group">
            <input
              className="resume-input"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="전화번호"
            />
          </div>
          <div className="form-group">
            <input
              className="resume-input"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="주소"
            />
          </div>
          <div className="form-group">
            <input
              className="resume-input"
              name="birthDate"
              type="text"
              value={formData.birthDate}
              onChange={handleInputChange}
              placeholder="생년월일 ex) 1990-01-01"
            />
          </div>
        </section>

        {/* 학력 섹션 */}
        <section className="resume-section education">
          <div className="section-header">
            <h2 className="section-title">학력</h2>
            <button 
              type="button"
              className="add-button"
              onClick={() => addItem('educations', { school: '', major: '', graduationYear: '', degree: '' })}
            >
              + 추가
            </button>
          </div>
          {formData.educations.map((education, index) => (
            <div key={index} className="education-item">
              <div className="form-group">
                <input
                  className="resume-input"
                  value={education.school}
                  onChange={(e) => handleArrayChange('educations', index, 'school', e.target.value)}
                  placeholder="학교명"
                />
              </div>
              <div className="form-group">
                <input
                  className="resume-input"
                  value={education.major}
                  onChange={(e) => handleArrayChange('educations', index, 'major', e.target.value)}
                  placeholder="전공"
                />
              </div>
              <div className="form-group">
                <input
                  className="resume-input"
                  value={education.graduationYear}
                  onChange={(e) => handleArrayChange('educations', index, 'graduationYear', e.target.value)}
                  placeholder="졸업년도"
                />
              
              </div>
              {formData.educations.length > 1 && (
                <button
                  type="button"
                  className="remove-button"
                  onClick={() => removeItem('educations', index)}
                >
                  삭제
                </button>
              )}
            </div>
          ))}
        </section>

        {/* 경력 섹션 */}
        <section className="resume-section experience">
          <div className="section-header">
            <h2 className="section-title">경력</h2>
            <button 
              type="button"
              className="add-button"
              onClick={() => addItem('experiences', { company: '', position: '', startDate: '', endDate: '', description: '' })}
            >
              + 추가
            </button>
          </div>
          {formData.experiences.map((experience, index) => (
            <div key={index} className="experience-item">
              <div className="form-group">
                <input
                  className="resume-input"
                  value={experience.company}
                  onChange={(e) => handleArrayChange('experiences', index, 'company', e.target.value)}
                  placeholder="회사명"
                />
              </div>
              <div className="form-group">
                <input
                  className="resume-input"
                  value={experience.position}
                  onChange={(e) => handleArrayChange('experiences', index, 'position', e.target.value)}
                  placeholder="직책"
                />
              </div>
              <div className="form-group">
                <input
                  className="resume-input"
                  type="text"
                  value={experience.startDate}
                  onChange={(e) => handleArrayChange('experiences', index, 'startDate', e.target.value)}
                  placeholder="시작일 (예: 1991-01-01)"
                />
              </div>
              <div className="form-group">
                <input
                  className="resume-input"
                  type="text"
                  value={experience.endDate}
                  onChange={(e) => handleArrayChange('experiences', index, 'endDate', e.target.value)}
                  placeholder="종료일 (예: 1991-01-01)"
                />
              </div>
              <div className="form-group">
                <textarea
                  className="resume-input"
                  value={experience.description}
                  onChange={(e) => handleArrayChange('experiences', index, 'description', e.target.value)}
                  placeholder="담당업무 및 성과"
                  rows={3}
                />
              </div>
              {formData.experiences.length > 1 && (
                <button
                  type="button"
                  className="remove-button"
                  onClick={() => removeItem('experiences', index)}
                >
                  삭제
                </button>
              )}
            </div>
          ))}
        </section>

        {/* 자격증 섹션 */}
        <section className="resume-section certificate">
          <div className="section-header">
            <h2 className="section-title">자격증</h2>
            <button 
              type="button"
              className="add-button"
              onClick={() => addItem('certificates', { name: '', issuer: '', date: '' })}
            >
              + 추가
            </button>
          </div>
          {formData.certificates.map((certificate, index) => (
            <div key={index} className="certificate-item">
              <div className="form-group">
                <input
                  className="resume-input"
                  value={certificate.name}
                  onChange={(e) => handleArrayChange('certificates', index, 'name', e.target.value)}
                  placeholder="자격증명"
                />
              </div>
              <div className="form-group">
                <input
                  className="resume-input"
                  value={certificate.issuer}
                  onChange={(e) => handleArrayChange('certificates', index, 'issuer', e.target.value)}
                  placeholder="발급기관"
                />
              </div>
              <div className="form-group">
                <input
                  className="resume-input"
                  type="text"
                  value={certificate.date}
                  onChange={(e) => handleArrayChange('certificates', index, 'date', e.target.value)}
                  placeholder="취득일 (예: 1991-01-01)"
                />
              </div>
              {formData.certificates.length > 1 && (
                <button
                  type="button"
                  className="remove-button"
                  onClick={() => removeItem('certificates', index)}
                >
                  삭제
                </button>
              )}
            </div>
          ))}
        </section>

        {/* 자기소개서 섹션 */}
        <section className="resume-section cover-letter">
          <h2 className="section-title">자기소개서</h2>
          
          <div className="form-group">
            <label className="cover-letter-label">성장과정</label>
            <textarea
              className="resume-input cover-letter-textarea"
              name="growthProcess"
              value={formData.growthProcess}
              onChange={handleInputChange}
              placeholder="성장과정을 작성해주세요"
              rows={5}
            />
          </div>
          
          <div className="form-group">
            <label className="cover-letter-label">성격의 장단점</label>
            <textarea
              className="resume-input cover-letter-textarea"
              name="strengthsWeaknesses"
              value={formData.strengthsWeaknesses}
              onChange={handleInputChange}
              placeholder="성격의 장단점을 작성해주세요"
              rows={5}
            />
          </div>
          
          <div className="form-group">
            <label className="cover-letter-label">학업생활</label>
            <textarea
              className="resume-input cover-letter-textarea"
              name="academicLife"
              value={formData.academicLife}
              onChange={handleInputChange}
              placeholder="학업생활을 작성해주세요"
              rows={5}
            />
          </div>
          
          <div className="form-group">
            <label className="cover-letter-label">지원동기와 입사 후 포부</label>
            <textarea
              className="resume-input cover-letter-textarea"
              name="motivation"
              value={formData.motivation}
              onChange={handleInputChange}
              placeholder="지원동기와 입사 후 포부를 작성해주세요"
              rows={5}
            />
          </div>
        </section>

        {/* 저장 버튼 */}
        <div className="resume-actions">
          <button 
            type="button"
            className="save-button"
            onClick={saveResume}
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
};

export default Resume;

