/**
 * 페이지: 인적성검사 페이지
 * 역할: 전체 5점(역문항 처리 포함) 자동생성 테스트 기능 포함
 */

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import assessmentAPI from "../services/assessmentAPI";
import "./Assessment.css";
import AnswerAsidebar from "./AnswerAsidebar";

// ----------------------------------------------
// 테스트용: 난수 자동 생성 (1~5)
// ----------------------------------------------
const generateRandomAnswers = (questions) => {
  return questions.map(() => Math.floor(Math.random() * 5) + 1);
  };


const Assessment = () => {
  const navigate = useNavigate();

  // 상태관리
  const [name, setName] = useState("");
  const [assessmentId, setAssessmentId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [showSidebar, setShowSidebar] = useState(true);
  const [progress, setProgress] = useState(0);
  const hasCheckedName = useRef(false);

  const questionsPerPage = 10;
  const totalPages = Math.ceil(questions.length / questionsPerPage);

  const startIndex = currentPage * questionsPerPage;
  const pagedQuestions = questions.slice(startIndex, startIndex + questionsPerPage);

  // -------------------- 이름 확인 --------------------
  useEffect(() => {
    if (hasCheckedName.current) return;
    hasCheckedName.current = true;

    const data = localStorage.getItem("resumeData");
    const savedName = data ? JSON.parse(data).name : "";

    if (!savedName) {
      alert("먼저 홈에서 이름을 입력해주세요!");
      navigate("/");
      return;
    }

    setName(savedName);
  }, [navigate]);

  // -------------------- 진행률 계산 --------------------
  useEffect(() => {
    if (!questions.length) return;
    const count = answers.filter((v) => v !== null && v !== undefined).length;
    setProgress(Math.round((count / questions.length) * 100));
  }, [answers, questions]);

  const getProgressColor = (v) => {
    if (v < 50) return "#e74c3c";
    if (v < 80) return "#f1c40f";
    return "#2ecc71";
  };

  // -------------------- 검사 시작 --------------------
  const startAssessment = async () => {
    if (!name) {
      setError("이름이 없습니다!");
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
      setError("");

    } catch {
      setError("검사 시작 오류!");
    } finally {
      setLoading(false);
    }
  };

  // -------------------- 답변 선택 --------------------
  const handleAnswer = (index, value) => {
    setAnswers((prev) => {
      const newArr = [...prev];
      newArr[index] = value;
      return newArr;
    });
  };

  // -------------------- 제출 --------------------
  const submitAssessment = async () => {
    if (answers.some((v) => v === null)) {
      setError("모든 문항에 답변하세요!");
      return;
    }

    try {
      setLoading(true);

      const res = await assessmentAPI.submitAnswer(assessmentId, answers);

      navigate(`/assessment-result/${assessmentId}`, {
        state: {
          name,
          result: res.data.result || res.data,
          analysis: res.data.analysis ?? null,
        },
      });

    } catch {
      setError("제출 실패!");
    } finally {
      setLoading(false);
    }
  };

  // -------------------- 로딩 화면 --------------------
  if (loading) {
    return (
      <div className="assessment-loading-overlay">
        <div className="loading-spinner"></div>
        <p>결과 불러오는 중…</p>
      </div>
    );
  }

  // -------------------- 시작 화면 --------------------
  if (!assessmentId) {
    return (
      <div className="assessment-start-wrapper">
        <div className="assessment-start-container">
          <h1>인적성 검사 안내</h1>
          <p>검사 시작 전에 이름을 확인해주세요.</p>
          <button onClick={startAssessment}>동의하고 검사 시작</button>
        </div>
      </div>
    );
  }

  // -------------------- 진행 화면 --------------------
  return (
    <div className="assessment-wrapper">
      <div className="assessment-layout">

        <AnswerAsidebar
          show={showSidebar}
          toggleSidebar={() => setShowSidebar((p) => !p)}
          questions={questions}
          answers={answers}
          onSelectQuestion={(i) => {
            setCurrentPage(Math.floor(i / questionsPerPage));
          }}
        />

        <div className="assessment-page">
          <div className="assessment-container">
            <h1>인적성 검사</h1>

            <p>
              <strong>{name}</strong> 님, {questions.length}문항 중{" "}
              {answers.filter((v) => v !== null).length}문항 완료
            </p>

            {/* 전체 5점(역문항 처리 포함) 자동 테스트 버튼 */}
            <div className="auto-test-area">
             <button
                type="button"
                className="auto-test-btn"
                onClick={() => {
                const autoAnswers = generateRandomAnswers(questions);
                setAnswers(autoAnswers);
                setCurrentPage(0);
                alert("랜덤 자동 답안이 입력되었습니다!");
                }}
                >
                자동 테스트 (랜덤)
                </button>
            </div>

            {/* 진행률 */}
            <div className="progress-bar-container">
              <div
                className="progress-bar"
                style={{
                  width: `${progress}%`,
                  backgroundColor: getProgressColor(progress),
                }}
              ></div>
            </div>

            {/* 문항 리스트 */}
            <div className="question-list">
              {pagedQuestions.map((q, idx) => {
                const globalIndex = startIndex + idx;

                return (
                  <div key={q.id} className="question-item">
                    <p className="question-text">
                      {q.number}. {q.text}
                    </p>

                    <div className="scale-row">
                      <span>전혀 아니다</span>
                      <div className="answer-options">
                        {[1, 2, 3, 4, 5].map((value) => (
                          <button
                            key={value}
                            className={`scale-button ${
                              answers[globalIndex] === value ? "selected" : ""
                            }`}
                            onClick={() => handleAnswer(globalIndex, value)}
                          />
                        ))}
                      </div>
                      <span>매우 그렇다</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 네비게이션 */}
            <div className="navigation">
              <button
                disabled={currentPage === 0}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                이전
              </button>

              <span>
                {currentPage + 1} / {totalPages}
              </span>

              {currentPage === totalPages - 1 ? (
                <button onClick={submitAssessment}>검사 제출하기</button>
              ) : (
                <button onClick={() => setCurrentPage((p) => p + 1)}>
                  다음
                </button>
              )}
            </div>

            {error && <p className="error-text">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Assessment;
