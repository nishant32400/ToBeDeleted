import React, { useState } from "react";
import ChatPage from "./components/ChatPage";
import "./App.css";

export default function App() {
  const [query, setQuery] = useState("");

  return (
    <div className="flex flex-col h-screen items-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex items-center justify-center mt-6 space-x-3">
        <img src="/src/assets/indigo-logo.png" alt="logo" className="h-10" />
        <h1 className="text-2xl font-bold text-indigo-700">
          FlightOps Smart Agent ✈️
        </h1>
      </div>
      <ChatPage />
    </div>
  );
}
