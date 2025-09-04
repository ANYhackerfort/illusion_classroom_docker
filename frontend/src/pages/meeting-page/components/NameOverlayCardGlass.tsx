import React from "react";
import { Box, Typography } from "@mui/material";

interface NameOverlayCardGlassProps {
  image?: string;
  name: string;
  ratio?: string;
  videoStream?: MediaStream;
}

const NameOverlayCardGlass: React.FC<NameOverlayCardGlassProps> = ({
  image,
  name,
  ratio = "16 / 9",
  videoStream,
}) => {
  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        maxWidth: 300,
        borderRadius: 3,
        overflow: "hidden",
        backdropFilter: "blur(20px)",
        backgroundColor: "rgba(255,255,255,0.1)",
        border: "1px solid rgba(255,255,255,0.25)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
      }}
    >
      {/* Aspect-ratio box */}
      <Box
        sx={{
          position: "relative",
          width: "100%",
          aspectRatio: ratio,
          backgroundColor: "#000",
        }}
      >
        {videoStream ? (
          <video
            autoPlay
            muted
            playsInline
            ref={(el) => {
              if (el && videoStream) el.srcObject = videoStream;
            }}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <Box
            component="img"
            src={image}
            alt={name}
            sx={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        )}

        {/* Liquid glass overlay name tag */}
        <Box
          sx={{
            position: "absolute",
            left: 12,
            bottom: 12,
            bgcolor: "rgba(0, 0, 0, 0.6)", // darker glass background
            color: "#fff",
            px: 1.2,
            py: 0.5,
            borderRadius: 1.5,
            fontSize: "0.85rem",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.1)", // subtle border
            boxShadow: "0 2px 6px rgba(0,0,0,0.5)", // optional: add depth
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {name}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default NameOverlayCardGlass;
