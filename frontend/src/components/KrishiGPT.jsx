"use client"; // ✅ If using Next.js with App Router

import React, { useState, useRef, useEffect } from "react";
import { Mic, Send, X, Square } from "lucide-react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { useLanguage } from "./LanguageContext";

const KrishiGPT = () => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const chatBoxRef = useRef(null);
  const { language: selectedLanguage } = useLanguage();

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  const startMic = () => {
    if (!browserSupportsSpeechRecognition) {
      alert("Speech recognition not supported");
      return;
    }
    resetTranscript();
    setIsListening(true);
    SpeechRecognition.startListening({
      continuous: true,
      language:
        selectedLanguage === "mr"
          ? "mr-IN"
          : selectedLanguage === "hi"
          ? "hi-IN"
          : "en-US",
    });

    setTimeout(() => {
      SpeechRecognition.stopListening();
      setIsListening(false);
    }, 10000);
  };

  const stopMic = () => {
    SpeechRecognition.stopListening();
    setIsListening(false);
  };

  const speakResponse = (text) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang =
        selectedLanguage === "mr"
          ? "mr-IN"
          : selectedLanguage === "hi"
          ? "hi-IN"
          : "en-US";
      window.speechSynthesis.speak(utterance);
    }
  };

  const sendMessage = async (inputText = message) => {
    if (!inputText.trim()) return;
    setMessages((prev) => [...prev, { role: "user", content: inputText }]);

    try {
      const res = await fetch(
        "https://agrisaarthibackend.onrender.com/krishigpt",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: inputText,
            language: selectedLanguage,
          }),
        }
      );

      const data = await res.json();
      const responseText = data.response || "No response from assistant.";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: responseText },
      ]);
      speakResponse(responseText);
      setMessage("");
    } catch (err) {
      console.error("Error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "❌ Failed to get response." },
      ]);
    }
  };

  useEffect(() => {
    if (!isListening && transcript.trim()) {
      setMessage(transcript.trim());
      sendMessage(transcript.trim());
      resetTranscript();
    }
  }, [isListening, transcript, resetTranscript]);

  useEffect(() => {
    chatBoxRef.current?.scrollTo({
      top: chatBoxRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  return (
    <div className="position-fixed bottom-0 end-0 m-4" style={{ zIndex: 1050 }}>
      {open ? (
        <div
          className="card shadow border rounded-3"
          style={{ maxWidth: "22rem", maxHeight: "60vh" }}
        >
          <div className="card-header d-flex justify-content-between align-items-center py-2 px-3 bg-white">
            <h6 className="text-primary m-0">🧠 KrishiGPT</h6>
            <button
              onClick={() => setOpen(false)}
              className="btn btn-sm btn-outline-secondary"
            >
              <X size={18} />
            </button>
          </div>

          <div
            className="card-body overflow-auto border-top"
            ref={chatBoxRef}
            style={{ height: "300px" }}
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-2 rounded mb-2 ${
                  msg.role === "user"
                    ? "bg-success text-white ms-auto text-end"
                    : "bg-info text-dark me-auto text-start"
                }`}
                style={{ maxWidth: "90%", whiteSpace: "pre-wrap" }}
              >
                {msg.content}
              </div>
            ))}
          </div>

          <div className="card-footer d-flex gap-2 align-items-center p-2">
            <button
              onClick={isListening ? stopMic : startMic}
              className={`btn btn-sm ${
                isListening ? "btn-danger" : "btn-secondary"
              }`}
            >
              {isListening ? <Square size={18} /> : <Mic size={18} />}
            </button>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              className="form-control form-control-sm"
              placeholder="Ask something..."
            />
            <button
              onClick={() => sendMessage()}
              className="btn btn-sm btn-success"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="btn btn-success rounded-pill shadow"
        >
          💬 Ask KrishiGPT
        </button>
      )}
    </div>
  );
};

export default KrishiGPT;
