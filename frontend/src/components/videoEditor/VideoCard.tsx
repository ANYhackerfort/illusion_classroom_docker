import React, { useState, useEffect } from "react";
import "./VideoCard.css";
import { FaMicrophone } from "react-icons/fa";
import SliderQuestion from "./questionProps/SliderQuestion";
import MCQQuestion from "./questionProps/MCQuestion";
import { getBotAnswersFromServer } from "../botEditor/interfaces/bot_drop";

interface BotAnswer {
  name: string;
  answer: string;
  timestamp: number;
}

interface QuestionCardProps {
  question: string;
  answers: string[];
  difficulty: "easy" | "medium" | "hard";
  type: "slider" | "short" | "mc" | "match" | "rank" | "ai";
  displayType?: "face" | "initial" | "anonymous";
  showWinner?: boolean;
  live?: boolean;
  questionNumber?: number;
  start?: number;
  end?: number;
  currentTimeRef?: React.RefObject<number>;
}

const VideoQuestionCard: React.FC<QuestionCardProps> = ({
  question,
  answers,
  difficulty,
  type,
  displayType,
  showWinner,
  live,
  questionNumber,
  start,
  end,
  currentTimeRef,
}) => {
  const [displayTypeState] = useState<"face" | "initial" | "anonymous">(
    displayType ?? "anonymous",
  );
  const [showWinnerState] = useState<boolean>(showWinner ?? false);
  const [liveState] = useState<boolean>(live ?? false);
  const [botAnswers, setBotAnswers] = useState<BotAnswer[] | null>(null);

  useEffect(() => {
    if (botAnswers) {
      console.log("Bot Answers:", botAnswers);
      console.log("Current Time Ref:", currentTimeRef?.current);
    }
  }, [botAnswers]);

  useEffect(() => {
    const fetchBotAnswers = async () => {
      try {
        const meetingName = window.location.pathname.split("/")[2]; // adjust if path is different
        const res = await getBotAnswersFromServer(meetingName, questionNumber!, start!, end!, answers!);
        
        if (res?.botAnswers) {
          setBotAnswers([]); // ⬅️ reset first to avoid stale state

          setBotAnswers(
            res.botAnswers.map((entry: any) => ({
              name: entry.name,
              answer: entry.answer,
              timestamp: entry.timestamp, // ✅ don't override
            }))
          );
        }
      } catch (err) {
        console.error("Failed to fetch bot answers:", err);
      }
    };

    // ✅ Only call fetch if all 3 are defined
    if (
      questionNumber !== undefined &&
      start !== undefined &&
      end !== undefined
    ) {
      fetchBotAnswers();
    }
  }, [questionNumber, start, end]);

  const handleMouseDown = () => {
    console.log(displayTypeState);
  };

  return (
    <div
      className={`video-question-card ${difficulty}`}
      onMouseDown={handleMouseDown}
    >
      <div className="video-question-header">
        <div className="video-question-text">{question}</div>
        <div className={`video-question-type ${type}`}>
          {type.toUpperCase()}
        </div>
      </div>
      <div className="video-answers-container">
        {type === "slider" ? (
          <SliderQuestion
            answers={answers}
            displayState={displayTypeState}
            showWinner={showWinnerState}
            live={liveState}
          />
        ) : type === "short" ? (
          <div className="video-short-ui" />
        ) : type === "match" ? (
          answers.map((answer, index) => (
            <div key={index} className="video-match-row">
              <div className="video-match-box">{answer}</div>
              <div className="video-match-box">?</div>
            </div>
          ))
        ) : type === "rank" ? (
          answers.map((answer, index) => (
            <div key={index} className="video-rank-row">
              <span className="video-rank-number">{index + 1}.</span>
              <span className="video-rank-text">{answer}</span>
            </div>
          ))
        ) : type === "ai" ? (
          <div className="video-ai-ui">
            <div className="video-ai-mic-ring">
              <FaMicrophone size={24} />
            </div>
            <div className="video-ai-prompt">
              This is an AI interview-style question. Speak your answer.
            </div>
          </div>
        ) : type === "mc" ? (
          <MCQQuestion
            answers={answers}
            // displayState={displayTypeState}
            // showWinner={showWinnerState}
            // live={liveState}
          />
        ) : (
          answers.map((answer, index) => (
            <div key={index} className="video-answer-box">
              {answer}
            </div>
          ))
        )}
      </div>

      <div className="video-question-footer">
        <span className="footer-badge">{displayTypeState}</span>
        {showWinnerState && <span className="footer-badge">🏆 Winner</span>}
        {liveState && <span className="footer-badge">🔴 Live</span>}
      </div>
    </div>
  );
};

export default VideoQuestionCard;
