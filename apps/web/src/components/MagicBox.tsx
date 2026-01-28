"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import {
  emitParticleBurstFromElement,
  emitParticleBurstFromEvent,
} from "@/src/lib/particle-events";

interface MagicBoxProps {
  onSendMessage: (message: string) => void;
  isProcessing?: boolean;
}

export function MagicBox({
  onSendMessage,
  isProcessing = false,
}: MagicBoxProps) {
  const [message, setMessage] = useState("");
  const inputRowRef = useRef<HTMLDivElement>(null);

  const suggestions = [
    "Make it snappier",
    "Remove the silence",
    "Delete the second sentence",
    "Cut out the umms and aahs",
    "Make this intro faster",
  ];

  const handleSend = () => {
    if (message.trim() && !isProcessing) {
      emitParticleBurstFromElement(inputRowRef.current, {
        color: "#38bdf8",
        intensity: 1.2,
      });
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (
    event: React.MouseEvent<HTMLButtonElement>,
    suggestion: string,
  ) => {
    if (!isProcessing) {
      emitParticleBurstFromEvent(event, { color: "#a78bfa", intensity: 0.9 });
      onSendMessage(suggestion);
    }
  };

  return (
    <motion.div
      className="border-t border-gray-700 p-4"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2" ref={inputRowRef}>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Tell me what to edit... (e.g., 'Make it snappier')"
            disabled={isProcessing}
            className="flex-1 px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <motion.button
            onClick={handleSend}
            disabled={!message.trim() || isProcessing}
            className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
          >
            <Send
              className={`w-5 h-5 ${isProcessing ? "animate-pulse" : ""}`}
            />
          </motion.button>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-500">Try:</span>
          {suggestions.map((suggestion, index) => (
            <motion.button
              key={index}
              onClick={(event) => handleSuggestionClick(event, suggestion)}
              disabled={isProcessing}
              className="px-3 py-1 text-sm bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-700 rounded-full transition-colors"
              whileHover={{ y: -2, scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
            >
              {suggestion}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
