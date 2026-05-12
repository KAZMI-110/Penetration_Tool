import { useState, useEffect, useCallback, useRef } from "react";

export interface LogLine {
  id: string;
  ts: string;
  level: "INFO" | "TEST" | "HIT" | "WARN" | "OK";
  msg: string;
}

export function useRealScan(isActive: boolean = true) {
  const [lines, setLines] = useState<LogLine[]>([]);
  const [status, setStatus] = useState<any>(null);
  const completedRef = useRef(false);

  const addLine = useCallback((msg: string, level: LogLine["level"] = "INFO") => {
    const newLine: LogLine = {
      id: Math.random().toString(36).substr(2, 9),
      ts: new Date().toLocaleTimeString(),
      level,
      msg,
    };
    setLines((prev) => [...prev, newLine].slice(-100));
  }, []);

  // Reset completed state when a new scan starts
  useEffect(() => {
    if (isActive) {
      completedRef.current = false;
    }
  }, [isActive]);

  useEffect(() => {
    if (!isActive || completedRef.current) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const backendUrl = import.meta.env.VITE_API_URL || "";

    let wsUrl: string;
    if (backendUrl) {
      // If VITE_API_URL is "https://api.example.com", convert to "wss://api.example.com/ws/scan-status"
      const wsBase = backendUrl.replace(/^http/, "ws");
      wsUrl = `${wsBase}/ws/scan-status`;
    } else {
      // Fallback to current host (works for local proxy or same-domain deployment)
      wsUrl = `${protocol}//${window.location.host}/ws/scan-status`;
    }

    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      addLine("Engine link established. Synchronizing...", "OK");
    };

    socket.onmessage = (event) => {
      // Ignore messages after we've already marked complete
      if (completedRef.current) return;

      const data = JSON.parse(event.data);

      if (data.status === "Complete") {
        completedRef.current = true;
        setStatus(data);
        addLine(`Scan finished [${data.target}] — 100% complete`, "OK");
        addLine("All modules executed. Report ready.", "OK");
        // Close the socket — we're done
        socket.close();
        return;
      }

      if (data.status === "Idle") {
        // No active scan — don't log spam
        return;
      }

      // Active scan — update status and log
      setStatus(data);
      addLine(`${data.status} [${data.target}] — ${data.progress}% complete`, "INFO");
    };

    socket.onerror = () => {
      if (!completedRef.current) {
        addLine("Connection error detected.", "WARN");
      }
    };

    socket.onclose = () => {
      if (!completedRef.current) {
        addLine("Link severed. Feed terminated.", "WARN");
      }
    };

    return () => {
      socket.close();
    };
  }, [isActive, addLine]);

  return { lines, status };
}
