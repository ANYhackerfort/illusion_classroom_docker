import React, { useEffect, useState } from "react";
import { getVideoById } from "../../indexDB/videoStorage";
import { useMouse } from "../../hooks/drag/MouseContext";
import "./EditedVideoCard.css";

interface EditedVideoCardProps {
  id: string;
}

const tagColorMap: Record<string, string> = {};
function getColorForTag(tag: string): string {
  if (tagColorMap[tag]) return tagColorMap[tag];
  const colors = [
    "#F44336",
    "#E91E63",
    "#9C27B0",
    "#3F51B5",
    "#2196F3",
    "#009688",
    "#4CAF50",
    "#FF9800",
    "#795548",
    "#607D8B",
  ];
  const color = colors[Math.abs(hashCode(tag)) % colors.length];
  tagColorMap[tag] = color;
  return color;
}
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

const EditedVideoCard: React.FC<EditedVideoCardProps> = ({ id }) => {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [videoName, setVideoName] = useState<string>("Loading...");
  const [videoTags, setVideoTags] = useState<string[]>([]);
  const { setDraggedItem } = useMouse();

  useEffect(() => {
    (async () => {
      const stored = await getVideoById(id);
      if (!stored) return;

      setVideoName(stored.metadata.videoName);
      setVideoTags(stored.metadata.videoTags);

      const video = document.createElement("video");
      video.src = URL.createObjectURL(stored.file);
      video.currentTime = 1;

      video.addEventListener("loadeddata", () => {
        const canvas = document.createElement("canvas");
        canvas.width = 1280;
        canvas.height = 720;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumbnail = canvas.toDataURL("image/jpeg");
          setThumbnailUrl(thumbnail);

          // ✅ Drag payload can now include all lightweight metadata
          video.dataset.thumbnail = thumbnail; // Attach for use in handler if needed
        }
      });
    })();
  }, [id]);

  const handleMouseDown = () => {
    if (!thumbnailUrl) return;
    setDraggedItem({
      type: "edited-video",
      data: {
        id,
        videoName,
        videoTags,
        thumbnailUrl,
      },
    });
  };

  return (
    <div className="edited-video-card" onMouseDown={handleMouseDown}>
      <div className="thumbnail-container">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt="thumbnail" className="video-thumbnail" />
        ) : (
          <div className="video-placeholder">Loading...</div>
        )}
      </div>
      <div className="video-name">{videoName}</div>
      <div className="video-tags">
        {videoTags.map((tag) => (
          <span
            key={tag}
            className="video-tag"
            style={{ backgroundColor: getColorForTag(tag) }}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
};

export default EditedVideoCard;
