import React, { useState, useRef, useEffect, useCallback } from "react";
import DisplayBar from "./DisplayBar";
import VideoQuestionCard from "../videoEditor/VideoCard";
import Display from "./VideoDisplay";

import type { QuestionCardData } from "../../types/QuestionCard";
import type { VideoSegmentData } from "../../types/QuestionCard";
import { useVideoSocketContext } from "../../types/videoSync/VideoSocketContext";

const VideoStatus: React.FC = () => {
  const [videoTime, setVideoTime] = useState(0);
  const [videoStopped, setVideoStopped] = useState(true);
  const [videoDuration] = useState(0);
  const videoLength = useRef(0);
  const [videoSegments, setVideoSegments] = useState<VideoSegmentData[]>([]);
  const [currentQuestionCard, setCurrentQuestionCard] =
    useState<QuestionCardData | null>(null);
  const currentTimeRef = useRef<number>(0);
  const [baseWidth, setBaseWidth] = useState(0);
  const [innerBarWidthPx, setInnerBarWidthPx] = useState(0);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [widthPercent, setWidthPercent] = useState(50);

  const currentUniqueID = useRef<string>("");
  const videoFileRef = useRef<File | null>(null);
  const hasRestoredRef = useRef(false);

  const { socket } = useVideoSocketContext();

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "sync_update" && msg.state) {
          currentTimeRef.current = msg.state.current_time;
        }
      } catch (err) {
        console.error("Failed to parse message:", err);
      }
    };

    socket.addEventListener("message", handleMessage);
    return () => {
      socket.removeEventListener("message", handleMessage);
    };
  }, [socket]);

  useEffect(() => {
    if (hasRestoredRef.current) {
      console.log("loading saved");
      hasRestoredRef.current = false;
      return;
    }
  }, [videoDuration]);

  const handleUpdateWidth = useCallback(
    (base: number, inner: number) => {
      setBaseWidth(base);
      setInnerBarWidthPx(inner);
    },
    [setBaseWidth, setInnerBarWidthPx],
  );

  return (
    <>
      <div
        style={{
          position: "relative",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Display
          editedLength={videoLength}
          videoTime={videoTime}
          setVideoStopped={setVideoStopped}
          videoStopped={videoStopped}
          metaData={videoSegments}
          currentQuestionCard={currentQuestionCard}
          setCurrentQuestionCard={setCurrentQuestionCard}
          currentTimeRef={currentTimeRef}
          currentUniqueID={currentUniqueID}
          videoFileRef={videoFileRef}
          videoSrc={videoSrc}
          setVideoSrc={setVideoSrc}
          setVideoSegments={setVideoSegments}
          updateWidths={handleUpdateWidth}
          setWidthPercent={setWidthPercent}
        />

        {currentQuestionCard && (() => {
          const segmentIndex = videoSegments.findIndex(
            (seg) =>
              seg.isQuestionCard &&
              seg.questionCardData?.id === currentQuestionCard.id
          );

          if (segmentIndex === -1) return null;

          const segment = videoSegments[segmentIndex];
          const [start, end] = segment.source;

          return (
            <div
              style={{
                position: "absolute",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                pointerEvents: "auto",
                zIndex: 10,
              }}
            >
              <VideoQuestionCard
                question={currentQuestionCard.question}
                answers={currentQuestionCard.answers}
                difficulty={currentQuestionCard.difficulty}
                type={currentQuestionCard.type}
                displayType={currentQuestionCard.displayType}
                showWinner={currentQuestionCard.showWinner}
                live={currentQuestionCard.live}
                questionNumber={segmentIndex}
                start={start}
                end={end}
                currentTimeRef={currentTimeRef}
              />
            </div>
          );
        })()}
      </div>

      <DisplayBar
        baseWidth={baseWidth}
        setVideoTime={setVideoTime}
        videoLength={videoLength}
        videoSegments={videoSegments}
        currentTimeRef={currentTimeRef}
        innerBarWidthPx={innerBarWidthPx}
        setInnerBarWidthPx={setInnerBarWidthPx}
        widthPercent={widthPercent}
        setWidthPercent={setWidthPercent}
      />
    </>
  );
};

export default VideoStatus;
