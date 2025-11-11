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
import RadarChart from '../components/RadarChart';

const TRAIT_MAP = {
  communication: '의사소통',
  responsibility: '책임감',
  problem_solving: '문제해결',
  growth: '성장성',
  stress: '스트레스 내성',
  adaptation: '적응력',
};

function getTopTraitLabel(result) {
  if (!result) return '';

  const entries = [
    ['communication', Number(result.communication)],
    ['responsibility', Number(result.responsibility)],
    ['problem_solving', Number(result.problem_solving)],
    ['growth', Number(result.growth)],
    ['stress', Number(result.stress)],
    ['adaptation', Number(result.adaptation)],
  ];

  const valid = entries.filter(([, v]) => !isNaN(v));
  if (!valid.length) return '';

  const [bestKey] = valid.sort((a, b) => b[1] - a[1])[0];
  return TRAIT_MAP[bestKey] || '';
}

function getSummaryText(result) {
  if (!result) return '';

  const stress = Number(result.stress);
  const adaptation = Number(result.adaptation);
  const comm = Number(result.communication);

  const parts = [];

  if (comm >= 4) {
    parts.push('타인과의 소통에서 강점을 보이며 팀 내 협업에 유리한 편입니다.');
  }
  if (adaptation >= 4) {
    parts.push('새로운 환경과 변화에 빠르게 적응하는 경향이 있습니다.');
  }
  if (stress <= 2.5) {
    parts.push('스트레스 상황에서는 부담을 크게 느낄 수 있어, 휴식과 환경 조절이 중요합니다.');
  } else if (stress >= 4) {
    parts.push('압박 상황에서도 비교적 안정적인 모습을 유지하는 편입니다.');
  }

  if (parts.length === 0) {
    return '각 역량이 전반적으로 균형 있게 분포되어 있어, 다양한 역할에 두루 적응할 수 있는 유형입니다.';
  }

  return parts.join(' ');
}




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

      // 🔥 assessmentAPI.js 기준: startAssessment(data) 사용
      // data 형태: { name: '홍길동' }
      const res = await assessmentAPI.startAssessment({ name });

      // 🔥 axios 응답의 실제 JSON은 res.data 안에 있음
      const { assessment, questions } = res.data;

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

      // assessmentAPI.js 기준: submitAnswer(assessmentId, answers) 사용
      const res = await assessmentAPI.submitAnswer(assessmentId, answers);

      const payload = res.data; // 백엔드에서 내려준 JSON 전체
      setSubmitted(true);
      // 백엔드 응답이 { message: ..., result: {...} } 형태라면 result만 꺼내 쓰고,
      // 아니라면 payload 통째로 저장
      setResult(payload.result || payload);

      // 필요하면 결과 페이지로 이동
      // navigate(`/assessment/${assessmentId}/result`, { state: payload.result });

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
          <p className="question-text">
            {currentQuestion.number}. {currentQuestion.text}
          </p>

          <div className="answer-options">
            {['전혀 아니다', '아니다', '보통이다', '그렇다', '매우 그렇다'].map(
              (label, index) => {
                const value = index + 1; // 1~5 점수

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



// 제출 완료 후 결과 요약(간단 버전)
if (submitted && result) {
  return (
    <div className="assessment">
      <div className="assessment-container assessment-result">
        <h1>인적성 검사 결과</h1>
        <p>
          <strong>{name || '응시자'}</strong> 님의 검사 결과입니다.
        </p>

        {/* 위: 좌측 설명 + 우측 그래프 */}
        <div className="result-main">
          {/* 왼쪽: 6가지 특성 설명 */}
          <div className="result-text">
            <h3>역량 설명</h3>
            <ul>
              <li>
                <strong>의사소통(COMM)</strong> : 의견을 나누고 조율하는 능력입니다.
              </li>
              <li>
                <strong>책임감(RESP)</strong> : 맡은 일을 끝까지 수행하고 약속을 지키는 정도입니다.
              </li>
              <li>
                <strong>문제해결(PROB)</strong> : 문제를 분석하고 해결 방법을 찾아가는 능력입니다.
              </li>
              <li>
                <strong>성장성(GROW)</strong> : 배움과 변화에 얼마나 적극적인지 나타냅니다.
              </li>
              <li>
                <strong>스트레스 내성(STRE)</strong> : 압박 상황에서 안정적으로 버티는 힘입니다.
              </li>
              <li>
                <strong>적응력(ADAP)</strong> : 새로운 환경과 규칙에 얼마나 빨리 적응하는지입니다.
              </li>
            </ul>
          </div>

          {/* 오른쪽: 레이더 차트 */}
          <div className="result-chart">
            <RadarChart result={result} />
          </div>
        </div>

        {/* 아래: 해석 박스 (성향분석 최종결과) */}
        <div className="result-summary-card">
          <h3>성향 분석 최종 결과</h3>
          <p>
            전체적으로 볼 때,&nbsp;
            <strong>{getTopTraitLabel(result)}</strong> 역량이 상대적으로 높게 나타났습니다.
          </p>
          <p>
            {getSummaryText(result)}
          </p>
        </div>

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
