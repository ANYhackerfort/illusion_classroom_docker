import React, { useState } from "react";
import "./MCQuestion.css";

// type DisplayType = "face" | "initial" | "anonymous";

interface MCQQuestionProps {
  answers: string[];
  // displayState: DisplayType;
  // showWinner: boolean;
  // live: boolean;
}

interface Avatar {
  id: string;
  url: string;
}

const getStubAvatar = () => ({
  id: crypto.randomUUID(),
  url: `https://i.pravatar.cc/32?img=${Math.floor(Math.random() * 70) + 1}`,
});

const MCQQuestion: React.FC<MCQQuestionProps> = ({
  answers,
}) => {
  const [answerAvatars, setAnswerAvatars] = useState<Record<number, Avatar[]>>(
    {},
  );

  const handleClick = (index: number) => {
    const newAvatar = getStubAvatar();
    setAnswerAvatars((prev) => ({
      ...prev,
      [index]: [...(prev[index] || []), newAvatar],
    }));
  };

  return (
    <div className="mcq-wrap">
      <div className="mcq-answers">
        {answers.map((answer, index) => (
          <div
            key={index}
            className="mcq-answer-box"
            onClick={() => handleClick(index)}
          >
            <span className="mcq-answer-text">{answer}</span>
            <div className="mcq-avatars-right">
              {(answerAvatars[index] || []).map((avatar, idx) => (
                <img
                  key={avatar.id}
                  className="mcq-avatar"
                  src={avatar.url}
                  alt="user"
                  style={{ right: `${idx * 36}px` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MCQQuestion;
