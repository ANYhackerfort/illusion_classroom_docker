// hooks/useVideoSocket.ts
import { useEffect, useRef, useState, useCallback } from "react";

export interface VideoState {
  stopped: boolean;
  current_time: number;
  speed: number;
}

export function useVideoSocket(roomName: string) {
  const socketRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [socketInstance, setSocketInstance] = useState<WebSocket | null>(null);

  useEffect(() => {
    if (!roomName) return;

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${protocol}://${window.location.host}/ws/meeting/${roomName}/`);
    socketRef.current = ws;
    setSocketInstance(ws);

    ws.onopen = () => {
      console.log("✅ WebSocket connected to", roomName);
      setConnected(true);

      ws.send(
        JSON.stringify({
          type: "update_state",
          stopped: true,
          current_time: 0,
          speed: 1,
        }),
      );
    };

    ws.onerror = (err) => {
      console.error("❌ WebSocket error:", err);
    };

    ws.onclose = () => {
      console.log("🔌 WebSocket disconnected from", roomName);
      setConnected(false);
    };

    return () => {
      ws.close();
      setConnected(false);
      setSocketInstance(null);
    };
  }, [roomName]);

  const sendMessage = useCallback((msg: any) => {
    const socket = socketRef.current;
    console.log("current socket:", socket);
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.warn("WebSocket not ready.");
      return;
    }
    socket.send(JSON.stringify(msg));
  }, []);

  const updateVideoState = useCallback(
    (stateUpdate: Partial<VideoState>) => {
      console.log("📤 Sending video state update:", stateUpdate);
      sendMessage({
        type: "update_state",
        ...stateUpdate,
      });
    },
    [sendMessage],
  );

  const startMeeting = useCallback(() => {
    console.log("🚀 Starting meeting");
    sendMessage({ type: "start_meeting" });
  }, [sendMessage]);

  return {
    socket: socketInstance,
    sendMessage,
    updateVideoState,
    startMeeting,
    connected,
  };
}
