import React, { useState } from "react";
import MessageBubble from "./MessageBubble";

const AG_AGENT_ENDPOINT = import.meta.env.VITE_AGENT_ENDPOINT || "http://localhost:8001/agent";

export default function ChatPage() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello! 👋 I’m your FlightOps Agent. Ask me anything about flight operations — delays, fuel, passengers, aircraft details, etc.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setInput("");

    const body = {
      thread_id: "thread-" + Date.now(),
      run_id: "run-" + Date.now(),
      messages: [userMessage],
    };

    try {
      const resp = await fetch(AG_AGENT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        const errTxt = await resp.text();
        throw new Error(errTxt);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        let idx;
        while ((idx = buf.indexOf("\n\n")) !== -1) {
          const chunk = buf.slice(0, idx).trim();
          buf = buf.slice(idx + 2);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const payload = line.slice(6).trim();
              if (!payload) continue;

              try {
                const event = JSON.parse(payload);
                handleEvent(event);
              } catch (err) {
                console.warn("Bad SSE line:", payload);
              }
            }
          }
        }
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Error: " + err.message },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleEvent(event) {
    switch (event.type) {
      case "TEXT_MESSAGE_CONTENT":
        if (event.message?.content) {
          // assistant final message
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: event.message.content },
          ]);
        } else if (event.content) {
          // status update
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: "💭 " + event.content },
          ]);
        }
        break;
      case "TOOL_CALL_RESULT":
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "🧰 Tool Result:\n" + event.message.content },
        ]);
        break;
      case "RUN_FINISHED":
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "✅ Run finished." },
        ]);
        break;
      default:
        // ignore other technical events for cleaner chat
        break;
    }
  }

  return (
    <div className="flex flex-col w-full max-w-3xl h-[90%] bg-white shadow-lg rounded-xl mt-6">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {messages.map((msg, idx) => (
          <MessageBubble key={idx} role={msg.role} content={msg.content} />
        ))}
        {loading && (
          <div className="text-gray-500 text-sm mt-2 animate-pulse">
            ✈️ Processing...
          </div>
        )}
      </div>

      <div className="p-4 border-t flex space-x-2">
        <input
          type="text"
          className="flex-1 border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="Ask about a flight, e.g. 'Why was 6E215 delayed on June 23, 2024?'"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="bg-indigo-600 text-white px-5 rounded-lg hover:bg-indigo-700 transition"
          disabled={loading}
        >
          Send
        </button>
      </div>
    </div>
  );
}
