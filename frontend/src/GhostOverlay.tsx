import { useEffect, useRef } from "react";
import GhostCard from "./components/quesitons/QuestionCardGhost";
import GhostEditedVideoCard from "./finder/editedVideoStorage/GhostEditedVideoCard";
import { useMouse } from "./hooks/drag/MouseContext";

const GhostOverlay = () => {
  const { draggedItem, draggedItemSizePercent } = useMouse();
  const ghostRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef({ x: 0, y: 0 });

  // Track mouse position
  useEffect(() => {
    const updateGhostPosition = (e: MouseEvent) => {
      positionRef.current = { x: e.clientX, y: e.clientY };
      const ghost = ghostRef.current;
      if (ghost && draggedItem) {
        const scale = draggedItemSizePercent / 100;
        let x = e.clientX;
        let y = e.clientY;

        if (draggedItem.type === "question-card") {
          y -= 65;
        } else {
          console.log("Hello");
          y -= 65; // ✅ Move right
          x -= 95;
        }

        ghost.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
      }
    };

    window.addEventListener("mousedown", updateGhostPosition);
    window.addEventListener("mousemove", updateGhostPosition);

    return () => {
      window.removeEventListener("mousedown", updateGhostPosition);
      window.removeEventListener("mousemove", updateGhostPosition);
    };
  }, [draggedItem, draggedItemSizePercent]);

  if (!draggedItem) return null;

  let ghostContent = null;

  if (draggedItem.type === "question-card") {
    ghostContent = <GhostCard item={draggedItem} />;
  } else if (draggedItem.type === "edited-video") {
    const { id, videoName, videoTags, thumbnailUrl } = draggedItem.data;
    ghostContent = (
      <GhostEditedVideoCard
        id={id}
        videoName={videoName}
        videoTags={videoTags}
        thumbnailUrl={thumbnailUrl}
      />
    );
  }

  return (
    <div className="ghost-overlay">
      <div
        ref={ghostRef}
        style={{
          position: "fixed",
          transformOrigin: "top left",
          pointerEvents: "none",
          zIndex: 9999,
        }}
      >
        {ghostContent}
      </div>
    </div>
  );
};

export default GhostOverlay;
