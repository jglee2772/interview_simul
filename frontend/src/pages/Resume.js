/**
 * Resume.js - 이력서 작성 페이지 (UI 디자인 수정)
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom'; // 네비게이션을 위해 추가
import './Resume.css';
import resumeAPI from '../services/resumeAPI';

const STORAGE_KEY = 'resumeData';
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_TEXT_LENGTH = 500;

// ... (기존 defaultFormData 및 헬퍼 함수들 - formatPhoneNumber, formatDate 등은 그대로 둡니다) ...
// (코드 길이 절약을 위해 상단 헬퍼 함수 부분은 생략하지 않고 그대로 사용하시면 됩니다.
//  아래 컴포넌트 내부에서 기존 로직을 모두 포함하고 있습니다.)

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

// ... (여기에 기존 formatPhoneNumber, formatDate, isValidDate 등 헬퍼 함수들을 모두 포함해주세요) ...
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

// ... (상수 및 유효성 검사 함수들 계속) ...
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

const sanitizeFileName = (name) => {
  return name.replace(/[<>:"/\\|?*]/g, '_').trim() || '이름';
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
    };
    ARRAY_FIELDS.forEach(field => {
      if (!parsed[field] || !Array.isArray(parsed[field])) {
        mergedData[field] = defaultFormData[field];
      }
    });
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
  const navigate = useNavigate(); // 네비게이션 사용
  const [formData, setFormData] = useState(defaultFormData);
  const [emailError, setEmailError] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [birthDateError, setBirthDateError] = useState('');
  const [educationErrors, setEducationErrors] = useState({});
  const [experienceErrors, setExperienceErrors] = useState({});
  const [trainingErrors, setTrainingErrors] = useState({});
  const [certificateErrors, setCertificateErrors] = useState({});
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentSection, setCurrentSection] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [activeTab, setActiveTab] = useState('resume');
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('error');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const toastTimerRef = useRef(null);
  const fileReaderRef = useRef(null);

  // ... (기존 Hooks 및 핸들러 함수들 모두 그대로 유지) ...
  useEffect(() => {
    const { formData: savedData, photoPreview: savedPreview } = loadFromStorage();
    setFormData(savedData);
    setPhotoPreview(savedPreview);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
      if (fileReaderRef.current) {
        fileReaderRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    if (showDeleteConfirm) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showDeleteConfirm]);

  const showToast = (message, type = 'error') => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToastMessage(message);
    setToastType(type);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage('');
      toastTimerRef.current = null;
    }, 4000);
  };

  const downloadFile = (content, fileName, mimeType, successMessage) => {
    let url = null;
    let link = null;
    try {
      const blob = new Blob([content], { type: mimeType });
      url = URL.createObjectURL(blob);
      link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      if (successMessage) {
        showToast(successMessage, 'success');
      }
    } catch (error) {
      console.error('파일 다운로드 실패:', error);
      showToast('파일 다운로드 중 오류가 발생했습니다.', 'error');
    } finally {
      if (link && link.parentNode) {
        document.body.removeChild(link);
      }
      if (url) {
        URL.revokeObjectURL(url);
      }
    }
  };

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
    const isDateRangeField = DATE_RANGE_FIELDS.includes(field);
    const isYearMonthFormat = YEAR_MONTH_SECTIONS.includes(section) && isDateRangeField;
    const formattedValue = isDateField 
      ? (isYearMonthFormat ? formatDateYearMonth(value) : formatDate(value))
      : value;
    
    setFormData(prev => {
      const updatedSection = prev[section].map((item, i) =>
        i === index ? { ...item, [field]: formattedValue } : item
      );
      if (isDateRangeField) {
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
        for (const [key, value] of Object.entries(prevErrors)) {
          const oldIndex = parseInt(key);
          if (oldIndex < index) {
            reindexed[oldIndex] = value;
          } else if (oldIndex > index) {
            reindexed[oldIndex - 1] = value;
          }
        }
        return reindexed;
      });
    }
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, email: value }));
    setEmailError(value && !validateEmail(value) ? EMAIL_FORMAT_ERROR : '');
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      showToast(FILE_SIZE_ERROR, 'error');
      e.target.value = '';
      return;
    }
    if (!file.type.startsWith('image/')) {
      showToast(FILE_TYPE_ERROR, 'error');
      e.target.value = '';
      return;
    }
    if (fileReaderRef.current) {
      fileReaderRef.current.abort();
    }
    setFormData(prev => ({ ...prev, photo: file }));
    const reader = new FileReader();
    fileReaderRef.current = reader;
    reader.onloadend = () => {
      if (fileReaderRef.current === reader) {
        setPhotoPreview(reader.result);
        fileReaderRef.current = null;
      }
      e.target.value = '';
    };
    reader.onerror = () => {
      if (fileReaderRef.current === reader) {
        showToast(FILE_READ_ERROR, 'error');
        setFormData(prev => ({ ...prev, photo: null }));
        fileReaderRef.current = null;
      }
      e.target.value = '';
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
      for (let i = 0; i < items.length; i++) {
        if (hasSectionData(items[i], fields)) {
          const itemErrors = Object.values(errors[i] || {});
          const error = itemErrors.find(e => e);
          if (error) {
            return `${name} ${i + 1}번 항목: ${error}`;
          }
        }
      }
      return null;
    };
    return findError(formData.educations, educationErrors, ['school', 'major', 'startDate', 'endDate'], '학력') ||
           findError(formData.experiences, experienceErrors, ['company', 'position', 'startDate', 'endDate', 'description'], '경력') ||
           findError(formData.trainings, trainingErrors, ['startDate', 'endDate', 'content', 'institution'], '교육사항') ||
           findError(formData.certificates, certificateErrors, ['name', 'issuer', 'date'], '자격증') ||
           null;
  }, [formData, emailError, birthDateError, educationErrors, experienceErrors, trainingErrors, certificateErrors]);

  const clearAllData = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    setFormData(defaultFormData);
    setPhotoPreview(null);
    setEmailError('');
    setBirthDateError('');
    setEducationErrors({});
    setExperienceErrors({});
    setTrainingErrors({});
    setCertificateErrors({});
    setFeedbackText('');
    localStorage.removeItem(STORAGE_KEY);
    setShowDeleteConfirm(false);
    showToast(DELETE_SUCCESS_MESSAGE, 'success');
  };

  const saveResume = () => {
    if (errorMessage) {
      showToast(errorMessage, 'error');
      return;
    }
    const result = saveToStorage(formData, photoPreview);
    if (result.success) {
      showToast(SAVE_SUCCESS_MESSAGE, 'success');
    } else {
      showToast(result.error || SAVE_ERROR_MESSAGE, 'error');
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
      showToast(error.response?.data?.error || error.message || AI_ANALYSIS_ERROR, 'error');
      setFeedbackText('');
    } finally {
      setIsAnalyzing(false);
      setCurrentSection('');
    }
  };

  const handleAnalyze = async (section) => {
    const content = formData[section];
    if (!content || !content.trim()) {
      showToast(NO_CONTENT_ERROR, 'error');
      return;
    }
    setIsPanelOpen(true);
    await performAnalysis(
      () => resumeAPI.analyzeSection(section, content),
      section
    );
  };

  const handleAnalyzeFull = async () => {
    if (errorMessage) {
      showToast(errorMessage, 'error');
      return;
    }
    setIsPanelOpen(true);
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
      showToast(NO_FEEDBACK_ERROR, 'error');
      return;
    }
    const fileName = `AI_피드백_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.txt`;
    downloadFile(feedbackText, fileName, 'text/plain;charset=utf-8', '피드백이 다운로드되었습니다.');
  };

  const generateResumeHTML = useCallback(() => {
    const escapeHtml = (text) => {
      if (!text) return '';
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    };
    // ... (HTML 생성 로직 그대로 유지) ...
    // 기존 generateResumeHTML 함수 내부 내용 전체 생략 없이 사용
    const formatItem = (date, details, description = '') => {
      if (!date && !details && !description) return '';
      const descriptionHtml = description ? `<div class="item-description">${escapeHtml(description)}</div>` : '';
      return `<div class="resume-item"><span class="item-date">${escapeHtml(date)}</span><span class="item-content">${escapeHtml(details)}</span>${descriptionHtml}</div>`;
    };

    const getDateRange = (startDate, endDate) => {
      if (startDate && endDate) return `${startDate} ~ ${endDate}`;
      return startDate || '';
    };

    const formatItems = (items, getDate, getDetails, getDescription = null, separator = ' | ') => {
      if (!items || !items.length === 0) return '';
      return items.map((item) => {
        const date = getDate(item);
        const details = getDetails(item).filter(Boolean).join(separator);
        const description = getDescription ? getDescription(item) : '';
        return formatItem(date, details, description);
      }).filter(Boolean).join('');
    };

    const formatEducation = (items) => formatItems(
      items,
      (item) => getDateRange(item.startDate, item.endDate),
      (item) => [item.school, item.major, item.graduationStatus, item.location && `(${item.location})`]
    );

    const formatExperience = (items) => formatItems(
      items,
      (item) => getDateRange(item.startDate, item.endDate),
      (item) => [item.company, item.position, item.rank && `(${item.rank})`],
      (item) => item.description || ''
    );

    const formatCertificate = (items) => formatItems(
      items,
      (item) => item.date || '',
      (item) => [item.name, item.issuer && `(${item.issuer})`],
      null,
      ' '
    );

    const formatTraining = (items) => formatItems(
      items,
      (item) => getDateRange(item.startDate, item.endDate),
      (item) => [item.content, item.institution && `(${item.institution})`]
    );

    const renderSection = (title, items, checkFn, formatFn) => {
      if (!items || !items.some(checkFn)) return '';
      return `<div class="section"><h2>${title}</h2>${formatFn(items)}</div>`;
    };

    const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>이력서 - ${escapeHtml(formData.name || '이름')}</title>
  <style>
    /* ... (기존 스타일 유지) ... */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Noto Sans KR', 'Malgun Gothic', sans-serif; 
      padding: 30px; 
      max-width: 210mm; 
      margin: 0 auto; 
      line-height: 1.6; 
      background: #fff;
      color: #333;
    }
    /* ... (생략된 스타일도 기존 코드 사용) ... */
    .header { text-align: center; margin-bottom: 30px; padding-bottom: 15px; border-bottom: 3px solid #5c4db8; }
    h1 { color: #5c4db8; font-size: 28px; margin-bottom: 10px; }
    .personal-section { display: flex; gap: 30px; margin-bottom: 25px; padding: 20px; background: #f9fafc; border-radius: 8px; }
    .photo-container { flex-shrink: 0; width: 120px; height: 150px; }
    .photo-container img { width: 100%; height: 100%; object-fit: cover; border: 2px solid #d0d8e3; border-radius: 4px; }
    .personal-info { flex: 1; display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px 20px; }
    .personal-info p { margin: 0; font-size: 14px; }
    .personal-info strong { display: inline-block; width: 75px; color: #5c4db8; }
    h2 { color: #5c4db8; font-size: 18px; font-weight: 700; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #a88cff; }
    h3 { color: #5c4db8; font-size: 16px; margin: 15px 0 8px 0; }
    .section { margin-bottom: 25px; page-break-inside: avoid; }
    .resume-item { display: flex; padding: 8px 0; margin-bottom: 4px; font-size: 14px; line-height: 1.7; gap: 20px; align-items: flex-start; }
    .item-date { flex-shrink: 0; min-width: 200px; width: 200px; color: #5c4db8; font-weight: 500; white-space: nowrap; }
    .item-content { flex: 1; color: #333; min-width: 0; }
    .item-description { margin-top: 6px; padding-left: 220px; font-size: 13px; color: #666; line-height: 1.6; }
    .cover-letter-section { margin-top: 20px; padding: 20px; background: #f9fafc; border-radius: 8px; }
    .cover-letter-section h3 { margin-top: 0; }
    .cover-letter-section p { white-space: pre-wrap; line-height: 1.8; margin: 10px 0; font-size: 13px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>이력서</h1>
  </div>
  
  <div class="personal-section">
    ${photoPreview ? `
    <div class="photo-container">
      <img src="${photoPreview}" alt="증명사진" />
    </div>
    ` : ''}
    <div class="personal-info">
      ${formData.name ? `<p><strong>이름</strong> ${escapeHtml(formData.name)}</p>` : ''}
      ${formData.gender ? `<p><strong>성별</strong> ${escapeHtml(formData.gender)}</p>` : ''}
      ${formData.birthDate ? `<p><strong>생년월일</strong> ${escapeHtml(formData.birthDate)}</p>` : ''}
      ${formData.phone ? `<p><strong>전화번호</strong> ${escapeHtml(formData.phone)}</p>` : ''}
      ${formData.email ? `<p><strong>이메일</strong> ${escapeHtml(formData.email)}</p>` : ''}
      ${formData.address ? `<p><strong>주소</strong> ${escapeHtml(formData.address)}</p>` : ''}
      ${formData.applicationField ? `<p><strong>지원분야</strong> ${escapeHtml(formData.applicationField)}</p>` : ''}
      ${formData.portfolio ? `<p style="grid-column: 1 / -1;"><strong>포트폴리오</strong> ${escapeHtml(formData.portfolio)}</p>` : ''}
    </div>
  </div>

  ${renderSection('학력', formData.educations, e => e.school || e.major, formatEducation)}
  ${renderSection('자격증', formData.certificates, c => c.name, formatCertificate)}
  ${renderSection('경력', formData.experiences, e => e.company || e.position, formatExperience)}
  ${renderSection('교육사항', formData.trainings, t => t.content || t.institution, formatTraining)}

  ${(formData.growthProcess || formData.strengthsWeaknesses || formData.academicLife || formData.motivation) ? `
  <div class="cover-letter-section">
    <h2>자기소개서</h2>
    ${formData.growthProcess ? `<div><h3>성장과정</h3><p>${escapeHtml(formData.growthProcess)}</p></div>` : ''}
    ${formData.strengthsWeaknesses ? `<div><h3>성격의 장단점</h3><p>${escapeHtml(formData.strengthsWeaknesses)}</p></div>` : ''}
    ${formData.academicLife ? `<div><h3>학업생활</h3><p>${escapeHtml(formData.academicLife)}</p></div>` : ''}
    ${formData.motivation ? `<div><h3>지원동기와 입사 후 포부</h3><p>${escapeHtml(formData.motivation)}</p></div>` : ''}
  </div>
  ` : ''}
</body>
</html>
    `;
    return html;
  }, [formData, photoPreview]);

  const handleDownloadPDF = () => {
    if (errorMessage) {
      showToast(errorMessage, 'error');
      return;
    }
    const html = generateResumeHTML();
    const sanitizedName = sanitizeFileName(formData.name);
    const fileName = `이력서_${sanitizedName}_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.html`;
    downloadFile(html, fileName, 'text/html;charset=utf-8', '이력서가 다운로드되었습니다. 브라우저에서 열어 인쇄하여 PDF로 저장하세요.');
  };

  return (
    <div className="resume-page">
      
      {/* 1. 상단 네비게이션 (헤더) */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-logo" onClick={() => navigate('/')}>
            Interview Master
          </div>
          <div className="nav-links">
            <div className="nav-item" onClick={() => navigate('/assessment')}>인적성 검사</div>
            <div className="nav-item" onClick={() => navigate('/interview')}>면접 연습</div>
            <div className="nav-item" onClick={() => navigate('/resume')}>이력서</div>
          </div>
        </div>
      </nav>

      {/* 2. 메인 컨텐츠 영역 */}
      <div className="page-body">
        
        {toastMessage && (
          <div className={`toast-message toast-${toastType}`}>
            {toastMessage}
          </div>
        )}

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
                      className={`resume-input ${emailError ? 'error' : ''}`}
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
              className="download-pdf-button"
              onClick={handleDownloadPDF}
              disabled={!!errorMessage}
            >
              PDF 다운로드
            </button>
            <button
              type="button"
              className="clear-button"
              onClick={clearAllData}
            >
              모두 지우기
            </button>
            {errorMessage && (
              <div className="validation-error-message" role="alert">
                {errorMessage.length > 100 ? `${errorMessage.substring(0, 100)}...` : errorMessage}
              </div>
            )}
          </div>
        </div>

        {showDeleteConfirm && (
          <div 
            className="modal-overlay" 
            onClick={() => setShowDeleteConfirm(false)}
          >
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>확인</h3>
              <p>{DELETE_CONFIRM_MESSAGE}</p>
              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-button modal-button-danger"
                  onClick={confirmDelete}
                >
                  삭제
                </button>
                <button
                  type="button"
                  className="modal-button modal-button-cancel"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}
        
        <div className={`feedback-panel ${isPanelOpen ? 'open' : 'closed'}`}>
          <button 
            type="button"
            className="panel-toggle"
            onClick={() => setIsPanelOpen(prev => !prev)}
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
                  <div className="feedback-text">
                    <ReactMarkdown>{feedbackText}</ReactMarkdown>
                  </div>
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
    </div>
  );
};

export default Resume;