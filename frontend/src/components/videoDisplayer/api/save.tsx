import axiosClient from "../../../api/axiosClient";
import type { VideoSegmentData } from "../../../types/QuestionCard";

export const uploadMeetingVideoChunk = async (
  meetingName: string,
  videoFile: File,
  chunkNumber: number,
): Promise<void> => {
  const formData = new FormData();
  formData.append("video_file", videoFile);
  formData.append("chunk_number", String(chunkNumber));

  try {
    const response = await axiosClient.post(
      `/api/auth/upload_meeting_video/${encodeURIComponent(meetingName)}/`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
      },
    );

    console.log(`✅ Chunk ${chunkNumber} uploaded:`, response.data.message);
  } catch (err) {
    console.error(`❌ Chunk ${chunkNumber} upload failed:`, err);
  }
};

export const uploadVideoSegments = async (
  meetingName: string,
  segments: VideoSegmentData[],
): Promise<void> => {
  try {
    const response = await axiosClient.post(
      `/api/auth/upload_meeting_segments/${encodeURIComponent(meetingName)}/`,
      {
        VideoSegments: segments, // 👈 Must match backend expected key
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true, // ✅ If you're using login session/cookies
      },
    );

    console.log("✅ Segments uploaded:", response.data.message);
  } catch (err) {
    console.error("❌ Segment upload failed:", err);
    throw err;
  }
};
