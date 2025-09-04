import React, { useState, useRef, useEffect, useCallback } from "react";
import VideoBar from "./VideoBar";
import VideoDisplay from "./VideoDisplay";
import VideoQuestionCard from "./VideoCard";
import SaveButton from "./SaveForm";
import { v4 as uuidv4 } from "uuid";

import { saveVideoToIndexedDB, getVideoById } from "../../indexDB/videoStorage";
import type { VideoMetadata } from "../../indexDB/videoStorage";

import type { QuestionCardData } from "../../types/QuestionCard";
import type { VideoSegmentData } from "../../types/QuestionCard";

const VideoPlayerWithBar: React.FC = () => {
  const [videoTime, setVideoTime] = useState(0);
  const [videoStopped, setVideoStopped] = useState(true); // true if paused
  const [videoDuration, setVideoDuration] = useState(0);
  // const [editedLength, setEditedLength] = useState(0);
  const videoLength = useRef(0);
  const [videoSegments, setVideoSegments] = useState<VideoSegmentData[]>([]);
  const [currentQuestionCard, setCurrentQuestionCard] =
    useState<QuestionCardData | null>(null);
  const currentTimeRef = useRef<number>(0);
  const [baseWidth, setBaseWidth] = useState(0);
  const [innerBarWidthPx, setInnerBarWidthPx] = useState(0);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [widthPercent, setWidthPercent] = useState(50);
  const [updateBar, setuUpdateBar] = useState(false);

  const currentVideoNameRef = useRef<string>("Unsaved");
  const currentVideoTagsRef = useRef<string[]>([]);

  const videoDroppedInRef = useRef(false);

  const currentUniqueID = useRef<string>("");
  const videoFileRef = useRef<File | null>(null);

  const PIXELS_PER_SECOND = 100;

  const hasRestoredRef = useRef(false);

  const currentSegmentsRef = useRef<VideoSegmentData[]>([]);
  const previousSegmentsRef = useRef<VideoSegmentData[]>([]);

  useEffect(() => {
    currentSegmentsRef.current = videoSegments;
  }, [videoSegments]);

  useEffect(() => {
    const interval = setInterval(() => {
      const current = currentSegmentsRef.current;
      const previous = previousSegmentsRef.current;
      console.log("Checking for changes in segments...");

      // Check if segments changed (shallow compare for now)
      const changed = JSON.stringify(current) !== JSON.stringify(previous);
      console.log("Checking for changes:", changed);

      if (changed) {
        previousSegmentsRef.current = [...current]; // update previous

        const id = currentUniqueID.current;
        const length = videoLength.current;
        const videoFile = videoFileRef.current;
        if (!videoFile || current.length === 0) return;

        const metadata: VideoMetadata = {
          id,
          videoName: hasRestoredRef.current
            ? currentVideoNameRef.current
            : "Unsaved",
          videoTags: hasRestoredRef.current ? currentVideoTagsRef.current : [],
          videoLength: length,
          questionCards: current,
          savedAt: new Date().toISOString(),
        };

        saveVideoToIndexedDB(metadata, videoFile).then(() => {
          console.log("✅ Auto-saved updated segments to IndexedDB");
          localStorage.setItem("lastVideoID", id);
        });
      }
    }, 20000); // every 20 seconds

    return () => clearInterval(interval);
  }, []);

  // useEffect(() => {
  //   console.log("Auto Save capabilities mounted.");

  //   return () => {
  //     const id = currentUniqueID.current;
  //     const length = videoLength.current;
  //     console.log("Auto-saving video with ID:", id, "and length:", length);
  //     const videoFile = videoFileRef.current;
  //     const questionCards = extractAllSegments();

  //     console.log("EXTRACTED QUESTION CARDS", questionCards);

  //     if (!videoFile) {
  //       console.warn("No video file to persist");
  //       return;
  //     }

  //     getVideoById(id).then((existing) => {
  //       let metadata: VideoMetadata;

  //       if (existing) {
  //         // ✅ Update only the questionCards
  //         metadata = {
  //           ...existing.metadata,
  //           questionCards,
  //           savedAt: new Date().toISOString(), // optionally update timestamp
  //         };
  //         console.log("🔁 Updating existing video metadata only");
  //       } else {
  //         // ✅ New entry
  //         metadata = {
  //           id,
  //           videoName: "Unsaved",
  //           videoTags: [],
  //           videoLength: length,
  //           questionCards,
  //           savedAt: new Date().toISOString(),
  //         };
  //         console.log("🆕 Saving new video entry");
  //       }

  //       saveVideoToIndexedDB(metadata, videoFile).then(() => {
  //         localStorage.setItem("lastVideoID", id);
  //         console.log("✅ Auto-saved video & metadata on unmount");
  //       });
  //     });
  //   };
  // }, []);

  // useEffect(() => {
  //   return () => {
  //     const id = currentUniqueID.current;
  //     localStorage.setItem("lastVideoID", id);
  //     console.log("📝 Stored lastVideoID to localStorage on unmount:", id);
  //   };
  // }, []);

  useEffect(() => {
    const restoreFromIndexedDB = async (lastID: string) => {
      try {
        const result = await getVideoById(lastID);
        if (!result) return;

        const { metadata, file } = result;

        hasRestoredRef.current = true;

        // 🎥 Restore file
        videoFileRef.current = file;
        const objectURL = URL.createObjectURL(file);

        currentVideoNameRef.current = metadata.videoName || "Unsaved";
        currentVideoTagsRef.current = metadata.videoTags || [];

        // ✅ Restore segments directly (they now include all types) // questionCards now = all segments
        console.log("Restoring segments:", metadata);
        videoLength.current = metadata.videoLength;
        currentUniqueID.current = metadata.id;
        setVideoSrc(objectURL);

        // 📐 Recalculate bar width
        const calculatedWidth = metadata.videoLength * PIXELS_PER_SECOND;
        setBaseWidth(calculatedWidth);
        setInnerBarWidthPx((50 / 100) * calculatedWidth);

        setVideoDuration(metadata.videoLength);
        setWidthPercent(50);
        setVideoSegments(metadata.questionCards);

        console.log("✅ Restored full timeline from IndexedDB");
      } catch (err) {
        console.error("❌ Failed to restore video:", err);
      }
    };

    const lastID = localStorage.getItem("lastVideoID");
    if (lastID) {
      restoreFromIndexedDB(lastID);
    }
  }, []);

  useEffect(() => {
    console.log("🔄 videoSegments updated from IndexedDB", videoSegments);
  }, [videoSegments]);

  useEffect(() => {
    if (hasRestoredRef.current) {
      console.log("loading saved");
      hasRestoredRef.current = false;
      setuUpdateBar((prev) => !prev);
      return;
    } else if (videoDroppedInRef.current) {
      console.log("resetting everything", videoDuration);
      setVideoSegments([
        { id: uuidv4(), source: [0, videoDuration], isQuestionCard: false },
      ]);
      videoLength.current = videoDuration;
      const calculatedWidth = videoLength.current * PIXELS_PER_SECOND;
      setBaseWidth(calculatedWidth);
      setInnerBarWidthPx((50 / 100) * calculatedWidth);
      currentUniqueID.current = uuidv4();
    }
    console.log("ignored for handle dropped in already edited");
  }, [videoDuration]);

  const videoSegmentsRef = useRef<VideoSegmentData[]>(videoSegments);

  useEffect(() => {
    videoSegmentsRef.current = videoSegments;
  }, [videoSegments]);

  const extractAllSegments = (): VideoSegmentData[] => {
    return videoSegmentsRef.current;
  };

  const handleVideoSave = async (name: string, tag: string) => {
    const id = currentUniqueID.current;
    const length = videoLength.current;
    const questionCards = extractAllSegments();
    const videoFile = videoFileRef.current;

    if (!videoFile) {
      console.error("No video file to save");
      return;
    }

    const metadata: VideoMetadata = {
      id,
      videoName: name,
      videoTags: tag.split(",").map((t) => t.trim()),
      videoLength: length,
      questionCards,
      savedAt: new Date().toISOString(),
    };

    console.log("Saving video with metadata:", metadata);

    console.log("START");
    try {
      console.log("Before saveVideoToIndexedDB");
      await saveVideoToIndexedDB(metadata, videoFile);
      console.log("After saveVideoToIndexedDB");
    } catch (err) {
      console.error("CAUGHT!", err);
    }
    console.log("END");
  };

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
        <VideoDisplay
          editedLength={videoLength}
          videoTime={videoTime}
          setVideoStopped={setVideoStopped}
          setVideoDuration={setVideoDuration}
          videoStopped={videoStopped}
          metaData={videoSegments}
          currentQuestionCard={currentQuestionCard}
          setCurrentQuestionCard={setCurrentQuestionCard}
          currentTimeRef={currentTimeRef}
          currentUniqueID={currentUniqueID}
          videoFileRef={videoFileRef}
          videoSrc={videoSrc}
          setVideoSrc={setVideoSrc}
          videoDroppedRef={videoDroppedInRef}
          setVideoSegments={setVideoSegments}
          updateWidths={handleUpdateWidth}
          setWidthPercent={setWidthPercent}
        />

        {currentQuestionCard && (
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
            />
          </div>
        )}
      </div>

      <VideoBar
        updateBar={updateBar}
        baseWidth={baseWidth}
        setVideoTime={setVideoTime}
        // setEditedLength={setEditedLength}
        videoLength={videoLength}
        videoSegments={videoSegments}
        setVideoSegments={setVideoSegments}
        currentTimeRef={currentTimeRef}
        innerBarWidthPx={innerBarWidthPx}
        setInnerBarWidthPx={setInnerBarWidthPx}
        setBaseWidth={setBaseWidth}
        widthPercent={widthPercent}
        setWidthPercent={setWidthPercent}
      />

      {videoDuration !== 0 && <SaveButton onSave={handleVideoSave} />}
    </>
  );
};

export default VideoPlayerWithBar;
