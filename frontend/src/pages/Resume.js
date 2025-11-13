/**
 * 페이지: 이력서 작성 페이지
 * 역할: 이력서 작성 폼 UI 및 로직
 */

import React, { useState, useEffect } from 'react';
import './Resume.css';
import resumeAPI from '../services/resumeAPI';

// 상수 정의
const STORAGE_KEY = 'resumeData';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_TEXT_LENGTH = 500;

// 기본 폼 데이터
const defaultFormData = {
  name: '',
  email: '',
  phone: '',
  address: '',
  birthDate: '',
  gender: '',
  photo: null,
  educations: [{ school: '', major: '', graduationYear: '' }],
  experiences: [{ company: '', position: '', startDate: '', endDate: '', description: '' }],
  certificates: [{ name: '', issuer: '', date: '' }],
  growthProcess: '',
  strengthsWeaknesses: '',
  academicLife: '',
  motivation: '',
};

// 유틸리티 함수들
const formatPhoneNumber = (value) => {
  const numbers = value.replace(/[^\d]/g, '');
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
};

const formatDate = (value) => {
  const numbers = value.replace(/[^\d-]/g, '').replace(/-/g, '');
  if (numbers.length <= 4) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 4)}-${numbers.slice(4)}`;
  return `${numbers.slice(0, 4)}-${numbers.slice(4, 6)}-${numbers.slice(6, 8)}`;
};

const formatGraduationYear = (value) => value.replace(/[^\d]/g, '');

const isValidDate = (dateString) => {
  if (!dateString || dateString.length !== 10) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false;
  
  const date = new Date(dateString);
  const [year, month, day] = dateString.split('-').map(Number);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
};

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const validateBirthDate = (dateString) => {
  if (!dateString) return '';
  if (!isValidDate(dateString)) return '올바른 날짜 형식을 입력해주세요. (예: 1990-01-01)';
  
  const date = new Date(dateString);
  const today = new Date();
  const minDate = new Date('1900-01-01');
  
  if (date > today) return '생년월일은 오늘 이전이어야 합니다.';
  if (date < minDate) return '생년월일은 1900년 이후여야 합니다.';
  return '';
};

const validateExperienceDates = (startDate, endDate) => {
  const errors = { startDate: '', endDate: '' };
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  
  if (startDate && !isValidDate(startDate)) {
    errors.startDate = '올바른 날짜 형식을 입력해주세요.';
  } else if (startDate && new Date(startDate) > today) {
    errors.startDate = '시작일은 오늘 이전이어야 합니다.';
  }
  
  if (endDate && endDate !== '') {
    if (!isValidDate(endDate)) {
      errors.endDate = '올바른 날짜 형식을 입력해주세요.';
    } else {
      const end = new Date(endDate);
      if (end > today) {
        errors.endDate = '종료일은 오늘 이전이어야 합니다.';
      } else if (startDate && isValidDate(startDate) && end < new Date(startDate)) {
        errors.endDate = '종료일은 시작일 이후여야 합니다.';
      }
    }
  }
  
  return errors;
};

const validateCertificateDate = (dateString) => {
  if (!dateString) return '';
  if (!isValidDate(dateString)) return '올바른 날짜 형식을 입력해주세요. (예: 1990-01-01)';
  
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  
  if (date > today) return '취득일은 오늘 이전이어야 합니다.';
  return '';
};

const validateGraduationYear = (yearString) => {
  if (!yearString) return '';
  if (!/^\d+$/.test(yearString)) return '숫자만 입력해주세요.';
  if (yearString.length !== 4) return '4자리 연도를 입력해주세요. (예: 2020)';
  
  const year = parseInt(yearString, 10);
  const currentYear = new Date().getFullYear();
  const minYear = 1900;
  
  if (year < minYear) return `졸업년도는 ${minYear}년 이후여야 합니다.`;
  if (year > currentYear) return `졸업년도는 ${currentYear}년 이하여야 합니다.`;
  return '';
};

// localStorage 유틸리티
const loadFromStorage = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { formData: { ...parsed, photo: null }, photoPreview: parsed.photoBase64 || null };
    }
  } catch (error) {
    console.error('저장된 데이터 불러오기 실패:', error);
  }
  return { formData: defaultFormData, photoPreview: null };
};

const saveToStorage = (formData, photoPreview) => {
  try {
    const dataToSave = {
      ...formData,
      photo: null,
      photoBase64: photoPreview,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    return true;
  } catch (error) {
    console.error('저장 중 오류:', error);
    return false;
  }
};

const Resume = () => {
  const [formData, setFormData] = useState(defaultFormData);
  const [emailError, setEmailError] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [birthDateError, setBirthDateError] = useState('');
  const [educationErrors, setEducationErrors] = useState({});
  const [experienceErrors, setExperienceErrors] = useState({});
  const [certificateErrors, setCertificateErrors] = useState({});
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentSection, setCurrentSection] = useState('');
  const [feedbackText, setFeedbackText] = useState('');

  // 자기소개서 섹션 설정
  const coverLetterSections = [
    { key: 'growthProcess', label: '성장과정' },
    { key: 'strengthsWeaknesses', label: '성격의 장단점' },
    { key: 'academicLife', label: '학업생활' },
    { key: 'motivation', label: '지원동기와 입사 후 포부' },
  ];

  useEffect(() => {
    const { formData: savedData, photoPreview: savedPreview } = loadFromStorage();
    setFormData(savedData);
    setPhotoPreview(savedPreview);
  }, []);

  // 입력 핸들러
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'phone') {
      setFormData(prev => ({ ...prev, [name]: formatPhoneNumber(value) }));
    } else if (name === 'birthDate') {
      const formatted = formatDate(value);
      setFormData(prev => ({ ...prev, [name]: formatted }));
      setBirthDateError(validateBirthDate(formatted));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleArrayChange = (section, index, field, value) => {
    let formattedValue = value;
    
    if (field === 'startDate' || field === 'endDate' || field === 'date') {
      formattedValue = formatDate(value);
    } else if (field === 'graduationYear') {
      formattedValue = formatGraduationYear(value);
    }
    
    setFormData(prev => {
      const updatedSection = prev[section].map((item, i) =>
        i === index ? { ...item, [field]: formattedValue } : item
      );
      
      // 실시간 검증
      if (section === 'educations' && field === 'graduationYear') {
        const error = validateGraduationYear(formattedValue);
        setEducationErrors(prevErrors => ({
          ...prevErrors,
          [index]: { graduationYear: error }
        }));
      } else if (section === 'experiences' && (field === 'startDate' || field === 'endDate')) {
        const experience = updatedSection[index];
        const errors = validateExperienceDates(experience.startDate, experience.endDate);
        setExperienceErrors(prevErrors => ({
          ...prevErrors,
          [index]: errors
        }));
      } else if (section === 'certificates' && field === 'date') {
        const error = validateCertificateDate(formattedValue);
        setCertificateErrors(prevErrors => ({
          ...prevErrors,
          [index]: { date: error }
        }));
      }
      
      return { ...prev, [section]: updatedSection };
    });
  };

  const addItem = (section, defaultItem) => {
    setFormData(prev => ({
      ...prev,
      [section]: [...prev[section], defaultItem]
    }));
  };

  const removeItem = (section, index) => {
    setFormData(prev => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index)
    }));
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, email: value }));
    setEmailError(value && !validateEmail(value) 
      ? '올바른 이메일 형식을 입력해주세요. (예: example@email.com)' 
      : '');
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > MAX_FILE_SIZE) {
      alert('파일 크기는 5MB 이하여야 합니다.');
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }
    
    setFormData(prev => ({ ...prev, photo: file }));
    
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handlePhotoRemove = () => {
    setFormData(prev => ({ ...prev, photo: null }));
    setPhotoPreview(null);
  };

  // 검증 헬퍼 함수
  const hasSectionData = (item, fields) => fields.some(field => item[field]?.trim());

  // 검증 함수들
  const hasValidationErrors = () => {
    // 필수 필드 검증
    if (!formData.name.trim() || !formData.email.trim() || !formData.birthDate.trim()) return true;
    if (emailError || (formData.email && !validateEmail(formData.email))) return true;
    if (formData.birthDate && birthDateError) return true;
    
    // 학력 검증
    if (formData.educations.some((edu, index) => 
      hasSectionData(edu, ['school', 'major', 'graduationYear']) && educationErrors[index]?.graduationYear
    )) return true;
    
    // 경력 검증
    if (formData.experiences.some((exp, index) => 
      hasSectionData(exp, ['company', 'position', 'startDate', 'endDate', 'description']) && 
      (experienceErrors[index]?.startDate || experienceErrors[index]?.endDate)
    )) return true;
    
    // 자격증 검증
    if (formData.certificates.some((cert, index) => 
      hasSectionData(cert, ['name', 'issuer', 'date']) && certificateErrors[index]?.date
    )) return true;
    
    return false;
  };

  const getValidationErrorMessage = () => {
    if (!formData.name.trim()) return '이름을 입력해주세요.';
    if (!formData.email.trim()) return '이메일을 입력해주세요.';
    if (!formData.birthDate.trim()) return '생년월일을 입력해주세요.';
    if (emailError) return emailError;
    if (formData.email && !validateEmail(formData.email)) {
      return '올바른 이메일 형식을 입력해주세요. (예: example@email.com)';
    }
    if (formData.birthDate && birthDateError) return birthDateError;
    
    // 학력 오류
    const eduErrorIndex = formData.educations.findIndex((edu, index) => 
      hasSectionData(edu, ['school', 'major', 'graduationYear']) && educationErrors[index]?.graduationYear
    );
    if (eduErrorIndex !== -1) return educationErrors[eduErrorIndex].graduationYear;
    
    // 경력 오류
    const expErrorIndex = formData.experiences.findIndex((exp, index) => 
      hasSectionData(exp, ['company', 'position', 'startDate', 'endDate', 'description']) && 
      (experienceErrors[index]?.startDate || experienceErrors[index]?.endDate)
    );
    if (expErrorIndex !== -1) {
      const expError = experienceErrors[expErrorIndex];
      return `경력 ${expErrorIndex + 1}번 항목: ${expError.startDate || expError.endDate}`;
    }
    
    // 자격증 오류
    const certErrorIndex = formData.certificates.findIndex((cert, index) => 
      hasSectionData(cert, ['name', 'issuer', 'date']) && certificateErrors[index]?.date
    );
    if (certErrorIndex !== -1) {
      return `자격증 ${certErrorIndex + 1}번 항목: ${certificateErrors[certErrorIndex].date}`;
    }
    
    return null;
  };

  const saveResume = () => {
    const errorMessage = getValidationErrorMessage();
    if (errorMessage) {
      alert(errorMessage);
      return;
    }

    if (saveToStorage(formData, photoPreview)) {
      alert('저장 되었습니다.');
    } else {
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const handleAnalyze = async (section) => {
    const content = formData[section];
    
    // 빈 필드 검증
    if (!content || !content.trim()) {
      alert('분석할 내용이 없습니다.');
      return;
    }
    
    setIsAnalyzing(true);
    setCurrentSection(section);
    setFeedbackText(''); // 이전 피드백 초기화
    
    try {
      const response = await resumeAPI.analyzeSection(section, content);
      setFeedbackText(response.data.feedback);
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'AI 분석 중 오류가 발생했습니다.';
      alert(errorMessage);
      setFeedbackText('');
    } finally {
      setIsAnalyzing(false);
      setCurrentSection('');
    }
  };

  return (
    <div className="resume">
      <div className="resume-container">
        {/* 인적사항 섹션 */}
        <section className="resume-section personal-info">
          <h2 className="section-title">인적사항</h2>
          
          <div className="personal-info-box">
            <div className="form-group photo-upload">
              <div className="photo-preview-container">
                {photoPreview ? (
                  <div className="photo-preview-wrapper">
                    <img src={photoPreview} alt="증명사진 미리보기" className="photo-preview" />
                    <button type="button" className="photo-remove-button" onClick={handlePhotoRemove}>
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
            
            {/* 1행: 이름 | 성별 | 생년월일 */}
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
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                placeholder="성별"
              />
            </div>
            <div className="form-group">
              <input
                className={`resume-input ${birthDateError ? 'error' : ''}`}
                name="birthDate"
                type="text"
                value={formData.birthDate}
                onChange={handleInputChange}
                placeholder="생년월일 ex) 1990-01-01"
              />
              {birthDateError && <span className="error-message">{birthDateError}</span>}
            </div>
            
            {/* 2행: 전화번호 | 이메일 */}
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
                name="email"
                type="email"
                value={formData.email}
                onChange={handleEmailChange}
                placeholder="이메일"
              />
              {emailError && <span className="error-message">{emailError}</span>}
            </div>
            
            {/* 3행: 주소 (전체 너비) */}
            <div className="form-group">
              <input
                className="resume-input"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="주소"
              />
            </div>
          </div>
        </section>

        {/* 학력 섹션 */}
        <section className="resume-section education">
          <div className="section-header">
            <h2 className="section-title">학력</h2>
            <button
              type="button"
              className="add-button"
              onClick={() => addItem('educations', { school: '', major: '', graduationYear: '' })}
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
                  className={`resume-input ${educationErrors[index]?.graduationYear ? 'error' : ''}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={education.graduationYear}
                  onChange={(e) => handleArrayChange('educations', index, 'graduationYear', e.target.value)}
                  placeholder="졸업년도 (예: 2020)"
                />
                {educationErrors[index]?.graduationYear && (
                  <span className="error-message">{educationErrors[index].graduationYear}</span>
                )}
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
                  className={`resume-input ${experienceErrors[index]?.startDate ? 'error' : ''}`}
                  type="text"
                  value={experience.startDate}
                  onChange={(e) => handleArrayChange('experiences', index, 'startDate', e.target.value)}
                  placeholder="시작일 (예: 1991-01-01)"
                />
                {experienceErrors[index]?.startDate && (
                  <span className="error-message">{experienceErrors[index].startDate}</span>
                )}
              </div>
              <div className="form-group">
                <input
                  className={`resume-input ${experienceErrors[index]?.endDate ? 'error' : ''}`}
                  type="text"
                  value={experience.endDate}
                  onChange={(e) => handleArrayChange('experiences', index, 'endDate', e.target.value)}
                  placeholder="종료일 (예: 1991-01-01)"
                />
                {experienceErrors[index]?.endDate && (
                  <span className="error-message">{experienceErrors[index].endDate}</span>
                )}
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
                  className={`resume-input ${certificateErrors[index]?.date ? 'error' : ''}`}
                  type="text"
                  value={certificate.date}
                  onChange={(e) => handleArrayChange('certificates', index, 'date', e.target.value)}
                  placeholder="취득일 (예: 1991-01-01)"
                />
                {certificateErrors[index]?.date && (
                  <span className="error-message">{certificateErrors[index].date}</span>
                )}
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
          
          {coverLetterSections.map(({ key, label }) => (
            <div key={key} className="form-group">
              <label className="cover-letter-label">
                {label}
                <button
                  type="button"
                  className="analyze-button"
                  onClick={() => handleAnalyze(key)}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing && currentSection === key ? '분석 중...' : 'AI 분석'}
                </button>
              </label>
              <textarea
                className="resume-input cover-letter-textarea"
                name={key}
                value={formData[key]}
                onChange={handleInputChange}
                placeholder={`${label}을 작성해주세요`}
                rows={5}
                maxLength={MAX_TEXT_LENGTH}
              />
              <div className="character-count">{formData[key].length}/{MAX_TEXT_LENGTH}</div>
            </div>
          ))}
        </section>

        {/* 저장 버튼 */}
        <div className="resume-actions">
          <button
            type="button"
            className="save-button"
            onClick={saveResume}
            disabled={hasValidationErrors()}
          >
            저장
          </button>
          {hasValidationErrors() && (
            <div className="validation-error-message">
              {getValidationErrorMessage()}
            </div>
          )}
        </div>
      </div>
      
      {/* AI 피드백 패널 */}
      <div className={`feedback-panel ${isPanelOpen ? 'open' : 'closed'}`}>
        <button 
          type="button"
          className="panel-toggle"
          onClick={() => setIsPanelOpen(!isPanelOpen)}
          aria-label={isPanelOpen ? '패널 닫기' : '패널 열기'}
        >
          {isPanelOpen ? '>' : '<'}
        </button>
        
        {isPanelOpen && (
          <div className="feedback-content">
            <h3 className="feedback-title">AI 피드백</h3>
            <div className="feedback-divider"></div>
            <div className="feedback-text-container">
              {isAnalyzing ? (
                <p className="feedback-placeholder">분석 중...</p>
              ) : feedbackText ? (
                <p className="feedback-text">{feedbackText}</p>
              ) : (
                <p className="feedback-placeholder">
                  분석 버튼을 클릭하면 피드백이 표시됩니다.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Resume;
