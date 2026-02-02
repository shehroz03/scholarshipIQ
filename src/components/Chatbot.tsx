import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { MessageCircle, X, Send, Sparkles, Loader2, GraduationCap } from "lucide-react";
import { Badge } from "./ui/badge";
import { api } from "../api";

interface Message {
  role: string;
  content: string;
  fileName?: string;
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm your ScholarIQ AI assistant. I can analyze scholarship documents (PDF/Images). How can I help you today?"
    }
  ]);
  const [input, setInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const chatbotRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load history when chat opens
  useEffect(() => {
    const fetchHistory = async () => {
      if (isOpen) {
        try {
          const history = await api.chatbot.getHistory();
          const mappedHistory: Message[] = history.map((msg: any) => ({
            role: msg.role === "ai" ? "assistant" : "user",
            content: msg.content,
            fileName: msg.file_name
          }));

          if (mappedHistory.length > 0) {
            setMessages([
              {
                role: "assistant",
                content: "Welcome back! Here's your previous conversation history."
              },
              ...mappedHistory
            ]);
          }
        } catch (err) {
          console.error("Failed to fetch chat history:", err);
        }
      }
    };
    fetchHistory();
  }, [isOpen]);

  // Close chatbot when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (chatbotRef.current && !chatbotRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const quickPrompts = [
    "IELTS requirement",
    "Fully funded scholarships",
    "Deadlines info",
    "Analyze my document"
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSend = async (text?: string) => {
    const messageText = text || input;
    if ((!messageText.trim() && !selectedFile) || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: messageText || (selectedFile ? "Analyze this file" : ""),
      fileName: selectedFile?.name
    };

    setMessages((prev: Message[]) => [...prev, userMessage]);
    const currentFile = selectedFile;
    setInput("");
    setSelectedFile(null);
    setIsLoading(true);

    try {
      const response = await api.chatbot.sendMessage(messageText || "Analyze this file", currentFile || undefined);
      setMessages((prev: Message[]) => [...prev, { role: "assistant", content: response.reply }]);
    } catch (err) {
      setMessages((prev: Message[]) => [...prev, { role: "assistant", content: "Sorry, I'm having trouble analyzing the file. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl bg-[#1e3a8a] max-md:bottom-20 max-md:right-4 hover:bg-[#1e3a8a]/90 p-0 z-50 transition-all hover:scale-110 active:scale-95"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <div ref={chatbotRef}>
      <Card className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-2rem)] shadow-2xl border-none z-50 flex flex-col animate-in slide-in-from-bottom-4">
        <CardHeader className="bg-gradient-to-r from-[#1e3a8a] to-[#2563eb] text-white rounded-t-lg flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-yellow-200" />
              </div>
              <div>
                <CardTitle className="text-white text-lg">AI Vision Assistant</CardTitle>
                <p className="text-[10px] text-blue-100 uppercase tracking-widest font-bold">Powered by GPT-4o</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden bg-gray-50/50">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, i) => (
              <div
                key={i}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm ${message.role === "user"
                    ? "bg-[#1e3a8a] text-white rounded-br-none"
                    : "bg-white text-gray-900 border border-gray-100 rounded-bl-none"
                    }`}
                >
                  {message.fileName && (
                    <div className="flex items-center gap-2 mb-1.5 bg-white/10 p-1 rounded text-[10px] font-bold">
                      📎 {message.fileName}
                    </div>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start animate-in fade-in">
                <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-none px-4 py-2.5 shadow-sm">
                  <div className="flex gap-1 items-center">
                    <Loader2 className="w-3 h-3 animate-spin text-[#1e3a8a] mr-1" />
                    <span className="text-[10px] font-bold text-gray-400">AI is analyzing...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-white border-t flex-shrink-0">
            {/* File Preview */}
            {selectedFile && (
              <div className="flex items-center justify-between bg-blue-50 p-2 rounded-xl mb-3 border border-blue-100 animate-in slide-in-from-bottom-2">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                    <GraduationCap className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-xs font-bold text-blue-800 truncate">{selectedFile.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                  className="h-6 w-6 p-0 hover:bg-blue-100 text-blue-800"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,application/pdf"
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="h-11 w-11 rounded-xl border-gray-200 hover:bg-gray-50 p-0 shrink-0"
              >
                <div className="relative">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  {selectedFile && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>}
                </div>
              </Button>
              <Input
                placeholder="Ask or upload a doc..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="flex-1 bg-gray-50 border-gray-200 h-11 rounded-xl focus:bg-white transition-colors text-sm"
                disabled={isLoading}
              />
              <Button
                onClick={() => handleSend()}
                disabled={isLoading || (!input.trim() && !selectedFile)}
                className="bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 h-11 w-11 rounded-xl p-0 shadow-lg shadow-blue-900/10"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
