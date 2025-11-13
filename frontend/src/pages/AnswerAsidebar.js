import React from "react";
import "./AnswerAsidebar.css";

const AnswerAsidebar = ({ questions, answers, onSelectQuestion }) => {
  return (
    <div className="asidebar">
      <div className="aside-inner-box">
        <h3>진행 현황</h3>
        <ul className="aside-question-list">
          {questions.map((q, index) => {
            const answered = answers[index] !== null;
            return (
              <li
                key={q.id || index}
                className={answered ? "answered" : "unanswered"}
                onClick={() => onSelectQuestion(index)}
              >
                {String(q.number).padStart(2, "0")}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default AnswerAsidebar;
