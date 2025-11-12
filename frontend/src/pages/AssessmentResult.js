/**
 * 페이지: 인적성검사 결과 페이지
 * 역할: 인적성검사 결과 표시 UI 작성
 * 설명:
 * - 인적성검사 결과를 시각적으로 표시합니다
 * - 점수, 분석 결과, 추천사항 등을 표시합니다
 * - API 서비스를 통해 백엔드에서 결과 데이터를 가져옵니다
 * - React 컴포넌트로 작성하며, 차트나 그래프를 사용할 수 있습니다
 */
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
    // navigate 할 때 state에 { name, result } 넣었으니 그거 먼저 사용
    location.state?.result || location.state || null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 새로고침으로 들어온 경우: 백엔드에서 다시 결과 조회
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

        {/* 위: 좌측 설명 + 우측 그래프 */}
        <div className="result-main">
          {/* 왼쪽: 6가지 특성 설명 */}
          <div className="result-text">
            <h3>역량 설명</h3>
            <ul>
              <li>
                <strong>의사소통(COMM)</strong> : <br/>의견을 나누고 조율하는 능력입니다.
              </li>
              <li>
                <strong>책임감(RESP)</strong> : <br/>맡은 일을 끝까지 수행하고 약속을 지키는 정도입니다.
              </li>
              <li>
                <strong>문제해결(PROB)</strong> : <br/>문제를 분석하고 해결 방법을 찾아가는 능력입니다.
              </li>
              <li>
                <strong>성장성(GROW)</strong> : <br/>배움과 변화에 얼마나 적극적인지 나타냅니다.
              </li>
              <li>
                <strong>스트레스 내성(STRE)</strong> : <br/>압박 상황에서 안정적으로 버티는 힘입니다.
              </li>
              <li>
                <strong>적응력(ADAP)</strong> : <br/>새로운 환경과 규칙에 얼마나 빨리 적응하는지입니다.
              </li>
            </ul>
          </div>

          {/* 오른쪽: 레이더 차트 */}
          <div className="result-chart">
            <RadarChart result={result} />
          </div>
        </div>

        {/* 아래: 해석 박스 */}
        <div className="result-summary-card">
          <h3>성향 분석 최종 결과</h3>
          <p>
            전체적으로 볼 때,&nbsp;
            <strong>{getTopTraitLabel(result)}</strong> 역량이 상대적으로 높게 나타났습니다.
          </p>
          <p>{getSummaryText(result)}</p>
        </div>

        <button onClick={() => navigate('/')}>메인으로 돌아가기</button>
      </div>
    </div>
  );
};

export default AssessmentResult;
