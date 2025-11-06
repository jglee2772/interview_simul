/**
 * 페이지: 인적성검사 페이지
 * 역할: 인적성검사 질문/답변 UI 및 로직 작성
 * 설명:
 * - 인적성검사 질문을 표시하고 답변을 받는 UI를 작성합니다
 * - 질문 진행 상태, 답변 선택, 다음 질문으로 이동 등의 기능을 구현합니다
 * - API 서비스를 통해 백엔드와 통신합니다
 * - React 컴포넌트와 상태 관리 로직을 작성합니다
 */

import React, { useState } from 'react';
import assessmentAPI from '../services/assessmentAPI';
import { useNavigate } from 'react-router-dom';
import './Assessment.css';

const Assessment = () => {
  const navigate = useNavigate();

  // 상태 관리
  const [name, setName] = useState('');              // 메인에서 안 받는다고 가정하면 여기서 임시로 입력
  const [assessmentId, setAssessmentId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0); // 현재 문항 인덱스
  const [answers, setAnswers] = useState([]);          // 각 문항에 대한 점수 배열
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);          // 서버에서 받은 결과 저장용

  // 인적성검사 시작 함수
  const startAssessment = async () => {
    if (!name.trim()) {
      setError('이름을 입력해 주세요.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // 백엔드: POST /api/assessment/start/ 호출한다고 가정
      // 예: assessmentAPI.start(name) → { assessment, questions }
      const res = await assessmentAPI.start(name);

      const { assessment, questions } = res;

      setAssessmentId(assessment.id);
      setQuestions(questions);
      setAnswers(new Array(questions.length).fill(null)); // 문항 수만큼 답안 배열 준비
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
    updated[currentIndex] = value; // 현재 문항에 점수 기록
    setAnswers(updated);
  };

  // 마지막에 서버로 제출
  const submitAssessment = async () => {
    if (answers.some((v) => v === null)) {
      setError('모든 문항에 답변을 완료해 주세요.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // 백엔드: POST /api/assessment/{id}/submit/
      // 예: assessmentAPI.submit(assessmentId, answers)
      const res = await assessmentAPI.submit(assessmentId, answers);

      setSubmitted(true);
      setResult(res.result || res); // 구현에 따라 result 안에 또 들어 있을 수 있음

      // 필요하면 결과 페이지로 이동
      // navigate(`/assessment/${assessmentId}/result`, { state: res.result });

    } catch (e) {
      console.error(e);
      setError('답변 제출 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 다음 문항으로 이동 또는 제출
  const nextQuestion = () => {
    // 현재 문항에 답변 안 했으면 막기
    if (answers[currentIndex] === null) {
      setError('이 문항에 대한 점수를 선택해 주세요.');
      return;
    }
    setError('');

    // 마지막 문항이면 제출
    if (currentIndex === questions.length - 1) {
      submitAssessment();
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  // 검사 시작 전: 이름 입력 화면
  if (!assessmentId && !submitted) {
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
  if (!submitted && assessmentId && questions.length > 0) {
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
            <p>
              {currentQuestion.number}. {currentQuestion.text}
            </p>

            <div className="answer-options">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  key={val}
                  className={currentValue === val ? 'selected' : ''}
                  onClick={() => handleAnswer(val)}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="error-text">{error}</p>}

          <div className="navigation">
            <p>
              진행 상황: {currentIndex + 1} / {questions.length}
            </p>
            <button onClick={nextQuestion} disabled={loading}>
              {currentIndex === questions.length - 1
                ? '검사 제출하기'
                : '다음 문항'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 제출 완료 후 결과 요약(간단 버전)
  if (submitted && result) {
    return (
      <div className="assessment">
        <div className="assessment-container">
          <h1>인적성 검사 결과</h1>
          <p><strong>{name}</strong> 님의 검사 결과입니다.</p>

          {/* 여기서 result 안에 있는 scores, type_label 등을 보여주면 됨 */}
          <pre>{JSON.stringify(result, null, 2)}</pre>

          <button onClick={() => navigate('/')}>메인으로 돌아가기</button>
        </div>
      </div>
    );
  }

  // 혹시라도 로딩 중 또는 데이터 없는 상태 대비
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
