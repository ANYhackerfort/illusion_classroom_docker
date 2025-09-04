import React, { useRef, useEffect, useCallback } from "react";
import NameOverlayCardGlass from "./NameOverlayCardGlass";
import "./LiquidGlassBotGrid.css";

// Generate 8 users with placeholder avatars
const EXAMPLE_USERS = Array.from({ length: 8 }, (_, i) => ({
  image: `https://api.dicebear.com/7.x/thumbs/svg?seed=anon${i + 1}`,
  name: `User ${i + 1}`,
}));

const LiquidGlassBotGrid: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sizeRef = useRef({ w: 220, h: 910 });
  const [localStream, setLocalStream] = React.useState<MediaStream | null>(
    null,
  );

  const posRef = useRef({ x: 25, y: 25 });
  const modeRef = useRef<"drag" | "resize" | null>(null);
  const dragDataRef = useRef<{
    sx: number;
    sy: number;
    sw: number;
    sh: number;
    px: number;
    py: number;
  } | null>(null);

  // Get user's camera stream for User 1
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((stream) => setLocalStream(stream))
      .catch((err) => {
        console.error("Failed to access camera:", err);
        setLocalStream(null);
      });

    return () => {
      localStream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    const el = e.target as Element;
    const isHandle = el.classList.contains("resize-handle");
    modeRef.current = isHandle ? "resize" : "drag";

    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    dragDataRef.current = {
      sx: e.clientX,
      sy: e.clientY,
      sw: sizeRef.current.w,
      sh: sizeRef.current.h,
      px: posRef.current.x,
      py: posRef.current.y,
    };

    if (!isHandle && containerRef.current) {
      containerRef.current.style.cursor = "grabbing";
    }
  };

  const onPointerMove = useCallback((e: PointerEvent) => {
    if (!dragDataRef.current || !modeRef.current || !containerRef.current)
      return;
    const { sx, sy, sw, sh, px, py } = dragDataRef.current;

    if (modeRef.current === "resize") {
      const w = Math.max(240, sw + (e.clientX - sx));
      const h = Math.max(240, sh + (e.clientY - sy));
      sizeRef.current = { w, h };
      containerRef.current.style.width = `${w}px`;
      containerRef.current.style.height = `${h}px`;
      return;
    }

    const dx = e.clientX - sx;
    const dy = e.clientY - sy;
    const newX = px + dx;
    const newY = py + dy;
    posRef.current = { x: newX, y: newY };
    containerRef.current.style.transform = `translate3d(${newX}px, ${newY}px, 0)`;
  }, []);

  const onPointerUp = useCallback(() => {
    modeRef.current = null;
    dragDataRef.current = null;
    if (containerRef.current) containerRef.current.style.cursor = "";
  }, []);

  useEffect(() => {
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [onPointerMove, onPointerUp]);

  return (
    <div
      ref={containerRef}
      className="liquid-glass-grid"
      onPointerDown={onPointerDown}
      style={{
        width: sizeRef.current.w,
        height: sizeRef.current.h,
        transform: `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0)`,
      }}
    >
      <div className="grid-scroll">
        <div className="grid-inner">
          {EXAMPLE_USERS.map((user, i) => (
            <NameOverlayCardGlass
              key={i}
              image={user.image}
              name={user.name}
              ratio="16 / 9"
              videoStream={i === 0 ? (localStream ?? undefined) : undefined}
            />
          ))}
        </div>
      </div>

      <div
        className="resize-handle"
        aria-label="Resize"
        title="Drag to resize"
      />
    </div>
  );
};

export default LiquidGlassBotGrid;
