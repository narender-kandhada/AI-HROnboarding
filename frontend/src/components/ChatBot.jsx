import React, { useState, useEffect, useRef } from "react";
import { matchQueryToTag } from "../utils/queryTagger";
import { responseMap } from "../utils/responseMap";

function ChatBot() {
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi! I’m SUPA 🤖. Ask me anything about onboarding!" }
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;

    const newMessage = { from: "user", text: input };
    setMessages((prev) => [...prev, newMessage]);
    setInput("");

    // Match query to tag and get response
    const tag = matchQueryToTag(input);
    const response = responseMap[tag] || responseMap["unrecognized_query"];

    const botResponse = { from: "bot", text: response };
    setTimeout(() => {
      setMessages((prev) => [...prev, botResponse]);
    }, 500);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div
      className="w-80 h-96 bg-white rounded-2xl shadow-lg flex flex-col overflow-hidden"
      role="region"
      aria-label="SUPA ChatBot"
    >
      {/* Header */}
      <div className="bg-blue-600 text-white p-3 font-semibold rounded-t-2xl">
        SUPA Chat
      </div>

      {/* Messages */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${
              msg.from === "bot" ? "justify-start" : "justify-end"
            }`}
          >
            <div
              className={`p-2 rounded-xl max-w-xs break-words ${
                msg.from === "bot"
                  ? "bg-gray-100 text-gray-800"
                  : "bg-blue-600 text-white"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-2 border-t border-gray-200 flex">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          aria-label="Chat input"
          className="flex-1 p-2 border border-gray-300 rounded-l-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-4 py-2 rounded-r-xl hover:bg-blue-700 transition"
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default ChatBot;