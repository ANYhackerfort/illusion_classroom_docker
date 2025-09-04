// VideoTable.tsx
import React, { useEffect, useRef, useState } from "react";
import EditedVideoCard from "./EditedVideoCard";
import { getAllVideos } from "../../indexDB/videoStorage";
import "./VideoTable.css";

interface StoredVideo {
  metadata: {
    id: string;
    savedAt: string;
  };
  file: Blob;
}

const VideoTable: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [videoIDs, setVideoIDs] = useState<string[]>([]);

  useEffect(() => {
    const loadVideos = async () => {
      const allVideos: StoredVideo[] = await getAllVideos();
      allVideos.sort(
        (a, b) =>
          new Date(a.metadata.savedAt).getTime() -
          new Date(b.metadata.savedAt).getTime(),
      );
      const ids = allVideos.map((v) => v.metadata.id);
      setVideoIDs(ids);
    };

    loadVideos();

    // Optional: re-run on storage events or custom events
    const handleChange = () => loadVideos();
    window.addEventListener("video-db-updated", handleChange);
    return () => window.removeEventListener("video-db-updated", handleChange);
  }, []);

  return (
    <div ref={containerRef} className="video-table">
      {videoIDs.map((id) => (
        <EditedVideoCard key={id} id={id} />
      ))}
    </div>
  );
};

export default VideoTable;
