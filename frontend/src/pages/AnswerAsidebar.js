import React from 'react';
import './AnswerAsidebar.css'; // ✅ CSS 파일명 변경

const AnswerAsidebar = ({ show, toggleAsidebar, questions, answers, onSelectQuestion }) => {
  // const unanswered = questions
  //   .map((q, index) => (answers[index] === null ? index + 1 : null))
  //   .filter((x) => x !== null);

return (
  <ul className="aside-question-list">
    {questions.map((q, index) => {
      const answered = answers[index] !== null;
      return (
        <li
          key={q.id || index}
          className={answered ? "answered" : "unanswered"}
          onClick={() => onSelectQuestion(index)}
        >
          <span className="question-number">
            {String(q.number).padStart(2, "0")}
          </span>
          {answered ? (
            <span className="check-icon">✔</span>
          ) : (
            <span className="warning-icon">⚠</span>
          )}
        </li>
      );
    })}
  </ul>
);
};

export default AnswerAsidebar; 
