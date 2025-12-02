import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import ReactMarkdown from 'react-markdown';
import './Interview.css';
// 이미지를 import 합니다. (파일 경로와 이름 확인 필수!)
import interviewersImage from '../assets/interview.gif';
import { API_BASE_URL } from '../services/apiConfig';

function Interview() {
  // -----------------------------------------------------------
  // 0. 인적성 결과값 받아오기 (페이지 진입 시 자동 설정)
  // -----------------------------------------------------------
  const location = useLocation();
  const navigate = useNavigate();
  const receivedJobTopic = location.state?.jobTopic || "";

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
  
  // 피드백 데이터 저장용 상태
  const [feedback, setFeedback] = useState(''); 

  // 페이지가 열릴 때 인적성 검사에서 넘어온 주제가 있다면 자동 입력
  useEffect(() => {
    if (receivedJobTopic) {
      setJobTopic(receivedJobTopic);
    }
  }, [receivedJobTopic]);

  // -----------------------------------------------------------
  // 2. 헬퍼: 말풍선 위치 계산 & AI 메시지 찾기
  // -----------------------------------------------------------
  
  // (1) 대화 기록 중 'ai'가 보낸 마지막 메시지 찾기
  const lastAiMessage = conversation.filter(msg => msg.sender === 'ai').slice(-1)[0];

  // (2) 말풍선 위치 계산 로직
  // 현재까지 AI가 몇 번 말했는지 셉니다.
  const aiMsgCount = conversation.filter(msg => msg.sender === 'ai').length;
  
  // 현재 말하는 면접관의 순번 (0, 1, 2, 3) 계산
  const currentSpeakerIndex = aiMsgCount > 0 ? (aiMsgCount - 1) % 4 : 0;

  // 각 자리에 앉은 면접관의 말풍선 위치 (왼쪽 기준 %)
  const bubblePositions = [
    '15%', // 1번 면접관
    '38%', // 2번 면접관
    '62%', // 3번 면접관
    '85%'  // 4번 면접관
  ];

  // 말풍선에 적용할 동적 스타일
  const bubbleStyle = {
    left: bubblePositions[currentSpeakerIndex],
    transition: 'left 0.4s ease-in-out', 
    transform: 'translateX(-50%)'
  };

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
      // 첫 질문 저장
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

    // 내 답변도 기록에 남김
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

      // AI 답변(또는 종료 메시지) 저장
      setConversation(prev => [...prev, { 
        sender: 'ai', 
        text: data.question_text,
        interviewer: data.interviewer 
      }]);

      if (data.is_finished) {
        setIsFinished(true);
        setCurrentExchangeId(null);
        
        // 백엔드에서 보낸 피드백이 있으면 저장
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

  // [추가] 리포트 다운로드 함수
  const handleDownload = () => {
    if (!feedback) {
      alert("다운로드할 피드백 내용이 없습니다.");
      return;
    }

    // 1. 파일 내용 생성 (피드백 텍스트)
    const element = document.createElement("a");
    const file = new Blob([feedback], { type: 'text/plain;charset=utf-8' });
    
    // 2. 다운로드 링크 생성
    element.href = URL.createObjectURL(file);
    
    // 3. 파일명 설정 (예: 면접리포트_20231126.txt)
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    element.download = `면접분석리포트_${date}.txt`;
    
    // 4. 클릭 트리거 및 뒷정리
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // -----------------------------------------------------------
  // 4. 화면 렌더링
  // -----------------------------------------------------------
  return (
    <div className={`interview-page ${isFinished ? 'finished-mode' : ''}`}>
      
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
            
            {/* 🔥 [수정] isFinished가 false일 때만 이미지를 보여줍니다. */}
            {!isFinished && (
              <img src={interviewersImage} alt="Interviewers" className="stage-img" />
            )}          
            
            {/* 말풍선: 로딩 중이거나, AI 메시지가 있을 때 표시 */}
            {(isLoading || (lastAiMessage && !isFinished)) && (
              <div 
                className="speech-bubble" 
                style={bubbleStyle} /* 동적 스타일(위치 이동) 적용 */
              >
                <div className="bubble-tail"></div>
                <div className="bubble-content">
                  {/* 면접관 이름 */}
                  {lastAiMessage?.interviewer && (
                    <span className="interviewer-badge">
                      {lastAiMessage.interviewer.role || '면접관'}
                    </span>
                  )}
                  {/* 텍스트 */}
                  <p>
                    {isLoading ? "답변을 분석하고 있습니다..." : lastAiMessage?.text}
                  </p>
                </div>
              </div>
            )}            
          </div>

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
              /* (2) 면접 종료: 피드백 리포트 표시 */
              <div className="feedback-container">
                <h2>면접 분석 리포트</h2>
                
                <div className="feedback-content">
                  {/* 피드백 텍스트 표시 (줄바꿈 유지됨) */}
                  {feedback ? (
                        <ReactMarkdown>{feedback}</ReactMarkdown>
                  ) : (
                        "상세 피드백을 생성하고 있습니다..."
                  )}
                </div>
                
                {/* [수정] 버튼 영역 (저장 + 돌아가기) */}
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
  );
}

export default Interview;