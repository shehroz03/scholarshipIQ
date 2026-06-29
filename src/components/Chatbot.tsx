import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { X, Send, Sparkles, Loader2, GraduationCap, Bot, Shield } from "lucide-react";
import { Badge } from "./ui/badge";
import { api } from "../api";
import { useUser } from "../context/UserContext";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  role: string;
  content: string;
  fileName?: string;
}


// Role-specific welcome messages
const getRoleWelcome = (role: "student" | "teacher" | "admin", userName: string) => {
  const nameStr = userName ? ` ${userName}` : "";
  if (role === "student") {
    return `👋 Hi${nameStr}! I'm your **Student Assistant**, powered by GPT-4o.\n\nI can help you with:\n- 🎓 Scholarship recommendations (by CGPA, country, and field)\n- 📄 Document review (SOP, CV, transcripts)\n- 🌍 Visa guidance (UK, Germany, Australia, Canada)\n- 🚨 Fake scholarship detection\n\nType your question or upload a document!`;
  }
  if (role === "teacher") {
    return `👋 Hello${nameStr}! I am your **Teacher Assistant**, powered by GPT-4o.\n\nI can help you with:\n- 👩‍🎓 Student scholarship guidance plans\n- 📝 Recommendation letter structure\n- 📚 IELTS/TOEFL preparation plans\n- 🔍 Best scholarships for student profiles\n\nFeel free to ask anything!`;
  }
  return `👋 Hello${nameStr}! I am **Admin Intelligence**, powered by GPT-4o.\n\nI can assist with platform management:\n- 🛡️ Fraud detection pattern analysis\n- 📊 Platform analytics and user trends\n- ⚙️ Auto-verify pipeline insights\n- ✅ Scholarship approval decisions\n\nAsk me anything about admin operations!`;
};


