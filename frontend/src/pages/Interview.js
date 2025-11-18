/**
 * 페이지: 면접 시뮬레이션 페이지
 * 역할: 면접 시뮬레이션 UI 및 로직 작성
 * 설명:
 * - 면접 시뮬레이션 채팅 인터페이스를 작성합니다
 * - 면접 시작, 질문/답변, 면접 종료 등의 기능을 구현합니다
 * - API 서비스를 통해 백엔드와 통신합니다
 * - React 컴포넌트와 상태 관리 로직을 작성합니다
 */

import React, { useState, useEffect, useRef } from 'react';
import './Interview.css'; // CSS 파일 임포트

// Django API 서버 주소 (환경 변수로   빼는 것이 가장 좋습니다)
const API_BASE_URL = 'http://127.0.0.1:8000/api/interview';

function Interview() {
  // 1. 상태(State) 변수 정의
  const [jobTopic, setJobTopic] = useState('React'); // 면접 주제
  const [conversation, setConversation] = useState([]); // 전체 대화 내역 (채팅창)
  const [currentInput, setCurrentInput] = useState(''); // 사용자가 입력 중인 답변
  const [isLoading, setIsLoading] = useState(false); // AI가 답변 생성 중인지 (로딩 스피너용)
  const [currentExchangeId, setCurrentExchangeId] = useState(null); // (★핵심) 현재 답변해야 할 질문의 ID
  const [isSessionStarted, setIsSessionStarted] = useState(false); // 면접 시작 여부

  // (보너스) 채팅창 스크롤을 항상 아래로 내리기 위한 Ref
  const chatWindowRef = useRef(null);

  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [conversation]); // conversation이 업데이트될 때마다 스크롤

  // 2. 면접 시작 함수 (API 호출 1)
  const handleStartInterview = async () => {
    if (!jobTopic) {
      alert('면접 주제를 입력하세요.');
      return;
    }
    
    setIsLoading(true);
    setConversation([]); // 이전 대화 내용 초기화
    setIsSessionStarted(true); // 면접 시작됨
    
    try {
      const response = await fetch(`${API_BASE_URL}/start/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // (참고) Django의 CSRF 토큰 설정에 따라 헤더가 더 필요할 수 있습니다.
        },
        body: JSON.stringify({ job_topic: jobTopic }),
      });

      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.statusText}`);
      }

      const data = await response.json();
      
      // AI의 첫 질문을 대화 내역에 추가
      setConversation([{ sender: 'ai', text: data.question_text }]);
      // (★핵심) 이 질문의 ID를 저장 -> 나중에 답변 보낼 때 사용
      setCurrentExchangeId(data.id); 

    } catch (error) {
      console.error('면접 시작 오류:', error);
      setConversation([{ sender: 'ai', text: `오류가 발생했습니다: ${error.message}` }]);
      setIsSessionStarted(false); // 오류 시 세션 시작 취소
    } finally {
      setIsLoading(false);
    }
  };

  // 3. 답변 제출 함수 (API 호출 2)
  const handleSubmitAnswer = async (e) => {
    e.preventDefault(); // Form의 기본 새로고침 동작 방지
    if (!currentInput.trim()) return; // 빈 답변 제출 방지

    const userAnswer = currentInput;
    setIsLoading(true);
    setCurrentInput(''); // 입력창 비우기

    // 사용자의 답변을 대화 내역에 즉시 추가 (UI UX)
    setConversation(prev => [...prev, { sender: 'user', text: userAnswer }]);

    try {
      const response = await fetch(`${API_BASE_URL}/answer/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exchange_id: currentExchangeId, // (★핵심) 아까 저장해둔 질문 ID
          user_answer: userAnswer,        // (★핵심) 방금 입력한 답변
        }),
      });

      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.statusText}`);
      }

      const data = await response.json();

      // AI의 다음 질문을 대화 내역에 추가
      setConversation(prev => [...prev, { sender: 'ai', text: data.question_text }]);
      // (★핵심) 다음 질문에 답변하기 위해 '새 질문 ID'로 업데이트
      setCurrentExchangeId(data.id);

    } catch (error) {
      console.error('답변 제출 오류:', error);
      setConversation(prev => [...prev, { sender: 'ai', text: `오류가 발생했습니다: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  // 4. 화면 렌더링 (JSX)
  return (
    <div className="interview-page">
      <h1>AI 면접 시뮬레이션</h1>

      {/* 면접 시작 전 화면 */}
      {!isSessionStarted ? (
        <div className="start-form">
          <input
            type="text"
            value={jobTopic}
            onChange={(e) => setJobTopic(e.target.value)}
            placeholder="면접 주제 (예: React, Django)"
            disabled={isLoading}
          />
          <button onClick={handleStartInterview} disabled={isLoading}>
            {isLoading ? '로딩 중...' : '면접 시작'}
          </button>
        </div>
      ) : (
        <>
          {/* 면접 중 채팅창 */}
          <div className="chat-window" ref={chatWindowRef}>
            {conversation.map((msg, index) => (
              <div key={index} className={`chat-bubble ${msg.sender}`}>
                <p>{msg.text}</p>
              </div>
            ))}
            {isLoading && (
              <div className="chat-bubble ai">
                <p>...AI가 생각 중입니다...</p>
              </div>
            )}
          </div>

          {/* 답변 입력 폼 */}
          <form className="answer-form" onSubmit={handleSubmitAnswer}>
            <textarea
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              placeholder="답변을 입력하세요..."
              disabled={isLoading}
              rows={3}
            />
            <button type="submit" disabled={isLoading}>
              {isLoading ? '전송 중...' : '답변 제출'}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default Interview;