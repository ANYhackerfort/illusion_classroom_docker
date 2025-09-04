import axiosClient from "../../api/axiosClient";
import type { VideoSegmentData } from "../../types/QuestionCard";

export const fetchUserEmail = async (): Promise<string> => {
  const response = await axiosClient.get<{ email: string }>(
    "/api/auth/userinfo/",
    {
      withCredentials: true,
    },
  );
  return response.data.email;
};

export interface CreateMeetingPayload {
  name: string;
  imageUrl: string;
  description: string;
  questionsCount: number;
  videoLengthSec: number;
  tags: string[];
  sharedWith?: string[];
  VideoSegments?: any[]; // type more specifically if needed
}

export const createMeeting = async (payload: CreateMeetingPayload) => {
  const response = await axiosClient.post(
    "/api/auth/create_meeting/",
    payload,
    {
      withCredentials: true, // send session cookie
    },
  );
  return response.data;
};

interface BackendMeeting {
  name: string;
  imageUrl: string;
  description: string;
  questionsCount: number;
  videoLengthSec: number;
  tags: string[];
  createdAt: string;
  ownerEmail: string;
  sharedWith: string[];
}

export const fetchUserMeetings = async (): Promise<{
  meetings: BackendMeeting[];
}> => {
  const response = await axiosClient.get("/api/auth/get_user_meetings/", {
    withCredentials: true,
  });
  return response.data;
};

interface ServerResponse {
  meetingName: string;
  meetingLink: string;
  segments: {
    sourceStart: number;
    sourceEnd: number;
    isQuestionCard: boolean;
    questionCard?: {
      id: string;
      question: string;
      answers: string[];
      difficulty: string;
      type: string;
      displayType?: "face" | "initial" | "anonymous";
      showWinner?: boolean;
      live?: boolean;
    };
  }[];
}

export const fetchVideoSegments = async (
  meetingName: string,
): Promise<VideoSegmentData[]> => {
  const response = await axiosClient.get<ServerResponse>(
    `/api/auth/get_meeting_segments/${encodeURIComponent(meetingName)}/`,
    {
      withCredentials: true,
    },
  );

  return response.data.segments.map((seg, index) => {
    const base: VideoSegmentData = {
      id: `segment-${index}`,
      source: [seg.sourceStart, seg.sourceEnd],
      isQuestionCard: seg.isQuestionCard, // ✅ now always defined
    };
    console.log(seg.questionCard);
    if (seg.questionCard) {
      base.questionCardData = {
        id: seg.questionCard.id,
        question: seg.questionCard.question,
        answers: seg.questionCard.answers,
        difficulty: seg.questionCard.difficulty as "easy" | "medium" | "hard",
        type: seg.questionCard.type as
          | "slider"
          | "short"
          | "mc"
          | "match"
          | "rank"
          | "ai",
        displayType: seg.questionCard.displayType as
          | "face"
          | "initial"
          | "anonymous"
          | undefined,
        showWinner: seg.questionCard.showWinner ?? undefined,
        live: seg.questionCard.live ?? undefined,
      };
    }

    return base;
  });
};

export const fetchBufferedVideo = async (
  meetingName: string,
  username: string,
): Promise<string> => {
  const url = `http://localhost:8081/media/videos/${encodeURIComponent(username)}/${encodeURIComponent(meetingName)}/current_playing.webm`;

  // Keep trying until file is available
  for (let i = 0; i < 10; i++) {
    try {
      console.log(`🔁 Attempt ${i + 1} to fetch HEAD from ${url}`);
      const res = await fetch(url, { method: "HEAD" });
      if (res.ok) {
        console.log("✅ Video file found!");
        return url;
      } else {
        console.log(`❌ Got status: ${res.status}`);
      }
    } catch (err) {
      console.warn(`⚠️ Error during fetch attempt ${i + 1}`, err);
    }
    await new Promise((res) => setTimeout(res, 500));
  }

  throw new Error("Buffered video file not found after 5s of retrying.");
};

export const checkMeetingAccess = async (
  meetingId: string,
): Promise<{ access: boolean }> => {
  const response = await axiosClient.get<{ access: boolean }>(
    `/api/auth/check_access/${meetingId}/`,
    {
      withCredentials: true,
    },
  );
  return response.data;
};
