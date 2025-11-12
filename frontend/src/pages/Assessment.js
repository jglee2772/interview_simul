/**
 * 페이지: 인적성검사 페이지
 * 역할: 인적성검사 질문/답변 UI 및 로직
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import assessmentAPI from '../services/assessmentAPI';
import './Assessment.css';

const Assessment = () => {
  const navigate = useNavigate();

  // 상태 관리
  const [name, setName] = useState('');
  const [assessmentId, setAssessmentId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(0);

  const questionsPerPage = 4; // 페이지당 문항 수
  const startIndex = currentPage * questionsPerPage;
  const endIndex = startIndex + questionsPerPage;
  const pagedQuestions = questions.slice(startIndex, endIndex);

  // 인적성검사 시작
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

  // 답변 선택
  const handleAnswer = (index, value) => {
    const updated = [...answers];
    updated[index] = value;
    setAnswers(updated);
  };

  // 결과 제출
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

  // 이름 입력 페이지
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

  // 검사 진행 중 화면
  if (assessmentId && questions.length > 0) {
    const totalPages = Math.ceil(questions.length / questionsPerPage);


    // 검사 진행율 계산  
    const progress =
    (answers.filter((a) => a !== null).length / questions.length) * 100;

    return (
      <div className="assessment">
        <div className="assessment-container">
          <h1>인적성 검사</h1>
          <p>
            
            <strong>{name}</strong> 님, 총 {questions.length}문항 중{' '}
            {answers.filter((a) => a !== null).length}문항을 완료했습니다.  
          </p>
            {/*진행률 바 표시 */}
          <div className="progress-bar-container">
          <div
            className="progress-bar"
            style={{ width: `${progress}%` }}
          />
        </div>
          
          {/* 현재 페이지의 문항만 표시 */}
          <div className="question-list">
            {pagedQuestions.map((q, index) => {
              const globalIndex = startIndex + index;
              return (
                <div
                  key={q.id || globalIndex}
                  className={`question-item ${answers[globalIndex] ? 'answered' : 'unanswered'}`}
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
                    prev < totalPages - 1 ? prev + 1 : prev
                  )
                }
              >
                다음
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 예외 처리
  return (
    <div className="assessment">
      <div className="assessment-container">
        <h1>인적성 검사</h1>
        <p>로딩 중이거나 데이터가 없습니다.</p>
      </div>
    </div>
  );
};

export default Assessment;
