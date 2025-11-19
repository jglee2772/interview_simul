import React, { useState, useEffect, useMemo } from 'react';
import './Resume.css';
import resumeAPI from '../services/resumeAPI';

const STORAGE_KEY = 'resumeData';
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_TEXT_LENGTH = 500;

const defaultFormData = {
  name: '',
  email: '',
  phone: '',
  address: '',
  birthDate: '',
  gender: '',
  applicationField: '',
  portfolio: '',
  photo: null,
  educations: [{ 
    school: '', 
    major: '', 
    startDate: '',
    endDate: '',
    graduationStatus: '',
    location: ''
  }],
  experiences: [{ 
    company: '', 
    position: '', 
    rank: '',
    startDate: '', 
    endDate: '', 
    description: '' 
  }],
  trainings: [{
    startDate: '',
    endDate: '',
    content: '',
    institution: ''
  }],
  certificates: [{ name: '', issuer: '', date: '' }],
  growthProcess: '',
  strengthsWeaknesses: '',
  academicLife: '',
  motivation: '',
};

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

const formatDateYearMonth = (value) => {
  const numbers = value.replace(/[^\d]/g, '');
  if (numbers.length <= 4) return numbers;
  return `${numbers.slice(0, 4)}.${numbers.slice(4, 6)}`;
};

const isValidDate = (dateString) => {
  if (!dateString || dateString.length !== 10) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false;
  
  const date = new Date(dateString);
  const [year, month, day] = dateString.split('-').map(Number);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
};

