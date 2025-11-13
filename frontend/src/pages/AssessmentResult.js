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
    parts.push('스트레스 상황에서는 부담을 크게 느낄 수 있어, 휴식과 환경 조절이 중요합니다.');
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

  //  이름
  const [name] = useState(location.state?.name || '응시자');

  //  검사 점수 결과
  const [result, setResult] = useState(
    location.state?.result || location.state || null
  );

  //  GPT 분석 결과
  const [analysis] = useState(location.state?.analysis || null);

  //  로딩 여부 (submit 페이지에서 전달됨)
  const initialLoading = location.state?.loading || false;

  const [loading, setLoading] = useState(initialLoading);
  const [error, setError] = useState('');

  // ---------- 🔥 새로고침 시 데이터 재요청 ----------
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
    } else {
      // 초기 1초 동안 로딩 애니메이션 유지 (감성)
      setTimeout(() => setLoading(false), 1000);
    }
  }, [result, id]);

  // ---------- 🔥 로딩 화면 ----------
  if (loading || !result) {
    return (
      <div className="assessment">
        <div className="assessment-container assessment-result">
          <h1>인적성 검사 결과</h1>
          {error ? (
            <p className="error-text">{error}</p>
          ) : (
            <p>결과를 불러오는 중입니다...</p>
          )}
        </div>
      </div>
    );
  }

  // ---------- 🔥 실제 결과 화면 ----------
  return (
    <div className="assessment">
      <div className="assessment-container assessment-result">
        <h1>인적성 검사 결과</h1>
        <p>
          <strong>{name}</strong> 님의 검사 결과입니다.
        </p>

        {/* 1) 설명 + 그래프 */}
        <div className="result-main">
          <div className="result-text">
            <h3>역량 설명</h3>
            <ul>
              <li><strong>의사소통(COMM)</strong> : 의견을 조율하는 능력.</li>
              <li><strong>책임감(RESP)</strong> : 맡은 일을 끝까지 완수.</li>
              <li><strong>문제해결(PROB)</strong> : 문제를 분석하고 대응.</li>
              <li><strong>성장성(GROW)</strong> : 배움과 성장 의지.</li>
              <li><strong>스트레스 내성(STRE)</strong> : 압박 상황 대응력.</li>
              <li><strong>적응력(ADAP)</strong> : 새로운 환경 적응력.</li>
            </ul>
          </div>

          <div className="result-chart">
            <RadarChart result={result} />
          </div>
        </div>

        {/* 2) GPT 성향 분석 */}
        <div className="result-summary-card gpt-analysis-card">
          <h3>종합 성향 분석</h3>

          {analysis ? (
            <>
              <p><strong>요약:</strong> {analysis.summary}</p>

              <h4>강점</h4>
              <ul>
                {analysis.strengths?.map((s, i) => <li key={i}>{s}</li>)}
              </ul>

              <h4>보완점</h4>
              <ul>
                {analysis.weaknesses?.map((w, i) => <li key={i}>{w}</li>)}
              </ul>

              <p><strong>작업 스타일:</strong> {analysis.work_style}</p>
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
