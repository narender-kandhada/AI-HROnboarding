import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { getApiUrl } from "./utils/apiConfig";


// Onboarding Pages
import Dashboard from "./pages/Dashboard";
import PreOnboarding from "./pages/PreOnboarding";
import PersonalDetails from "./pages/PersonalDetails";
import JoiningDay from "./pages/JoiningDay";
import Training from "./pages/Training";
import DepartmentIntro from "./pages/DepartmentIntro";
import Feedback from "./pages/Feedback";
import PreReview from "./pages/PreReview";

// HR Pages
import HrLogin from "./pages/HrLogin";
import HrDashboard from "./pages/HrDashboard";
import EmployeeDetails from "./pages/EmployeeDetails";
import TrackOnboarding from "./pages/TrackOnboarding";
import ITAccountManagement from "./pages/ITAccountManagement";

// Page-specific quick questions configuration
const getQuickQuestionsForPage = (pagePath) => {
  const pageQuickQuestions = {
    // Employee onboarding pages
    "dashboard": [
      "What tasks do I need to complete?",
      "How do I check my onboarding progress?",
      "What is the next step in my onboarding?"
    ],
    "personal-details": [
      "What information do I need to fill in?",
      "How do I update my personal details?",
      "Where can I find my employee ID?"
    ],
    "joining-day": [
      "What should I expect on my joining day?",
      "What documents should I bring?",
      "Who will be my point of contact?"
    ],
    "training": [
      "What training modules do I need to complete?",
      "How do I submit training certificates?",
      "What is POSH certification?"
    ],
    "department-intro": [
      "Who is in my department?",
      "What is my team structure?",
      "Who is my manager?"
    ],
    "feedback": [
      "How do I submit feedback?",
      "What feedback is expected from me?",
      "Can I edit my feedback later?"
    ],
    "pre-review": [
      "What documents have I uploaded?",
      "What is my onboarding status?",
      "Is everything ready for review?"
    ],
    // HR pages
    "pre-onboarding": [
      "How do I add a new employee?",
      "What information is required for pre-onboarding?",
      "How do I send onboarding emails?"
    ],
    "hrdashboard": [
      "What are the onboarding statistics?",
      "How many employees are pending onboarding?",
      "What is the average completion rate?"
    ],
    "employeedetails": [
      "How do I search for an employee?",
      "How do I view employee documents?",
      "How do I update employee status?"
    ],
    "trackonboarding": [
      "Which employees are stuck in onboarding?",
      "What is the current stage of each employee?",
      "How do I filter employees by department?"
    ],
    "it-accounts": [
      "How do I create IT accounts for employees?",
      "What IT accounts are available?",
      "How do I check account status?"
    ],
    // Default fallback
    "default": [
      "What tasks do I need to complete?",
      "How do I upload documents?",
      "What is module progress?"
    ]
  };

  // Extract page name from path
  const pageName = pagePath.split("/")[1] || "dashboard";
  
  // Return questions for the page or default
  return pageQuickQuestions[pageName] || pageQuickQuestions["default"];
};

