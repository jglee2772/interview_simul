import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import ReactMarkdown from 'react-markdown';
import './Interview.css';
// [중요] 사용하시는 이미지 import
import interviewersImage from '../assets/interview.gif';
import { API_BASE_URL } from '../services/apiConfig';

function Interview() {
  // -----------------------------------------------------------
  // 0. 초기 설정 및 상태 관리
  // -----------------------------------------------------------
  const location = useLocation();
  const navigate = useNavigate();
  const receivedJobTopic = location.state?.jobTopic || "";

  const [jobTopic, setJobTopic] = useState('');
  const [conversation, setConversation] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentExchangeId, setCurrentExchangeId] = useState(null);
  
  const [isSessionStarted, setIsSessionStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  
  const [feedback, setFeedback] = useState(''); 

  useEffect(() => {
    if (receivedJobTopic) {
      setJobTopic(receivedJobTopic);
    }
  }, [receivedJobTopic]);

  // -----------------------------------------------------------
  // 1. 말풍선 위치 계산 헬퍼
  // -----------------------------------------------------------
  const lastAiMessage = conversation.filter(msg => msg.sender === 'ai').slice(-1)[0];
  const aiMsgCount = conversation.filter(msg => msg.sender === 'ai').length;
  const currentSpeakerIndex = aiMsgCount > 0 ? (aiMsgCount - 1) % 4 : 0;

  const bubblePositions = ['15%', '38%', '62%', '85%'];
  const bubbleStyle = {
    left: bubblePositions[currentSpeakerIndex],
    transition: 'left 0.4s ease-in-out', 
    transform: 'translateX(-50%)'
  };

  // -----------------------------------------------------------
  // 2. API 통신 핸들러
  // -----------------------------------------------------------
  const handleStartInterview = async () => {
    if (!jobTopic.trim()) {
      alert('면접 주제를 입력해주세요.');
      return;
    }
    setIsLoading(true);
    setConversation([]);
    setIsFinished(false);
    setFeedback(''); 

    try {
      const response = await fetch(`${API_BASE_URL}/interview/start/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_topic: jobTopic }),
      });

      if (!response.ok) throw new Error(response.statusText);
      const data = await response.json();

      setIsSessionStarted(true);
      setConversation([{ 
        sender: 'ai', 
        text: data.question_text,
        interviewer: data.interviewer 
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

    setConversation(prev => [...prev, { sender: 'user', text: userAnswer }]);

    try {
      const response = await fetch(`${API_BASE_URL}/interview/answer/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exchange_id: currentExchangeId,
          user_answer: userAnswer,
        }),
      });

      if (!response.ok) throw new Error(response.statusText);
      const data = await response.json();

      setConversation(prev => [...prev, { 
        sender: 'ai', 
        text: data.question_text,
        interviewer: data.interviewer 
      }]);

      if (data.is_finished) {
        setIsFinished(true);
        setCurrentExchangeId(null);
        if (data.feedback) {
          setFeedback(data.feedback);
        }
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
    setFeedback('');
    navigate('/'); 
  };

  const handleDownload = () => {
    if (!feedback) {
      alert("다운로드할 피드백 내용이 없습니다.");
      return;
    }
    const element = document.createElement("a");
    const file = new Blob([feedback], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    element.download = `면접분석리포트_${date}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // -----------------------------------------------------------
  // 3. 화면 렌더링
  // -----------------------------------------------------------
  return (
    <div className="interview-page">
      
      {/* 2. 메인 컨텐츠 영역 */}
      <div className="page-body">
        
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
          /* B. 면접 진행 화면 */
          <div className="interview-container">
            
            {/* 1. 상단 스테이지 (이미지 + 말풍선) */}
            {/* [핵심 수정] 면접 종료 시 이 영역을 아예 삭제하여 빈 공간 제거 */}
            {!isFinished && (
              <div className="stage-area">
                <img src={interviewersImage} alt="Interviewers" className="stage-img" />
                
                {(isLoading || lastAiMessage) && (
                  <div className="speech-bubble" style={bubbleStyle}>
                    <div className="bubble-tail"></div>
                    <div className="bubble-content">
                      {lastAiMessage?.interviewer && (
                        <span className="interviewer-badge">
                          {lastAiMessage.interviewer.role || '면접관'}
                        </span>
                      )}
                      <p>
                        {isLoading ? "답변을 분석하고 있습니다..." : lastAiMessage?.text}
                      </p>
                    </div>
                  </div>
                )}            
              </div>
            )}

            {/* 2. 하단 인터랙션 영역 */}
            <div className="interaction-area">
              {!isFinished ? (
                /* (1) 면접 중: 답변 입력 폼 */
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
                /* (2) 면접 종료: 피드백 리포트 */
                // 클래스명 변경: feedback-wrapper (중복 스타일 방지)
                <div className="feedback-wrapper">
                  <h2>면접 분석 리포트</h2>
                  
                  <div className="feedback-content">
                    {feedback ? (
                          <ReactMarkdown>{feedback}</ReactMarkdown>
                    ) : (
                          "상세 피드백을 생성하고 있습니다..."
                    )}
                  </div>
                  
                  <div className="button-group">
                    <button className="download-btn" onClick={handleDownload}>
                      💾 리포트 저장
                    </button>
                    <button className="restart-btn" onClick={handleRestart}>
                      처음으로 돌아가기
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Interview;