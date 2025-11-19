import React, { useState, useRef } from 'react';
import './Interview.css';
// 이미지를 import 합니다. (파일 경로와 이름 확인 필수!)
import interviewersImage from '../assets/interview.gif'; 

const API_BASE_URL = 'http://127.0.0.1:8000/api/interview';

function Interview() {
  // -----------------------------------------------------------
  // 1. 상태(State) 관리
  // -----------------------------------------------------------
  const [jobTopic, setJobTopic] = useState('');       // 주제
  const [conversation, setConversation] = useState([]); // 대화 기록
  const [currentInput, setCurrentInput] = useState(''); // 답변 입력
  const [isLoading, setIsLoading] = useState(false);    // 로딩 중 여부
  const [currentExchangeId, setCurrentExchangeId] = useState(null); // 현재 질문 ID
  
  const [isSessionStarted, setIsSessionStarted] = useState(false); // 시작 여부
  const [isFinished, setIsFinished] = useState(false);             // 종료 여부

  // -----------------------------------------------------------
  // 2. 헬퍼: 가장 최근 AI 메시지 찾기 (말풍선용)
  // -----------------------------------------------------------
  // 대화 기록 중 'ai'가 보낸 마지막 메시지를 찾아 화면에 보여줍니다.
  const lastAiMessage = conversation.filter(msg => msg.sender === 'ai').slice(-1)[0];

  // -----------------------------------------------------------
  // 3. API 통신 함수 (면접 시작 & 답변 제출)
  // -----------------------------------------------------------
  const handleStartInterview = async () => {
    if (!jobTopic.trim()) {
      alert('면접 주제를 입력해주세요.');
      return;
    }
    setIsLoading(true);
    setConversation([]);
    setIsFinished(false);

    try {
      const response = await fetch(`${API_BASE_URL}/start/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_topic: jobTopic }),
      });

      if (!response.ok) throw new Error(response.statusText);
      const data = await response.json();

      setIsSessionStarted(true);
      // 첫 질문 저장 (interviewer 정보가 있다면 같이 저장됨)
      setConversation([{ 
        sender: 'ai', 
        text: data.question_text,
        interviewer: data.interviewer // 백엔드에서 면접관 정보도 보내준다면 활용
      }]);
      setCurrentExchangeId(data.id);

    } catch (error) {
      console.error(error);
      alert('면접 시작 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!currentInput.trim()) return;

    const userAnswer = currentInput;
    setCurrentInput('');
    setIsLoading(true);

    // 내 답변도 기록에 남김 (로그용)
    setConversation(prev => [...prev, { sender: 'user', text: userAnswer }]);

    try {
      const response = await fetch(`${API_BASE_URL}/answer/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exchange_id: currentExchangeId,
          user_answer: userAnswer,
        }),
      });

      if (!response.ok) throw new Error(response.statusText);
      const data = await response.json();

      // AI 답변 저장
      setConversation(prev => [...prev, { 
        sender: 'ai', 
        text: data.question_text,
        interviewer: data.interviewer 
      }]);

      if (data.is_finished) {
        setIsFinished(true);
        setCurrentExchangeId(null);
      } else {
        setCurrentExchangeId(data.id);
      }

    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestart = () => {
    setIsSessionStarted(false);
    setIsFinished(false);
    setJobTopic('');
    setConversation([]);
    setCurrentExchangeId(null);
  };

  // -----------------------------------------------------------
  // 4. 화면 렌더링
  // -----------------------------------------------------------
  return (
    <div className="interview-page">
      
      {/* A. 시작 전 화면 */}
      {!isSessionStarted ? (
        <div className="start-container">
          <h1 className="title">AI 면접 시뮬레이터</h1>
          <div className="start-card">
            <img src={interviewersImage} alt="Interviewers" className="preview-img" />
            <p>준비되셨나요? 희망 직무를 입력하고 면접관들을 만나보세요.</p>
            <input
              type="text"
              value={jobTopic}
              onChange={(e) => setJobTopic(e.target.value)}
              placeholder="예: 백엔드 개발자, 마케터"
              onKeyPress={(e) => e.key === 'Enter' && handleStartInterview()}
            />
            <button onClick={handleStartInterview} disabled={isLoading}>
              {isLoading ? '면접장 입장 중...' : '면접 시작하기'}
            </button>
          </div>
        </div>
      ) : (
        /* B. 면접 진행 화면 (비주얼 노벨 스타일) */
        <div className="interview-container">
          
          {/* 1. 상단 스테이지 (이미지 + 말풍선) */}
          <div className="stage-area">
            <img src={interviewersImage} alt="Interviewers" className="stage-img" />
            
            {/* 말풍선: 로딩 중이거나, AI 메시지가 있을 때 표시 */}
            {(isLoading || (lastAiMessage && !isFinished)) && (
              <div className="speech-bubble">
                {/* 말풍선 꼬리 */}
                <div className="bubble-tail"></div>
                
                <div className="bubble-content">
                  {/* 면접관 이름 (데이터가 있으면 표시) */}
                  {lastAiMessage?.interviewer && (
                    <span className="interviewer-badge">
                      {lastAiMessage.interviewer.role || '면접관'}
                    </span>
                  )}
                  
                  {/* 텍스트: 로딩 중이면 ... 표시 */}
                  <p>
                    {isLoading ? "답변을 분석하고 있습니다..." : lastAiMessage?.text}
                  </p>
                </div>
              </div>
            )}

            {/* 종료 메시지 */}
            {isFinished && (
              <div className="speech-bubble finished">
                <div className="bubble-content">
                  <h3>🎉 면접 종료</h3>
                  <p>{lastAiMessage?.text || "수고하셨습니다."}</p>
                </div>
              </div>
            )}
          </div>

          {/* 2. 하단 인터랙션 영역 (답변 입력) */}
          <div className="interaction-area">
            {!isFinished ? (
              <form className="answer-box" onSubmit={handleSubmitAnswer}>
                <textarea
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  placeholder="답변을 입력하세요..."
                  disabled={isLoading}
                />
                <button type="submit" disabled={isLoading || !currentInput}>
                  제출
                </button>
              </form>
            ) : (
              <button className="restart-btn" onClick={handleRestart}>
                처음으로 돌아가기
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Interview;