const isValidYearMonth = (dateString) => {
  if (!dateString || dateString.length !== 7) return false;
  if (!/^\d{4}\.\d{2}$/.test(dateString)) return false;
  
  const [year, month] = dateString.split('.').map(Number);
  if (year < 1900 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  return true;
};

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const getToday = () => {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return today;
};

const DATE_FORMAT_ERROR = '올바른 날짜 형식을 입력해주세요.';
const DATE_FORMAT_ERROR_YEAR_MONTH = '올바른 날짜 형식을 입력해주세요. (예: 2011.03)';
const DATE_FORMAT_ERROR_EDUCATION = '올바른 날짜 형식을 입력해주세요. (예: 2014.02)';
const DATE_FORMAT_ERROR_TRAINING = '올바른 날짜 형식을 입력해주세요. (예: 2025.12)';
const DATE_FUTURE_ERROR = '날짜는 오늘 이전이어야 합니다.';
const DATE_TOO_OLD_ERROR = '날짜가 너무 이전입니다.';
const START_DATE_FUTURE_ERROR = '시작일은 오늘 이전이어야 합니다.';
const END_DATE_FUTURE_ERROR = '종료일은 오늘 이전이어야 합니다.';
const END_DATE_BEFORE_START_ERROR = '종료일은 시작일 이후여야 합니다.';
const BIRTH_DATE_FUTURE_ERROR = '생년월일은 오늘 이전이어야 합니다.';
const BIRTH_DATE_TOO_OLD_ERROR = '생년월일은 1900년 이후여야 합니다.';
const CERTIFICATE_DATE_FUTURE_ERROR = '취득일은 오늘 이전이어야 합니다.';
const EMAIL_FORMAT_ERROR = '올바른 이메일 형식을 입력해주세요. (예: example@email.com)';
const NAME_REQUIRED_ERROR = '이름을 입력해주세요.';
const EMAIL_REQUIRED_ERROR = '이메일을 입력해주세요.';
const BIRTH_DATE_REQUIRED_ERROR = '생년월일을 입력해주세요.';
const FILE_SIZE_ERROR = `파일 크기는 ${MAX_FILE_SIZE / (1024 * 1024)}MB 이하여야 합니다.`;
const FILE_TYPE_ERROR = '이미지 파일만 업로드 가능합니다.';
const FILE_READ_ERROR = '파일을 읽는 중 오류가 발생했습니다.';
const DELETE_CONFIRM_MESSAGE = '모든 입력 내용을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.';
const DELETE_SUCCESS_MESSAGE = '모든 내용이 삭제되었습니다.';
const SAVE_SUCCESS_MESSAGE = '저장 되었습니다.';
const SAVE_ERROR_MESSAGE = '저장 중 오류가 발생했습니다.';
const STORAGE_QUOTA_ERROR = '저장 공간이 부족합니다. 일부 데이터를 삭제한 후 다시 시도해주세요.';
const NO_CONTENT_ERROR = '분석할 내용이 없습니다.';
const AI_ANALYSIS_ERROR = 'AI 분석 중 오류가 발생했습니다.';
const NO_FEEDBACK_ERROR = '저장할 피드백 내용이 없습니다.';

const validateDateRange = (dateString, options = {}) => {
  if (!dateString) return '';
  if (!isValidDate(dateString)) return DATE_FORMAT_ERROR;
  
  const date = new Date(dateString);
  const today = getToday();
  
  if (date > today) return options.futureError || DATE_FUTURE_ERROR;
  if (options.minDate && date < options.minDate) {
    return options.minDateError || DATE_TOO_OLD_ERROR;
  }
  return '';
};

const validateBirthDate = (dateString) => {
  return validateDateRange(dateString, {
    minDate: new Date('1900-01-01'),
    futureError: BIRTH_DATE_FUTURE_ERROR,
    minDateError: BIRTH_DATE_TOO_OLD_ERROR
  });
};

const validateYearMonthRange = (dateString, options = {}) => {
  if (!dateString) return '';
  if (!isValidYearMonth(dateString)) return DATE_FORMAT_ERROR_YEAR_MONTH;
  
  const [year, month] = dateString.split('.').map(Number);
  const date = new Date(year, month - 1, 1);
  const today = getToday();
  const todayYearMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  if (date > todayYearMonth) return options.futureError || DATE_FUTURE_ERROR;
  return '';
};

const validateYearMonthDates = (startDate, endDate, errorMessages = {}) => {
  const errors = { startDate: '', endDate: '' };
  const formatError = errorMessages.formatError || DATE_FORMAT_ERROR_YEAR_MONTH;
  
  if (startDate) {
    errors.startDate = validateYearMonthRange(startDate, {
      futureError: START_DATE_FUTURE_ERROR
    });
  }
  
  if (endDate) {
    const endDateError = validateYearMonthRange(endDate, {
      futureError: END_DATE_FUTURE_ERROR
    });
    if (endDateError) {
      errors.endDate = endDateError === DATE_FORMAT_ERROR_YEAR_MONTH ? formatError : endDateError;
    } else if (startDate && isValidYearMonth(startDate) && isValidYearMonth(endDate)) {
      const [startYear, startMonth] = startDate.split('.').map(Number);
      const [endYear, endMonth] = endDate.split('.').map(Number);
      const startDateObj = new Date(startYear, startMonth - 1, 1);
      const endDateObj = new Date(endYear, endMonth - 1, 1);
      if (endDateObj < startDateObj) {
        errors.endDate = END_DATE_BEFORE_START_ERROR;
      }
    }
  }
  
  return errors;
};

const validateEducationDates = (startDate, endDate) => 
  validateYearMonthDates(startDate, endDate, {
    formatError: DATE_FORMAT_ERROR_EDUCATION
  });

const validateExperienceDates = (startDate, endDate) => {
  const errors = { startDate: '', endDate: '' };
  
  if (startDate) {
    errors.startDate = validateDateRange(startDate, {
      futureError: START_DATE_FUTURE_ERROR
    });
  }
  
  if (endDate) {
    const endDateError = validateDateRange(endDate, {
      futureError: END_DATE_FUTURE_ERROR
    });
    if (endDateError) {
      errors.endDate = endDateError;
    } else if (startDate && isValidDate(startDate) && isValidDate(endDate)) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end < start) {
        errors.endDate = END_DATE_BEFORE_START_ERROR;
      }
    }
  }
  
  return errors;
};

const validateTrainingDates = (startDate, endDate) => 
  validateYearMonthDates(startDate, endDate, {
    formatError: DATE_FORMAT_ERROR_TRAINING
  });

const validateCertificateDate = (dateString) => {
  return validateDateRange(dateString, {
    futureError: CERTIFICATE_DATE_FUTURE_ERROR
  });
};

