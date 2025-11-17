/**
 * 페이지: 인적성검사 페이지
 * 역할: 인적성검사 질문/답변 UI 및 사이드바 연동
 */

import React, { useState, useEffect, useRef } from 'react';
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
  const [showSidebar, setShowSidebar] = useState(true);
  const [progress, setProgress] = useState(0);
  const hasCheckedName = useRef(false);

  const questionsPerPage = 4;
  const totalPages = Math.ceil(questions.length / questionsPerPage);
  const startIndex = currentPage * questionsPerPage;
  const endIndex = startIndex + questionsPerPage;
  const pagedQuestions = questions.slice(startIndex, endIndex);

  // -------------------- 페이지 로드 시 이름 확인 --------------------
  useEffect(() => {
    // 이미 실행되었으면 중복 실행 방지
    if (hasCheckedName.current) return;
    hasCheckedName.current = true;

    const savedData = localStorage.getItem('resumeData');
    const savedName = savedData ? JSON.parse(savedData).name : '';

    if (!savedName) {
      alert("인적사항이 입력되지 않았습니다. 먼저 홈에서 이름을 작성해주세요!");
      navigate('/'); // 홈으로 이동
      return;
    }

    setName(savedName);
  }, [navigate]);

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

  // -------------------- 검사 시작 --------------------
  const startAssessment = async (inputName) => {
    const userName = inputName || name;
    if (!userName) {
      setError("이름을 입력해주세요!");
      return;
    }

    try {
      setLoading(true);
      const res = await assessmentAPI.startAssessment({ name: userName });
      const { assessment, questions } = res.data;
      setAssessmentId(assessment.id);
      setQuestions(questions);
      setAnswers(new Array(questions.length).fill(null));
      setCurrentPage(0);
      setError('');
    } catch (e) {
      setError("인적성검사 시작 중 오류가 발생했습니다.");
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

  // -------------------- 로딩창 --------------------
  if (loading) {
    return (
      <div className="assessment-loading-overlay">
        <div className="loading-spinner"></div>
        <p>결과를 불러오고 있습니다…</p>
      </div>
    );
  }

  // -------------------- 이름 입력 화면 --------------------
if (!assessmentId) {
  return (
    <div className="assessment-start-wrapper">
      <div className="assessment-start-container">
        <h1>인적성 검사 안내</h1>

        <p>이 검사는 참고용입니다. <br />
          실제 검사와는 많은 차이가 있습니다</p>

        {/* 이름 입력창은 홈에서 가져오기 때문에 주석 처리 */}
        {/* <label htmlFor="name"></label>
        <input
          id="name"
          type="text"
          value={name}
          placeholder="이름 입력"
          onChange={(e) => setName(e.target.value)}
        /> */}

        {error && <p className="error-text">{error}</p>}

        <button onClick={() => startAssessment()} disabled={loading}>
          {loading ? "로딩 중..." : "동의하고 검사 시작"}
        </button>
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

            <div className="progress-bar-container">
              <div
                className="progress-bar"
                style={{
                  width: `${progress}%`,
                  backgroundColor: getProgressColor(progress),
                }}
              ></div>
            </div>

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
