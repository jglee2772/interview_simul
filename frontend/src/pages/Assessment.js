/**
 * 페이지: 인적성검사 페이지
 * 역할: 인적성검사 질문/답변 UI 및 로직 + 사이드바 연동
 */

import React, { useState, useEffect } from 'react';
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
  const [loading, setLoading] = useState(false);     // 🔥 반드시 필요!
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [showSidebar, setShowSidebar] = useState(true);

  // 진행률 별도 관리
  const [progress, setProgress] = useState(0);

  const questionsPerPage = 4;
  const totalPages = Math.ceil(questions.length / questionsPerPage);
  const startIndex = currentPage * questionsPerPage;
  const endIndex = startIndex + questionsPerPage;
  const pagedQuestions = questions.slice(startIndex, endIndex);

  // -------------------- 진행률 계산 --------------------
  useEffect(() => {
    if (!questions.length) {
      setProgress(0);
      return;
    }

    const answered = answers.filter((a) => a !== null).length;
    const percent = Math.round((answered / questions.length) * 100);
    setProgress(percent);
  }, [answers, questions]);

  const getProgressColor = (value) => {
    if (value < 50) return '#e74c3c';
    if (value < 80) return '#f1c40f';
    return '#2ecc71';
  };

  // -------------------- 로딩창 (가장 위에서 return) --------------------
  if (loading) {
    return (
      <div className="assessment-loading-overlay">
        <div className="loading-spinner"></div>
        <p>결과를 불러오고 있습니다…</p>
      </div>
    );
  }

  // -------------------- 검사 시작 --------------------
  const startAssessment = async () => {
    if (!name.trim()) {
      setError('이름을 입력해 주세요.');
      return;
    }

    try {
      setLoading(true);
      const res = await assessmentAPI.startAssessment({ name });

      const { assessment, questions } = res.data;
      setAssessmentId(assessment.id);
      setQuestions(questions);
      setAnswers(new Array(questions.length).fill(null));
      setCurrentPage(0);
    } catch (e) {
      setError('인적성검사를 시작하는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // -------------------- 답변 선택 --------------------
  const handleAnswer = (index, value) => {
    setAnswers((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  // -------------------- 결과 제출 --------------------
  const submitAssessment = async () => {
    if (answers.some((v) => v === null)) {
      setError('모든 문항에 답변을 완료해 주세요.');
      return;
    }

    try {
      setLoading(true);

      const res = await assessmentAPI.submitAnswer(assessmentId, answers);
      const payload = res.data;

      navigate(`/assessment-result/${assessmentId}`, {
        state: {
          name,
          result: payload.result || payload,
          analysis: payload.analysis ?? null,
        },
      });
    } catch (e) {
      setError('답변 제출 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  // -------------------- 이름 입력 화면 --------------------
  if (!assessmentId) {
    return (
      <div className="assessment-start-wrapper">
        <div className="assessment-start-container">
          <h1>인적성 검사 시작</h1>

          <label htmlFor="name">이름</label>
          <input
            id="name"
            type="text"
            value={name}
            placeholder="이름 입력"
            onChange={(e) => setName(e.target.value)}
          />

          {error && <p className="error-text">{error}</p>}

          <button onClick={startAssessment}>검사 시작하기</button>
        </div>
      </div>
    );
  }

  // -------------------- 검사 진행 화면 --------------------
  return (
    <div className="assessment-wrapper">
      <div className="assessment-layout">
        <AnswerAsidebar
          show={showSidebar}
          toggleSidebar={() => setShowSidebar((p) => !p)}
          questions={questions}
          answers={answers}
          onSelectQuestion={(index) => {
            const p = Math.floor(index / questionsPerPage);
            setCurrentPage(p);
          }}
        />

        <div className="assessment-page">
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
                }}
              ></div>
            </div>

            {/* 질문 */}
            <div className="question-list">
              {pagedQuestions.map((q, idx) => {
                const globalIndex = startIndex + idx;
                return (
                  <div key={q.id || globalIndex} className="question-item">
                    <p className="question-text">
                      {q.number}. {q.text}
                    </p>

                    <div className="scale-row">
                      <span className="scale-label">전혀 아니다</span>

                      <div className="answer-options">
                        {[1, 2, 3, 4, 5].map((value) => (
                          <button
                            key={value}
                            type="button"
                            className={`scale-button ${
                              answers[globalIndex] === value ? 'selected' : ''
                            }`}
                            onClick={() => handleAnswer(globalIndex, value)}
                          />
                        ))}
                      </div>

                      <span className="scale-label">매우 그렇다</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {error && <p className="error-text">{error}</p>}

            {/* 페이지 네비 */}
            <div className="navigation">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 0))}
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
                  disabled={answers.some((v) => v === null)}
                >
                  검사 제출하기
                </button>
              ) : (
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages - 1))
                  }
                >
                  다음
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Assessment;
