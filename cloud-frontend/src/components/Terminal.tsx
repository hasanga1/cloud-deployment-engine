"use client";
import { useEffect, useState, useRef } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { X, Terminal as TerminalIcon, Loader2 } from "lucide-react";

interface TerminalProps {
  onClose: () => void;
}

export default function Terminal({ onClose }: TerminalProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState("Connecting...");
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Initialize Stomp Client
    const client = new Client({
      // We connect to the Gateway (8080), which routes to Core (9001)
      webSocketFactory: () => new WebSocket("ws://localhost:8081/ws"),

      onConnect: () => {
        setStatus("Connected to Build Server");

        // 2. Subscribe to the global logs topic
        client.subscribe("/topic/logs", (message) => {
          const log = message.body;
          setLogs((prev) => [...prev, log]);
        });
      },

      onDisconnect: () => {
        setStatus("Disconnected");
      },

      onStompError: (frame) => {
        console.error("Broker reported error: " + frame.headers["message"]);
        setStatus("Connection Error");
      },
    });

    client.activate();

    // Cleanup on unmount
    return () => {
      client.deactivate();
    };
  }, []);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="fixed bottom-0 left-0 right-0 h-96 bg-gray-900 border-t-2 border-blue-500 shadow-2xl flex flex-col font-mono text-sm z-50">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-2 flex justify-between items-center border-b border-gray-700">
        <div className="flex items-center gap-2 text-blue-400">
          <TerminalIcon size={16} />
          <span className="font-semibold">Live Build Console</span>
          <span className="text-gray-500 text-xs ml-2">[{status}]</span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition"
        >
          <X size={20} />
        </button>
      </div>

      {/* Logs Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-black text-green-400">
        {logs.length === 0 && (
          <div className="flex items-center gap-2 text-gray-500 italic">
            <Loader2 className="animate-spin" size={14} /> Waiting for logs...
          </div>
        )}

        {logs.map((log, index) => (
          <div
            key={index}
            className="break-words whitespace-pre-wrap font-mono"
          >
            <span className="text-gray-600 select-none mr-2">$</span>
            {log}
          </div>
        ))}
        {/* Invisible element to scroll to */}
        <div ref={logsEndRef} />
      </div>
    </div>
  );
}