const COVER_LETTER_SECTIONS = [
  { key: 'growthProcess', label: '성장과정' },
  { key: 'strengthsWeaknesses', label: '성격의 장단점' },
  { key: 'academicLife', label: '학업생활' },
  { key: 'motivation', label: '지원동기와 입사 후 포부' },
];

const DATE_FIELDS = ['startDate', 'endDate', 'date'];
const DATE_RANGE_FIELDS = ['startDate', 'endDate'];
const YEAR_MONTH_SECTIONS = ['educations', 'trainings'];
const DATE_VALIDATORS = {
  educations: validateEducationDates,
  trainings: validateTrainingDates,
  experiences: validateExperienceDates
};
const ARRAY_FIELDS = ['educations', 'experiences', 'trainings', 'certificates'];

const loadFromStorage = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return { formData: defaultFormData, photoPreview: null };
    
    const parsed = JSON.parse(saved);
    const mergedData = {
      ...defaultFormData,
      ...parsed,
      photo: null,
      ...ARRAY_FIELDS.reduce((acc, field) => ({
        ...acc,
        [field]: parsed[field] || defaultFormData[field]
      }), {})
    };
    return { formData: mergedData, photoPreview: parsed.photoBase64 || null };
  } catch (error) {
    console.error('저장된 데이터 불러오기 실패:', error);
    return { formData: defaultFormData, photoPreview: null };
  }
};

const saveToStorage = (formData, photoPreview) => {
  try {
    const dataToSave = {
      ...formData,
      photo: null,
      photoBase64: photoPreview,
    };
    const dataString = JSON.stringify(dataToSave);
    localStorage.setItem(STORAGE_KEY, dataString);
    return { success: true };
  } catch (error) {
    console.error('저장 중 오류:', error);
    if (error.name === 'QuotaExceededError') {
      return { success: false, error: STORAGE_QUOTA_ERROR };
    }
    return { success: false, error: SAVE_ERROR_MESSAGE };
  }
};