// Component that uses location
function ChatComponent({ chatMessages, chatInput, setChatInput, sendChatMessage, isTyping, showHistory, setShowHistory, chatEndRef, setIsChatExpanded, setChatMessages }) {
  const location = useLocation();
  const quickQuestions = getQuickQuestionsForPage(location.pathname);

  return (
    <div 
      className="fixed bottom-6 right-6 w-96 bg-white shadow-2xl rounded-2xl overflow-hidden z-50 flex flex-col"
      style={{
        height: "36rem",
        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)"
      }}
    >
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 px-5 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl backdrop-blur-sm">
            🤖
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">SUPA Assistant</h3>
            <p className="text-blue-100 text-xs flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              Online & ready to help
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-white/90 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-all"
            title="View History"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <button
            onClick={() =>
              setChatMessages([
                { from: "bot", text: "Hi! I'm SUPA 🤖. How can I help you today?" }
              ])
            }
            className="text-white/90 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-all"
            title="New Conversation"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            onClick={() => setIsChatExpanded(false)}
            className="text-white/90 hover:text-white hover:bg-red-500/30 p-2 rounded-lg transition-all"
            title="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
        {chatMessages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.from === "bot" ? "justify-start" : "justify-end"} items-start gap-2 animate-fade-in`}
            style={{
              animation: "fadeIn 0.3s ease-in"
            }}
          >
            {msg.from === "bot" && (
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md flex-shrink-0">
                S
              </div>
            )}
            <div
              className={`p-3 rounded-2xl max-w-[75%] break-words shadow-md ${
                msg.from === "bot"
                  ? "bg-white text-gray-800 border border-gray-100"
                  : "bg-gradient-to-br from-blue-600 to-blue-700 text-white"
              }`}
              style={{
                boxShadow: msg.from === "bot" 
                  ? "0 2px 8px rgba(0, 0, 0, 0.1)" 
                  : "0 4px 12px rgba(37, 99, 235, 0.3)"
              }}
            >
              {msg.from === "bot" ? (
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm leading-relaxed">{msg.text}</p>
              )}
            </div>
            {msg.from === "user" && (
              <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md flex-shrink-0">
                U
              </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start items-start gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md flex-shrink-0">
              S
            </div>
            <div className="p-3 rounded-2xl bg-white border border-gray-100 shadow-md">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Quick Suggestions - Page-specific */}
      {chatMessages.length === 1 && (
        <div className="px-4 py-2 bg-blue-50 border-t border-blue-100">
          <p className="text-xs text-gray-600 mb-2 font-medium">💡 Quick questions:</p>
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((suggestion, i) => (
              <button
                key={i}
                onClick={() => {
                  setChatInput(suggestion);
                  setTimeout(() => sendChatMessage(), 100);
                }}
                className="text-xs px-3 py-1.5 bg-white border border-blue-200 rounded-full text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* History Panel */}
      {showHistory && (
        <div className="bg-white p-4 text-sm text-gray-700 border-t border-gray-200 overflow-y-auto max-h-40">
          <p className="font-bold mb-3 text-blue-600 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Conversation History
          </p>
          <ul className="space-y-2">
            {chatMessages.slice(1).map((msg, i) => (
              <li key={i} className="flex items-start gap-2 text-xs">
                <span className="font-bold text-gray-500 min-w-[2rem]">
                  {msg.from === "bot" ? "🤖 SUPA:" : "🧑 You:"}
                </span>
                <span className="bg-gray-100 px-2 py-1 rounded-lg shadow-sm break-words">{msg.text.substring(0, 60)}{msg.text.length > 60 ? "..." : ""}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Enhanced Input Area */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendChatMessage();
                }
              }}
              placeholder="Ask me anything about onboarding..."
              className="w-full p-3 pr-10 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            />
          </div>
          <button
            onClick={sendChatMessage}
            disabled={!chatInput.trim()}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { from: "bot", text: "Hi! I’m SUPA 🤖. How can I help you today?" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const sendChatMessage = async () => {
    const trimmed = chatInput.trim();
    if (!trimmed) return;
  
    const userMessage = { from: "user", text: trimmed };
    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setIsTyping(true);
  
    const tokenFromURL = window.location.pathname.split("/").pop();

    const currentPath = window.location.pathname;
    const page = currentPath.split("/")[1] || "dashboard";
  
    const apiUrl = getApiUrl();
    
    try {
      const res = await fetch(`${apiUrl}/chatbot/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          token: tokenFromURL,
          page: page
        }),
      });
  
      const data = await res.json();
      const botReply = { from: "bot", text: data.response };
  
      setChatMessages((prev) => [...prev, botReply]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { from: "bot", text: "Sorry, something went wrong." },
      ]);
    } finally {
      setIsTyping(false);
    }
  };
    

  return (
    <Router>
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-in;
        }
      `}</style>
      <div className="w-screen h-screen overflow-hidden bg-gray-100 flex flex-col">
        <div className="flex-grow overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/:token" element={<Dashboard />} />
            <Route path="/pre-onboarding" element={<PreOnboarding />} />
            <Route path="/personal-details/:token" element={<PersonalDetails />} />
            <Route path="/joining-day/:token" element={<JoiningDay />} />
            <Route path="/training/:token" element={<Training />} />
            <Route path="/department-intro/:token" element={<DepartmentIntro />} />
            <Route path="/feedback/:token" element={<Feedback />} />
            <Route path="/pre-review/:token" element={<PreReview />} />
            <Route path="/pre-review" element={<PreReview />} />
            <Route path="/hr-login" element={<HrLogin />} />
            <Route path="/hrdashboard" element={<HrDashboard/>}/>
            <Route path="/employeedetails" element={<EmployeeDetails/>}/>
            <Route path="/trackonboarding" element={<TrackOnboarding/>}/>
            <Route path="/it-accounts" element={<ITAccountManagement/>}/>
          </Routes>
        </div>

        {!isChatExpanded && (
          <button
            onClick={() => setIsChatExpanded(true)}
            className="fixed bottom-6 right-6 bg-gradient-to-br from-blue-600 to-blue-700 text-white text-2xl px-5 py-4 rounded-full shadow-2xl hover:shadow-blue-500/50 hover:scale-110 transition-all duration-300 z-50 animate-pulse"
            style={{
              boxShadow: "0 10px 25px rgba(37, 99, 235, 0.4)"
            }}
          >
            🤖
          </button>
        )}

        {isChatExpanded && (
          <ChatComponent
            chatMessages={chatMessages}
            chatInput={chatInput}
            setChatInput={setChatInput}
            sendChatMessage={sendChatMessage}
            isTyping={isTyping}
            showHistory={showHistory}
            setShowHistory={setShowHistory}
            chatEndRef={chatEndRef}
            setIsChatExpanded={setIsChatExpanded}
            setChatMessages={setChatMessages}
          />
        )}
      </div>
    </Router>
  );
}

export default App;