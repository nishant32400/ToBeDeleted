import React from "react";

export default function MessageBubble({ role, content }) {
  const isUser = role === "user";
  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} animate-fadeIn`}
    >
      <div
        className={`max-w-[80%] px-4 py-2 rounded-2xl shadow text-sm whitespace-pre-line ${
          isUser
            ? "bg-indigo-600 text-white rounded-br-none"
            : "bg-gray-200 text-gray-800 rounded-bl-none"
        }`}
      >
        {content}
      </div>
    </div>
  );
}