const Resume = () => {
  const [formData, setFormData] = useState(defaultFormData);
  const [emailError, setEmailError] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [birthDateError, setBirthDateError] = useState('');
  const [educationErrors, setEducationErrors] = useState({});
  const [experienceErrors, setExperienceErrors] = useState({});
  const [trainingErrors, setTrainingErrors] = useState({});
  const [certificateErrors, setCertificateErrors] = useState({});
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentSection, setCurrentSection] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [activeTab, setActiveTab] = useState('resume');

  useEffect(() => {
    const { formData: savedData, photoPreview: savedPreview } = loadFromStorage();
    setFormData(savedData);
    setPhotoPreview(savedPreview);
  }, []);

  const errorSetters = useMemo(() => ({
    educations: setEducationErrors,
    trainings: setTrainingErrors,
    experiences: setExperienceErrors,
    certificates: setCertificateErrors
  }), []);

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
    const isDateField = DATE_FIELDS.includes(field);
    const isYearMonthFormat = YEAR_MONTH_SECTIONS.includes(section) && DATE_RANGE_FIELDS.includes(field);
    const formattedValue = isDateField 
      ? (isYearMonthFormat ? formatDateYearMonth(value) : formatDate(value))
      : value;
    
    setFormData(prev => {
      const updatedSection = prev[section].map((item, i) =>
        i === index ? { ...item, [field]: formattedValue } : item
      );
      
      if (DATE_RANGE_FIELDS.includes(field)) {
        const item = updatedSection[index];
        const validator = DATE_VALIDATORS[section];
        const setError = errorSetters[section];
        
        if (validator && setError) {
          const errors = validator(item.startDate, item.endDate);
          setError(prevErrors => ({ ...prevErrors, [index]: errors }));
        }
      } else if (section === 'certificates' && field === 'date') {
        const error = validateCertificateDate(formattedValue);
        setCertificateErrors(prevErrors => ({ ...prevErrors, [index]: { date: error } }));
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
    
    const setError = errorSetters[section];
    if (setError) {
      setError(prevErrors => {
        const reindexed = {};
        Object.entries(prevErrors).forEach(([key, value]) => {
          const oldIndex = parseInt(key);
          if (oldIndex < index) {
            reindexed[oldIndex] = value;
          } else if (oldIndex > index) {
            reindexed[oldIndex - 1] = value;
          }
        });
        return reindexed;
      });
    }
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, email: value }));
    setEmailError(value && !validateEmail(value) 
      ? EMAIL_FORMAT_ERROR 
      : '');
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > MAX_FILE_SIZE) {
      alert(FILE_SIZE_ERROR);
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      alert(FILE_TYPE_ERROR);
      return;
    }
    
    setFormData(prev => ({ ...prev, photo: file }));
    
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result);
    reader.onerror = () => {
      alert(FILE_READ_ERROR);
      setFormData(prev => ({ ...prev, photo: null }));
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoRemove = () => {
    setFormData(prev => ({ ...prev, photo: null }));
    setPhotoPreview(null);
  };

  const errorMessage = useMemo(() => {
    if (!formData.name.trim()) return NAME_REQUIRED_ERROR;
    if (!formData.email.trim()) return EMAIL_REQUIRED_ERROR;
    if (!formData.birthDate.trim()) return BIRTH_DATE_REQUIRED_ERROR;
    if (emailError || (formData.email && !validateEmail(formData.email))) {
      return emailError || EMAIL_FORMAT_ERROR;
    }
    if (formData.birthDate && birthDateError) return birthDateError;
    
    const hasSectionData = (item, fields) => fields.some(field => item[field]?.trim());
    
    const findError = (items, errors, fields, name) => {
      const index = items.findIndex((item, i) => 
        hasSectionData(item, fields) && Object.values(errors[i] || {}).some(e => e)
      );
      if (index !== -1) {
        const error = Object.values(errors[index] || {}).find(e => e) || '';
        return error ? `${name} ${index + 1}번 항목: ${error}` : null;
      }
      return null;
    };
    
    return findError(formData.educations, educationErrors, ['school', 'major', 'startDate', 'endDate'], '학력') ||
           findError(formData.experiences, experienceErrors, ['company', 'position', 'startDate', 'endDate', 'description'], '경력') ||
           findError(formData.trainings, trainingErrors, ['startDate', 'endDate', 'content', 'institution'], '교육사항') ||
           findError(formData.certificates, certificateErrors, ['name', 'issuer', 'date'], '자격증') ||
           null;
  }, [formData, emailError, birthDateError, educationErrors, experienceErrors, trainingErrors, certificateErrors]);

  const clearAllErrors = () => {
    setEmailError('');
    setBirthDateError('');
    setEducationErrors({});
    setExperienceErrors({});
    setTrainingErrors({});
    setCertificateErrors({});
  };

  const clearAllData = () => {
    if (window.confirm(DELETE_CONFIRM_MESSAGE)) {
      setFormData(defaultFormData);
      setPhotoPreview(null);
      clearAllErrors();
      setFeedbackText('');
      localStorage.removeItem(STORAGE_KEY);
      alert(DELETE_SUCCESS_MESSAGE);
    }
  };

  const saveResume = () => {
    if (errorMessage) {
      alert(errorMessage);
      return;
    }
    const result = saveToStorage(formData, photoPreview);
    if (result.success) {
      alert(SAVE_SUCCESS_MESSAGE);
    } else {
      alert(result.error || SAVE_ERROR_MESSAGE);
    }
  };

  const performAnalysis = async (apiCall, sectionKey) => {
    setIsAnalyzing(true);
    setCurrentSection(sectionKey);
    setFeedbackText('');
    
    try {
      const response = await apiCall();
      setFeedbackText(response.data.feedback);
    } catch (error) {
      alert(error.response?.data?.error || error.message || AI_ANALYSIS_ERROR);
      setFeedbackText('');
    } finally {
      setIsAnalyzing(false);
      setCurrentSection('');
    }
  };

  const handleAnalyze = async (section) => {
    const content = formData[section];
    if (!content || !content.trim()) {
      alert(NO_CONTENT_ERROR);
      return;
    }
    
    await performAnalysis(
      () => resumeAPI.analyzeSection(section, content),
      section
    );
  };

  const handleAnalyzeFull = async () => {
    if (errorMessage) {
      alert(errorMessage);
      return;
    }
    
    await performAnalysis(
      () => {
        const { photo, ...resumeData } = formData;
        return resumeAPI.analyzeFull(resumeData);
      },
      'full'
    );
  };

  const handleDownloadFeedback = () => {
    if (!feedbackText || !feedbackText.trim()) {
      alert(NO_FEEDBACK_ERROR);
      return;
    }

    const blob = new Blob([feedbackText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const fileName = `AI_피드백_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.txt`;
    
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="resume">
      <div className="resume-container">
        <div className="resume-tabs">
          <button
            type="button"
            className={`tab-button ${activeTab === 'resume' ? 'active' : ''}`}
            onClick={() => setActiveTab('resume')}
          >
            이력서
          </button>
          <button
            type="button"
            className={`tab-button ${activeTab === 'coverLetter' ? 'active' : ''}`}
            onClick={() => setActiveTab('coverLetter')}
          >
            자기소개서
          </button>
        </div>

        {activeTab === 'resume' && (
          <>
            <div className="resume-full-analysis-header">
              <button
                type="button"
                className="analyze-full-button"
                onClick={handleAnalyzeFull}
                disabled={isAnalyzing}
              >
                {isAnalyzing && currentSection === 'full' ? '분석 중...' : '이력서 전체 분석'}
              </button>
              <p className="analyze-full-description">
                이력서 전체를 분석하여 면접 예상 질문과 대응 전략을 제공합니다.
              </p>
            </div>

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
                        <span>+사진</span>
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
                    name="applicationField"
                    value={formData.applicationField}
                    onChange={handleInputChange}
                    placeholder="지원분야"
                  />
                </div>
                <div className="form-group">
                  <input
                    className="resume-input"
                    name="portfolio"
                    value={formData.portfolio}
                    onChange={handleInputChange}
                    placeholder="포트폴리오 URL"
                  />
                </div>
              </div>
            </section>

            <section className="resume-section education">
              <div className="section-header">
                <h2 className="section-title">학력</h2>
                <button
                  type="button"
                  className="add-button"
                  onClick={() => addItem('educations', { 
                    school: '', 
                    major: '', 
                    startDate: '', 
                    endDate: '', 
                    graduationStatus: '', 
                    location: '' 
                  })}
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
                      className={`resume-input ${educationErrors[index]?.startDate ? 'error' : ''}`}
                      type="text"
                      value={education.startDate}
                      onChange={(e) => handleArrayChange('educations', index, 'startDate', e.target.value)}
                      placeholder="재학기간 시작 (예: 2011.03)"
                    />
                    {educationErrors[index]?.startDate && (
                      <span className="error-message">{educationErrors[index].startDate}</span>
                    )}
                  </div>
                  <div className="form-group">
                    <input
                      className={`resume-input ${educationErrors[index]?.endDate ? 'error' : ''}`}
                      type="text"
                      value={education.endDate}
                      onChange={(e) => handleArrayChange('educations', index, 'endDate', e.target.value)}
                      placeholder="재학기간 종료 (예: 2014.02)"
                    />
                    {educationErrors[index]?.endDate && (
                      <span className="error-message">{educationErrors[index].endDate}</span>
                    )}
                  </div>
                  <div className="form-group">
                    <input
                      className="resume-input"
                      value={education.graduationStatus}
                      onChange={(e) => handleArrayChange('educations', index, 'graduationStatus', e.target.value)}
                      placeholder="졸업구분 (예: 졸업)"
                    />
                  </div>
                  <div className="form-group">
                    <input
                      className="resume-input"
                      value={education.location}
                      onChange={(e) => handleArrayChange('educations', index, 'location', e.target.value)}
                      placeholder="소재지"
                    />
                  </div>
                  {formData.educations.length > 1 && (
                    <button
                      type="button"
                      className="remove-button"
                      onClick={() => removeItem('educations', index)}
                      title="삭제"
                    >
                      −
                    </button>
                  )}
                </div>
              ))}
            </section>

            <section className="resume-section experience">
              <div className="section-header">
                <h2 className="section-title">경력</h2>
                <button
                  type="button"
                  className="add-button"
                  onClick={() => addItem('experiences', { 
                    company: '', 
                    position: '', 
                    rank: '', 
                    startDate: '', 
                    endDate: '', 
                    description: '' 
                  })}
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
                      value={experience.rank}
                      onChange={(e) => handleArrayChange('experiences', index, 'rank', e.target.value)}
                      placeholder="직급 (예: 사원, 주임, 대리 등)"
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
                    <input
                      className="resume-input"
                      type="text"
                      value={experience.description}
                      onChange={(e) => handleArrayChange('experiences', index, 'description', e.target.value)}
                      placeholder="담당업무 및 성과"
                    />
                  </div>
                  {formData.experiences.length > 1 && (
                    <button
                      type="button"
                      className="remove-button"
                      onClick={() => removeItem('experiences', index)}
                      title="삭제"
                    >
                      −
                    </button>
                  )}
                </div>
              ))}
            </section>

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
                      title="삭제"
                    >
                      −
                    </button>
                  )}
                </div>
              ))}
            </section>

            <section className="resume-section training">
              <div className="section-header">
                <h2 className="section-title">교육사항</h2>
                <button
                  type="button"
                  className="add-button"
                  onClick={() => addItem('trainings', { 
                    startDate: '', 
                    endDate: '', 
                    content: '', 
                    institution: '' 
                  })}
                >
                  + 추가
                </button>
              </div>
              {formData.trainings.map((training, index) => (
                <div key={index} className="training-item">
                  <div className="form-group">
                    <input
                      className={`resume-input ${trainingErrors[index]?.startDate ? 'error' : ''}`}
                      type="text"
                      value={training.startDate}
                      onChange={(e) => handleArrayChange('trainings', index, 'startDate', e.target.value)}
                      placeholder="교육기간 시작 (예: 2025.06)"
                    />
                    {trainingErrors[index]?.startDate && (
                      <span className="error-message">{trainingErrors[index].startDate}</span>
                    )}
                  </div>
                  <div className="form-group">
                    <input
                      className={`resume-input ${trainingErrors[index]?.endDate ? 'error' : ''}`}
                      type="text"
                      value={training.endDate}
                      onChange={(e) => handleArrayChange('trainings', index, 'endDate', e.target.value)}
                      placeholder="교육기간 종료 (예: 2025.12)"
                    />
                    {trainingErrors[index]?.endDate && (
                      <span className="error-message">{trainingErrors[index].endDate}</span>
                    )}
                  </div>
                  <div className="form-group">
                    <input
                      className="resume-input"
                      value={training.content}
                      onChange={(e) => handleArrayChange('trainings', index, 'content', e.target.value)}
                      placeholder="교육내용"
                    />
                  </div>
                  <div className="form-group">
                    <input
                      className="resume-input"
                      value={training.institution}
                      onChange={(e) => handleArrayChange('trainings', index, 'institution', e.target.value)}
                      placeholder="교육기관"
                    />
                  </div>
                  {formData.trainings.length > 1 && (
                    <button
                      type="button"
                      className="remove-button"
                      onClick={() => removeItem('trainings', index)}
                      title="삭제"
                    >
                      −
                    </button>
                  )}
                </div>
              ))}
            </section>
          </>
        )}

        {activeTab === 'coverLetter' && (
          <section className="resume-section cover-letter">
            <h2 className="section-title">자기소개서</h2>
            
            {COVER_LETTER_SECTIONS.map(({ key, label }) => (
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
                  rows={8}
                  maxLength={MAX_TEXT_LENGTH}
                />
                <div className="character-count">{formData[key].length}/{MAX_TEXT_LENGTH}</div>
              </div>
            ))}
          </section>
        )}

        <div className="resume-actions">
          <button
            type="button"
            className="save-button"
            onClick={saveResume}
            disabled={!!errorMessage}
          >
            저장
          </button>
          <button
            type="button"
            className="clear-button"
            onClick={clearAllData}
          >
            모두 지우기
          </button>
          {errorMessage && (
            <div className="validation-error-message">
              {errorMessage}
            </div>
          )}
        </div>
      </div>
      
      <div className={`feedback-panel ${isPanelOpen ? 'open' : 'closed'}`}>
        <button 
          type="button"
          className="panel-toggle"
          onClick={() => setIsPanelOpen(prev => !prev)}
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
            {feedbackText && (
              <div className="feedback-actions">
                <button
                  type="button"
                  className="download-feedback-button"
                  onClick={handleDownloadFeedback}
                >
                  피드백 저장 (TXT)
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Resume;
