/**
 * 페이지: 인적성검사 결과 페이지
 */

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import assessmentAPI from '../services/assessmentAPI';
import RadarChart from '../components/RadarChart';
import './AssessmentResult.css';

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
    parts.push(
      '스트레스 상황에서는 부담을 크게 느낄 수 있어, 휴식과 환경 조절이 중요합니다.'
    );
  } else if (stress >= 4) {
    parts.push('압박 상황에서도 비교적 안정적인 모습을 유지하는 편입니다.');
  }

  if (parts.length === 0) {
    return '각 역량이 전반적으로 균형 있게 분포되어 있어, 다양한 역할에 두루 적응할 수 있는 유형입니다.';
  }

  return parts.join(' ');
}

const AssessmentResult = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const [name] = useState(location.state?.name || '응시자');
  const [result, setResult] = useState(
    location.state?.result || location.state || null
  );

  // 🔥 GPT 분석 데이터
  const [analysis] = useState(location.state?.analysis || null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 새로고침 시 API 재조회
  useEffect(() => {
    if (!result && id) {
      const fetchResult = async () => {
        try {
          setLoading(true);
          const res = await assessmentAPI.getResult(id);
          setResult(res.data);
        } catch (e) {
          console.error(e);
          setError('결과를 불러오는 중 오류가 발생했습니다.');
        } finally {
          setLoading(false);
        }
      };
      fetchResult();
    }
  }, [result, id]);

  if (loading || !result) {
    return (
      <div className="assessment">
        <div className="assessment-container assessment-result">
          <h1>인적성 검사 결과</h1>
          {error ? <p className="error-text">{error}</p> : <p>결과를 불러오는 중입니다...</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="assessment">
      <div className="assessment-container assessment-result">
        <h1>인적성 검사 결과</h1>
        <p>
          <strong>{name}</strong> 님의 검사 결과입니다.
        </p>

        {/* 1) 좌측 설명 + 우측 그래프 */}
        <div className="result-main">
          {/* ▷ Left: 6가지 기본 역량 설명 */}
          <div className="result-text">
            <h3>역량 설명</h3>
            <ul>
              <li><strong>의사소통(COMM)</strong> : <br/>의견을 나누고 조율하는 능력입니다.</li>
              <li><strong>책임감(RESP)</strong> : <br/>맡은 일을 끝까지 수행하는 정도입니다.</li>
              <li><strong>문제해결(PROB)</strong> : <br/>문제를 분석하고 해결하는 능력입니다.</li>
              <li><strong>성장성(GROW)</strong> : <br/>배움과 변화에 대한 적극성입니다.</li>
              <li><strong>스트레스 내성(STRE)</strong> : <br/>압박 상황에서도 안정적 버티기.</li>
              <li><strong>적응력(ADAP)</strong> : <br/>새로운 환경 적응 속도.</li>
            </ul>
          </div>

          {/* ▷ Right: Radar Chart */}
          <div className="result-chart">
            <RadarChart result={result} />
          </div>
        </div>

        {/* 2) GPT 성향 분석 카드 */}
        <div className="result-summary-card gpt-analysis-card">
          <h3>GPT 종합 성향 분석</h3>

          {analysis ? (
            <>
              <p>
                <strong>요약:</strong> {analysis.summary}
              </p>

              <h4>강점</h4>
              <ul>
                {analysis.strengths?.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>

              <h4>보완점</h4>
              <ul>
                {analysis.weaknesses?.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>

              <p>
                <strong>작업 스타일:</strong> {analysis.work_style}
              </p>
            </>
          ) : (
            <p>GPT 분석 데이터가 존재하지 않습니다.</p>
          )}
        </div>

        <button onClick={() => navigate('/')}>메인으로 돌아가기</button>
      </div>
    </div>
  );
};

export default AssessmentResult;
