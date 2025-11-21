/**
 * 페이지: 인적성검사 결과 페이지
 */

import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import assessmentAPI from "../services/assessmentAPI";
import RadarChart from "../components/RadarChart";
import "./AssessmentResult.css";

const AssessmentResult = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  // 이름
  const [name] = useState(location.state?.name || "응시자");

  // 검사 결과
  const [result, setResult] = useState(
    location.state?.result || location.state || null
  );

  // GPT 분석
  const [analysis] = useState(location.state?.analysis || null);

  // 로딩
  const initialLoading = location.state?.loading || false;
  const [loading, setLoading] = useState(initialLoading);
  const [error, setError] = useState("");

  // 추천 직업 (배열)
  const [recommendedJob, setRecommendedJob] = useState([]);

  // -------------------------------
  // 1) 새로고침 시 결과 재요청
  // -------------------------------
  useEffect(() => {
    if (!result && id) {
      const fetchResult = async () => {
        try {
          setLoading(true);
          const res = await assessmentAPI.getResult(id);
          setResult(res.data);
        } catch (e) {
          console.error(e);
          setError("결과를 불러오는 중 오류가 발생했습니다.");
        } finally {
          setLoading(false);
        }
      };
      fetchResult();
    } else {
      setTimeout(() => setLoading(false), 1000);
    }
  }, [result, id]);

  // -------------------------------
  // 2) AI 추천 API 호출
  // -------------------------------
  useEffect(() => {
    if (!result) return;

    const fetchAIJob = async () => {
      try {
        const comm = parseFloat(result.communication);
        const resp = parseFloat(result.responsibility);
        const prob = parseFloat(result.problem_solving);
        const grow = parseFloat(result.growth);
        const stre = parseFloat(result.stress);
        const adap = parseFloat(result.adaptation);

        const res = await assessmentAPI.getRecommendedJob(
          comm, resp, prob, grow, stre, adap
        );

        if (res.data?.results && res.data.results.length > 0) {
          setRecommendedJob(res.data.results);
        }

      } catch (err) {
        console.error("추천 API 오류:", err);
      }
    };

    fetchAIJob();
  }, [result]);

  // -------------------------------
  // 로딩 화면
  // -------------------------------
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

  // -------------------------------
  // 실제 결과 화면
  // -------------------------------
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
              <li><strong>책임감(RESP)</strong> : 일의 완수도.</li>
              <li><strong>문제해결(PROB)</strong> : 문제 분석 및 대응.</li>
              <li><strong>성장성(GROW)</strong> : 배움과 성장 의지.</li>
              <li><strong>스트레스(STRE)</strong> : 압박 상황 대응력.</li>
              <li><strong>적응력(ADAP)</strong> : 새로운 환경 적응력.</li>
            </ul>
          </div>

          <div className="result-chart">
            <RadarChart result={result} />
          </div>
        </div>

        {/* 2) GPT 분석 */}
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

        3) AI 추천 직업
        {recommendedJob.length > 0 && (
          <div className="recommend-box">
            <h3>✨ AI 추천 직업</h3>

            {recommendedJob.slice(0, 3).map((job, i) => (
              <div key={i} className="job-item">
                <p><strong>{i + 1}위:</strong> {job.title_ko}</p>
              </div>
            ))}

            <button
              className="simul-btn"
              onClick={() =>
                navigate("/interview-simul", {
                  state: { job: recommendedJob[0].title_ko },
                })
              }
            >
              {recommendedJob[0].title_ko} 직무 면접 시뮬레이션 시작하기 →
            </button>
          </div>
        )}

        <button onClick={() => navigate("/")}>메인으로 돌아가기</button>
      </div>
    </div>
  );
};

export default AssessmentResult;
