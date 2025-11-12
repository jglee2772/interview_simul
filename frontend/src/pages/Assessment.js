/**
 * 페이지: 인적성검사 페이지
 * 역할: 인적성검사 질문/답변 UI 및 로직 + 사이드바 연동
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import assessmentAPI from '../services/assessmentAPI';
import './Assessment.css';
import AnswerAsidebar from './AnswerAsidebar';

const Assessment = () => {
  const navigate = useNavigate();

  // -------------------- 상태 관리 --------------------
  const [name, setName] = useState('');
  const [assessmentId, setAssessmentId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [showSidebar, setShowSidebar] = useState(true); // 기본 표시

  const toggleSidebar = () => setShowSidebar((prev) => !prev);

  // -------------------- 상수 정의 --------------------
  const questionsPerPage = 4;
  const totalPages = Math.ceil(questions.length / questionsPerPage);
  const startIndex = currentPage * questionsPerPage;
  const endIndex = startIndex + questionsPerPage;
  const pagedQuestions = questions.slice(startIndex, endIndex);

  // -------------------- 진행률 계산 --------------------
  const progress =
    (answers.filter((a) => a !== null).length / questions.length) * 100;

  const getProgressColor = (progress) => {
    if (progress < 50) return '#e74c3c'; // 빨강
    if (progress < 80) return '#f1c40f'; // 노랑
    return '#2ecc71'; // 초록
  };

  // -------------------- 검사 시작 --------------------
  const startAssessment = async () => {
    if (!name.trim()) {
      setError('이름을 입력해 주세요.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await assessmentAPI.startAssessment({ name });
      const { assessment, questions } = res.data;
      setAssessmentId(assessment.id);
      setQuestions(questions);
      setAnswers(new Array(questions.length).fill(null));
    } catch (e) {
      console.error(e);
      setError('인적성검사를 시작하는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // -------------------- 답변 선택 --------------------
  const handleAnswer = (index, value) => {
    const updated = [...answers];
    updated[index] = value;
    setAnswers(updated);
  };

  // -------------------- 결과 제출 --------------------
  const submitAssessment = async () => {
    if (answers.some((v) => v === null)) {
      setError('모든 문항에 답변을 완료해 주세요.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const res = await assessmentAPI.submitAnswer(assessmentId, answers);
      const payload = res.data;
      const resultData = payload.result || payload;

      navigate(`/assessment-result/${assessmentId}`, {
        state: { name, result: resultData },
      });
    } catch (e) {
      console.error(e);
      setError('답변 제출 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // -------------------- 1) 이름 입력 화면 --------------------
  if (!assessmentId) {
    return (
      <div className="assessment">
        <div className="assessment-container">
          <h1>인적성 검사 시작</h1>
          <div>
            <label htmlFor="name">이름</label>
            <input
              id="name"
              type="text"
              placeholder="테스트용 이름 입력 창"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {error && <p className="error-text">{error}</p>}

          <button onClick={startAssessment} disabled={loading}>
            {loading ? '준비 중...' : '검사 시작하기'}
          </button>
        </div>
      </div>
    );
  }

  // -------------------- 2) 검사 진행 화면 --------------------
  return (
    <div className="assessment-layout">
        {/* ---- 오른쪽 사이드바 ---- */}
        <AnswerAsidebar
          show={showSidebar}
          toggleSidebar={toggleSidebar}
          questions={questions}
          answers={answers}
          onSelectQuestion={(index) => {
            const targetPage = Math.floor(index / questionsPerPage);
            setCurrentPage(targetPage);
          }}
        />
    <div className="assessment-page">
      {/* 메인 컨테이너와 사이드바 나란히 배치 */}
      
      
        {/* ---- 검사 본문 ---- */}
        <div className="assessment-container">
          <h1>인적성 검사</h1>
        
          <p>
            <strong>{name}</strong> 님, 총 {questions.length}문항 중{' '}
            {answers.filter((a) => a !== null).length}문항을 완료했습니다.
          </p>
          
          {/* 진행률 바 */}
          <div className="progress-bar-container">
            <div
              className="progress-bar"
              style={{
                width: `${progress}%`,
                backgroundColor: getProgressColor(progress),
                transition: 'width 0.4s ease, background-color 0.4s ease',
              }}
            />
          </div>
              
          {/* 현재 페이지 문항 */}
          <div className="question-list">
            {pagedQuestions.map((q, index) => {
              const globalIndex = startIndex + index;
              return (
                <div
                  key={q.id || globalIndex}
                  className={`question-item ${
                    answers[globalIndex] ? 'answered' : 'unanswered'
                  }`}
                >
                  <p className="question-text">
                    {q.number}. {q.text}
                  </p>
                  <div className="answer-options">
                    {['전혀 아니다', '아니다', '보통이다', '그렇다', '매우 그렇다'].map(
                      (label, i) => {
                        const value = i + 1;
                        return (
                          <button
                            key={value}
                            type="button"
                            className={`scale-button ${
                              answers[globalIndex] === value ? 'selected' : ''
                            }`}
                            onClick={() => handleAnswer(globalIndex, value)}
                          >
                            {label}
                            
                          </button>
                        );
                        
                      }
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {error && <p className="error-text">{error}</p>}
  
          {/* 페이지 네비게이션 */}
          <div className="navigation">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
              disabled={currentPage === 0}
            >
              이전
            </button>

            <span>
              페이지 {currentPage + 1} / {totalPages}
            </span>

            {currentPage === totalPages - 1 ? (
              <button
                onClick={submitAssessment}
                disabled={!answers.every((v) => v !== null) || loading}
              >
                검사 제출하기
              </button>
            ) : (
              <button
                onClick={() =>
                  setCurrentPage((prev) =>
                    Math.min(prev + 1, totalPages - 1)
                  )
                }
              >
                다음
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
    
  );
};

export default Assessment;