export function Chatbot() {
  const { status } = useUser();
  const userName = status?.full_name ? status.full_name.split(' ')[0] : "";
  
  const [isOpen, setIsOpen] = useState(false);

  // Initial messages set hoga role detect hone ke baad
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const chatbotRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasLoadedHistory = useRef<boolean>(false);

  // ── Role-aware assistant identity (distinct shape + colour + icon per role) ──
  // FIX: Teacher role must be checked FIRST before admin, because teacher login
  // sometimes leaves admin_logged_in in storage from a previous session.
  // Priority: teacher (by userRole) > admin (by admin_logged_in) > student
  const getRole = (): "student" | "teacher" | "admin" => {
    const userRole = localStorage.getItem("userRole");
    const adminLoggedIn = localStorage.getItem("admin_logged_in");
    if (userRole === "teacher") return "teacher";
    if (adminLoggedIn === "true") return "admin";
    return "student";
  };

  const [role, setRole] = useState<"student" | "teacher" | "admin">(getRole);

  const ONBOARDING_QUESTIONS = [
    {
      id: "cgpa",
      question: "Welcome! To give you the best advice, let's do a quick profile check. Is your current CGPA above or below 3.0?",
      options: ["Above 3.0", "Below 3.0", "Not sure"]
    },
    {
      id: "english",
      question: "Got it. Have you already taken an English proficiency test like IELTS or TOEFL?",
      options: ["Yes, I have", "Planning to take it", "Not yet"]
    },
    {
      id: "region",
      question: "Great. Which region are you primarily targeting for your studies?",
      options: ["UK & Europe", "USA & Canada", "Australia & NZ", "Anywhere"]
    },
    {
      id: "funding",
      question: "Finally, what kind of scholarship funding are you looking for?",
      options: ["Fully Funded (100%)", "Partially Funded is fine", "Self-funded mostly"]
    }
  ];

  const [isOnboarding, setIsOnboarding] = useState<boolean>(() => {
    return getRole() === "student" && localStorage.getItem("onboardingComplete") !== "true";
  });
  const [onboardingStep, setOnboardingStep] = useState<number>(0);
  const [onboardingAnswers, setOnboardingAnswers] = useState<Record<string, string>>({});

  // Re-evaluate role whenever localStorage changes (e.g. login/logout)
  useEffect(() => {
    const handleStorage = () => setRole(getRole());
    window.addEventListener("storage", handleStorage);
    const detectedRole = getRole();
    setRole(detectedRole);
    // Set role-specific welcome message on mount
    setMessages([{ role: "assistant", content: getRoleWelcome(detectedRole, userName) }]);
    return () => window.removeEventListener("storage", handleStorage);
  }, [userName]);

  // Update welcome message when role changes
  useEffect(() => {
    if (isOnboarding) {
      setMessages([{ role: "assistant", content: ONBOARDING_QUESTIONS[0].question }]);
    } else {
      setMessages([{ role: "assistant", content: getRoleWelcome(role, userName) }]);
    }
  }, [role, userName, isOnboarding]);

  const ROLE_THEME = {
    student: {
      name: "Student Assistant",
      subtitle: "Scholarships & Visas",
      Icon: Bot,
      gradient: "linear-gradient(135deg, #2563eb 0%, #e8b43a 100%)",
      headerGradient: "linear-gradient(135deg, #0B0F19 0%, #111827 100%)",
      glow: "rgba(37,99,235,0.45)",
      accentColor: "#3b82f6",
      accentBg: "rgba(59, 130, 246, 0.1)",
      borderRadius: "50%",
      clipPath: "none",
    },
    teacher: {
      name: "Teacher Assistant",
      subtitle: "Curriculum & Mentoring",
      Icon: GraduationCap,
      gradient: "linear-gradient(135deg, #059669 0%, #0d9488 100%)",
      headerGradient: "linear-gradient(135deg, #0B0F19 0%, #111827 100%)",
      glow: "rgba(5,150,105,0.45)",
      accentColor: "#10b981",
      accentBg: "rgba(16, 185, 129, 0.1)",
      borderRadius: "20px",
      clipPath: "none",
    },
    admin: {
      name: "Admin Intelligence",
      subtitle: "Platform Analytics",
      Icon: Shield,
      gradient: "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
      headerGradient: "linear-gradient(135deg, #0B0F19 0%, #111827 100%)",
      glow: "rgba(217,119,6,0.5)",
      accentColor: "#f59e0b",
      accentBg: "rgba(245, 158, 11, 0.1)",
      borderRadius: "0",
      clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
    },
  } as const;

  const theme = ROLE_THEME[role];
  const RoleIcon = theme.Icon;

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Load history ONCE when chat first opens
  useEffect(() => {
    const fetchHistory = async () => {
      if (isOpen && !isOnboarding && !hasLoadedHistory.current) {
        hasLoadedHistory.current = true;
        try {
          let history;
          if (role === "admin") {
            history = await api.chatbot.getAdminHistory();
          } else {
            history = await api.chatbot.getHistory(role);
          }
          
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
  }, [isOpen, role, isOnboarding]);

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

    if (isOnboarding) {
      const currentQ = ONBOARDING_QUESTIONS[onboardingStep];
      const newAnswers = { ...onboardingAnswers, [currentQ.id]: messageText };
      setOnboardingAnswers(newAnswers);
      
      const newMessages = [...messages, { role: "user", content: messageText }];
      
      if (onboardingStep < ONBOARDING_QUESTIONS.length - 1) {
        setOnboardingStep(prev => prev + 1);
        setMessages([...newMessages, { role: "assistant", content: ONBOARDING_QUESTIONS[onboardingStep + 1].question }]);
      } else {
        localStorage.setItem("onboardingComplete", "true");
        setIsOnboarding(false);
        setIsLoading(true);
        setMessages([...newMessages]);
        
        const profileDataStr = Object.entries(newAnswers).map(([k, v]) => `${k}: ${v}`).join(", ");
        const initMessage = `System Context: The user just completed onboarding. Their profile data is: ${profileDataStr}. Acknowledge this and tell them you are ready to help them as a personalized expert advisor. Keep it short and encouraging.`;
        
        try {
           const response = await api.chatbot.sendMessage(initMessage);
           setMessages([...newMessages, { role: "assistant", content: response.reply || response.response || response.message || "Perfect! I've set up your profile. What would you like to ask?" }]);
        } catch (e) {
           setMessages([...newMessages, { role: "assistant", content: "Perfect! I've set up your profile. What would you like to ask?" }]);
        } finally {
           setIsLoading(false);
        }
      }
      setInput("");
      return;
    }

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
      let response: any;
      // BUG FIX: Send correct role/mode to backend so system prompt matches the logged-in role
      if (role === "admin") {
        response = await api.chatbot.sendAdminMessage(messageText || "Help me with admin tasks");
      } else if (role === "teacher") {
        response = await api.chatbot.sendTeacherMessage(messageText || "Help me with teacher tasks");
      } else {
        response = await api.chatbot.sendMessage(messageText || "Help me find scholarships", currentFile || undefined);
      }
      const reply = response.reply || response.response || response.message || "Sorry, no response received.";
      setMessages((prev: Message[]) => [...prev, { role: "assistant", content: reply }]);
    } catch (err: any) {
      const errMsg = err?.message?.includes("Backend") || err?.message?.includes("fetch")
        ? "⚠️ Unable to connect to the backend. Please ensure the backend server is running (port 8000)."
        : "⚠️ Something went wrong. Please try again shortly.";
      setMessages((prev: Message[]) => [...prev, { role: "assistant", content: errMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (role === "admin") {
    return null; // Admin uses the full-page AdminAIChat component
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        aria-label={`Open ${theme.name}`}
        className="fixed bottom-6 right-6 max-md:bottom-20 max-md:right-4 z-50 flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
        style={{
          width: "60px",
          height: "60px",
          background: theme.gradient,
          borderRadius: theme.borderRadius,
          clipPath: theme.clipPath,
          border: "none",
          cursor: "pointer",
          boxShadow: `0 10px 30px ${theme.glow}`,
        }}
      >
        <RoleIcon className="w-7 h-7" style={{ color: "#fff" }} strokeWidth={2} />
        {/* notification dot */}
        <span
          style={{
            position: "absolute",
            top: theme.clipPath === "none" ? "6px" : "10px",
            right: theme.clipPath === "none" ? "6px" : "14px",
            width: "12px",
            height: "12px",
            background: "#ef4444",
            border: "2px solid #fff",
            borderRadius: "50%",
          }}
        />
      </button>
    );
  }

  return (
    <div ref={chatbotRef}>
      <Card 
        className="fixed bottom-6 right-6 border-none z-50 flex flex-col animate-in slide-in-from-bottom-4 bg-white overflow-hidden" 
        style={{ 
          width: '420px', 
          maxWidth: 'calc(100vw - 2rem)', 
          height: '650px', 
          maxHeight: 'calc(100vh - 2rem)', 
          borderRadius: '24px',
          backgroundColor: '#ffffff', 
          boxShadow: '0 0 40px rgba(0,0,0,0.15)' 
        }}
      >
        {/* Header */}
        <CardHeader className="text-white flex-shrink-0 px-4 py-3" style={{ background: theme.headerGradient }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div
                  className="w-10 h-10 bg-white/10 flex items-center justify-center relative z-10"
                  style={{ borderRadius: theme.clipPath === "none" ? theme.borderRadius : "10px", clipPath: theme.clipPath }}
                >
                  <RoleIcon className="w-6 h-6 text-white" />
                </div>
                {/* Online Dot */}
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full z-20"></span>
              </div>
              <div>
                <CardTitle className="text-white text-[16px] font-bold tracking-wide">{theme.name}</CardTitle>
                <p className="text-[11px] font-semibold" style={{ color: theme.accentColor }}>
                  {theme.subtitle}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="text-white hover:bg-white/10 h-8 w-8 p-0 rounded-full">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        {/* Safety Banner */}
        <div className="bg-[#f0fdf4] border-b border-green-100 py-1.5 px-4 flex items-center gap-2 justify-center shrink-0">
          <Shield className="w-3 h-3 text-green-600" />
          <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider">AI guidance - Verify critical info</span>
        </div>

        {/* Chat Content */}
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden relative" style={{ backgroundColor: '#f1f5f9' }}>
          <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
            {messages.map((message, i) => (
              <div key={i} className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"} animate-in fade-in slide-in-from-bottom-2`}>
                
                {/* Avatar/Name Header for AI */}
                {message.role !== "user" && (
                  <div className="flex items-center gap-2 mb-1.5 ml-1">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center border" style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}>
                      <RoleIcon className="w-3 h-3" style={{ color: '#ffffff' }} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#475569' }}>{theme.name}</span>
                    <Badge variant="secondary" className="text-[8px] h-4 px-1 border ml-1" style={{ backgroundColor: '#e2e8f0', color: '#475569', borderColor: '#cbd5e1' }}>AI</Badge>
                  </div>
                )}

                <div
                  className={`max-w-[88%] px-4 py-3 shadow-md text-sm leading-relaxed ${message.role === "user"
                      ? "rounded-2xl rounded-br-sm ml-auto font-medium"
                      : "border border-l-4 rounded-r-2xl rounded-bl-sm"
                    }`}
                  style={message.role === "user" ? { backgroundColor: '#2563eb', color: '#ffffff' } : { backgroundColor: '#ffffff', color: '#1e293b', borderLeftColor: theme.accentColor, borderColor: '#e2e8f0', borderLeftWidth: '4px' }}
                >
                  {message.fileName && (
                    <div className={`flex items-center gap-2 mb-2 p-1.5 rounded-lg text-[10px] font-bold ${message.role === 'user' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                      📎 {message.fileName}
                    </div>
                  )}
                  
                  {message.role === "user" ? (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  ) : (
                    <div className="prose prose-sm max-w-none prose-p:leading-relaxed" style={{ color: '#1e293b' }}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex flex-col items-start animate-in fade-in">
                <div className="flex items-center gap-2 mb-1.5 ml-1">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center border" style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}>
                    <RoleIcon className="w-3 h-3" style={{ color: '#ffffff' }} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#475569' }}>{theme.name}</span>
                </div>
                <div className="border border-l-4 rounded-r-2xl rounded-bl-sm px-4 py-3 shadow-md flex items-center gap-2" style={{ backgroundColor: '#ffffff', borderLeftColor: theme.accentColor, borderColor: '#e2e8f0', borderLeftWidth: '4px' }}>
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: theme.accentColor }} />
                  <span className="text-xs font-medium" style={{ color: '#475569' }}>Typing...</span>
                </div>
              </div>
            )}
            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts & Input Area */}
          <div className="p-4 bg-white border-t border-slate-200 flex-shrink-0 flex flex-col gap-3" style={{ backgroundColor: '#ffffff' }}>
            
            {/* Quick Prompts */}
            {isOnboarding ? (
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {ONBOARDING_QUESTIONS[onboardingStep].options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(opt)}
                    className="whitespace-nowrap px-3 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 transition-colors shadow-sm"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              messages.length <= 1 && !selectedFile && (
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {quickPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(prompt)}
                      className="whitespace-nowrap px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-600 text-xs font-medium hover:bg-slate-50 transition-colors shadow-sm"
                    >
                      {idx === 0 ? "🔥 " : idx === 1 ? "🎓 " : idx === 2 ? "🌍 " : "📝 "}
                      {prompt}
                    </button>
                  ))}
                </div>
              )
            )}

            {/* File Preview */}
            {selectedFile && (
              <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200 animate-in slide-in-from-bottom-2">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-8 h-8 bg-white rounded-lg border border-slate-200 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-xs font-medium text-slate-700 truncate">{selectedFile.name}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedFile(null)} className="h-6 w-6 p-0 hover:bg-slate-200 text-slate-500">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Input Form */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full p-1.5 focus-within:border-slate-300 focus-within:bg-white shadow-inner transition-colors">
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,application/pdf" className="hidden" />
              <Button
                variant="ghost"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="h-10 w-10 rounded-full hover:bg-slate-200 p-0 shrink-0 text-slate-500"
              >
                <div className="relative">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  {selectedFile && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>}
                </div>
              </Button>
              <Input
                placeholder="Type your reply..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-sm text-slate-800 placeholder-slate-400 h-10 px-2 shadow-none"
                disabled={isLoading}
              />
              <Button
                onClick={() => handleSend()}
                disabled={isLoading || (!input.trim() && !selectedFile)}
                className="h-10 w-10 rounded-full p-0 flex-shrink-0 transition-all hover:scale-105 active:scale-95 shadow-md"
                style={{ background: (!input.trim() && !selectedFile) ? '#e2e8f0' : theme.accentColor, color: (!input.trim() && !selectedFile) ? '#94a3b8' : 'white' }}
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
