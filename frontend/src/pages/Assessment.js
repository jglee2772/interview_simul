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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      setCurrentIndex(0);
    } catch (e) {
      console.error(e);
      setError('인적성검사를 시작하는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 현재 문항에 대한 답변 선택
  const handleAnswer = (value) => {
    const updated = [...answers];
    updated[currentIndex] = value;
    setAnswers(updated);
  };

  // 서버로 제출 + 결과 페이지로 이동
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

      // ✅ 결과 페이지로 이동 (assessmentId + name + result 전달)
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

  // 다음 문항으로 이동 또는 제출
  const nextQuestion = () => {
    if (answers[currentIndex] === null) {
      setError('이 문항에 대한 점수를 선택해 주세요.');
      return;
    }
    setError('');

    if (currentIndex === questions.length - 1) {
      submitAssessment();
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  // 1) 검사 시작 전: 이름 입력 화면
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

  // 2) 검사 진행 중 화면
  if (assessmentId && questions.length > 0) {
    const currentQuestion = questions[currentIndex];
    const currentValue = answers[currentIndex];

    return (
      <div className="assessment">
        <div className="assessment-container">
          <h1>인적성 검사</h1>
          <p>
            <strong>{name}</strong> 님, 총 {questions.length}문항 중{' '}
            {currentIndex + 1}번 문항입니다.
          </p>

          <div className="question-box">
            <p className="question-text">
              {currentQuestion.number}. {currentQuestion.text}
            </p>

            <div className="answer-options">
              {['전혀 아니다', '아니다', '보통이다', '그렇다', '매우 그렇다'].map(
                (label, index) => {
                  const value = index + 1;

                  return (
                    <button
                      key={value}
                      type="button"
                      className={`scale-button ${
                        currentValue === value ? 'selected' : ''
                      }`}
                      onClick={() => handleAnswer(value)}
                    >
                      {label}
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {error && <p className="error-text">{error}</p>}

          <div className="navigation">
            <p>
              진행 상황: {currentIndex + 1} / {questions.length}
            </p>
            <button onClick={nextQuestion} disabled={loading}>
              {currentIndex === questions.length - 1 ? '검사 제출하기' : '다음 문항'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3) 예외 처리
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
