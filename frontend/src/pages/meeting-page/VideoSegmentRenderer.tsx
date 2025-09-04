import React, { useEffect, useState, useRef } from "react";
import type {
  VideoSegmentData,
  QuestionCardData,
} from "../../types/QuestionCard";
import { fetchVideoSegments, checkMeetingAccess } from "../api/meetingApi";
import VideoQuestionCard from "../../components/videoEditor/VideoCard";
import SmartVideoPlayer from "./SmartVideoPlayer";
import { useParams } from "react-router-dom";
import "./VideoSegmentRenderer.css";
import MissionControl from "./components/MeetingControl";
import LiquidGlassBotGrid from "./components/LiquidGlassBotGrid";
import { safeRoomName } from "../../types/videoSync/VideoSocketContext";
import { fetchUserEmail, fetchBufferedVideo } from "../api/meetingApi";

const VideoSegmentRenderer: React.FC = () => {
  const [segments, setSegments] = useState<VideoSegmentData[]>([]);
  const [currentQuestionCard, setCurrentQuestionCard] =
    useState<QuestionCardData | null>(null);
  const { roomName } = useParams();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  const videoRef = useRef<HTMLVideoElement>(
    null,
  ) as React.RefObject<HTMLVideoElement>;
  const currentTimeRef = useRef<number>(0);
  const segmentsRef = useRef<VideoSegmentData[]>([]);
  const currentSegmentRef = useRef<VideoSegmentData | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  // ✅ Reset state when roomName changes
  useEffect(() => {
    // Clear all state when switching rooms
    setSegments([]);
    setCurrentQuestionCard(null);
    setHasAccess(null);
    setVideoUrl(null);
    currentTimeRef.current = 0;
    segmentsRef.current = [];
    currentSegmentRef.current = null;
  }, [roomName]);

  // ✅ Access check
  useEffect(() => {
    const verifyAccess = async () => {
      if (!roomName) return;
      try {
        const { access } = await checkMeetingAccess(
          encodeURIComponent(roomName),
        );
        setHasAccess(access);
      } catch (err) {
        console.error("Access check failed:", err);
        setHasAccess(false);
      }
    };
    verifyAccess();
  }, [roomName]);

  const loadSegments = async () => {
    try {
      if (!roomName) return;
      const data = await fetchVideoSegments(roomName);
      console.log("📁 Loaded segments:", data);
      setSegments(data);
    } catch (err) {
      console.error("Failed to load segments:", err);
    }
  };

  const loadVideo = async () => {
    try {
      if (!roomName) return;

      // Reset video URL before fetching new one
      setVideoUrl(null);

      const username = await fetchUserEmail();
      const url = await fetchBufferedVideo(roomName, username);
      console.log("🎥 Fetched video URL:", url);
      setVideoUrl(url);
    } catch (err) {
      console.error("❌ Failed to fetch buffered video:", err);
      setVideoUrl(null);
    }
  };

  useEffect(() => {
    segmentsRef.current = segments;
  }, [segments]);

  // ✅ WebSocket + timer logic
  function getVideoTimeBeforeSegment(
    segments: VideoSegmentData[],
    targetSegment: VideoSegmentData,
    time: number,
  ): number {
    for (const seg of segments) {
      if (seg.id === targetSegment.id) break;
      if (seg.isQuestionCard) {
        const [start, end] = seg.source;
        time -= end - start;
      }
    }
    return time;
  }

  //   useEffect(() => {
  //   if (videoRef.current && videoUrl) {
  //     videoRef.current.pause(); // stop old video
  //     videoRef.current.removeAttribute("src"); // clear src
  //     videoRef.current.load(); // force DOM to reset
  //     videoRef.current.src = videoUrl; // re-assign
  //     console.log("Video URL SDFSDFSDFSDFSDFSDFSDFSDFDSFSDFSDf to:", videoUrl);
  //   }
  // }, [videoUrl]);

  useEffect(() => {
    if (!roomName) return;

    const safeName = safeRoomName(roomName);
    console.log("🏠 Room name:", roomName);

    const url = `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/ws/meeting/${safeName}/`;
    const ws = new WebSocket(url);

    console.log("🌐 Connecting to WebSocket at:", url);

    socketRef.current = ws;
    currentTimeRef.current = 0; // seconds

    ws.onopen = () => {
      console.log("✅ WebSocket connected");
    };

    ws.onmessage = async (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === "meeting_started" && msg.started === true) {
          console.log("🚀 Meeting started, loading content...");

          // Load both segments and video
          await Promise.all([loadSegments(), loadVideo()]);

          return;
        }

        console.log("📊 Current segments:", segmentsRef.current);
        if (segmentsRef.current.length === 0) {
          console.warn("⚠️ No segments loaded yet, ignoring WS message.");
          return;
        }

        if (msg.type === "sync_update" && msg.state) {
          const stopped = msg.state.stopped;
          const currentTime = msg.state.current_time;

          if (stopped) {
            videoRef.current?.pause();
            const segment = segmentsRef.current.find(
              (seg) =>
                currentTime >= seg.source[0] && currentTime < seg.source[1],
            );

            if (!segment) return;

            if (segment.isQuestionCard && segment.questionCardData) {
              setCurrentQuestionCard(segment.questionCardData);
            } else if (segment.questionCardData === undefined) {
              setCurrentQuestionCard(null);
            }

            const resumeTime = getVideoTimeBeforeSegment(
              segmentsRef.current,
              segment,
              currentTime,
            );
            if (videoRef.current) {
              videoRef.current.currentTime = resumeTime;
            }
          } else {
            const segment = segmentsRef.current.find(
              (seg) =>
                currentTime >= seg.source[0] && currentTime < seg.source[1],
            );

            if (!segment) return;

            if (segment.isQuestionCard && segment.questionCardData) {
              setCurrentQuestionCard(segment.questionCardData);
              if (videoRef.current && !videoRef.current.paused) {
                videoRef.current.pause();
              }
            } else {
              setCurrentQuestionCard(null);
              if (videoRef.current && videoRef.current.paused) {
                const resumeTime = getVideoTimeBeforeSegment(
                  segmentsRef.current,
                  segment,
                  currentTime,
                );
                videoRef.current.currentTime = resumeTime;
                videoRef.current
                  .play()
                  .catch((err) => console.warn("⚠️ Video play failed:", err));
              }
            }
          }
        }
      } catch (err) {
        console.error("❌ Invalid WS message:", event.data, err);
      }
    };

    ws.onerror = (err) => {
      console.error("❌ WebSocket error:", err);
    };

    ws.onclose = (event) => {
      console.log("🔌 WebSocket closed:", event.code, event.reason);
    };

    // ✅ Cleanup function
    return () => {
      console.log("🧹 Cleaning up WebSocket connection");
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [roomName]); // Re-run when roomName changes

  // ✅ Additional cleanup on unmount
  useEffect(() => {
    return () => {
      console.log("🧹 Component unmounting, final cleanup");
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  return (
    <div className="video-layout-wrapper">
      <LiquidGlassBotGrid />
      <div className="video-container">
        {hasAccess && <MissionControl />}

        <SmartVideoPlayer
          segments={segments}
          meetingName={roomName}
          videoRef={videoRef}
          videoUrl={videoUrl}
        />

        {currentQuestionCard && (
          <div className="question-overlay">
            <VideoQuestionCard {...currentQuestionCard} />
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoSegmentRenderer;
