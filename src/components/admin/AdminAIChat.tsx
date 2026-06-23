import { useState, useRef, useEffect } from "react";
import { api } from "../../api";
import {
    Send, Sparkles, Bot, User, Trash2, Copy, Check,
    ShieldAlert, BarChart3, Users, Zap, GraduationCap, Database,
    TrendingUp, MessageSquare
} from "lucide-react";

interface Message {
    role: "user" | "assistant";
    content: string;
    ts?: string;
}

const QUICK_PROMPTS = [
    { label: "User Stats",          text: "How many users registered this week?",             icon: Users,        color: "from-blue-500 to-blue-600" },
    { label: "Fraud Analysis",      text: "Analyze fraud patterns in the system",             icon: ShieldAlert,  color: "from-red-500 to-rose-600" },
    { label: "Pipeline Status",     text: "How is the auto-verify pipeline performing?",      icon: Zap,          color: "from-amber-500 to-orange-500" },
    { label: "Teacher Approvals",   text: "How many teachers are pending approval?",          icon: GraduationCap,color: "from-green-500 to-emerald-600" },
    { label: "Scholarship Summary", text: "Give me a summary of all scholarships in the DB", icon: Database,     color: "from-purple-500 to-violet-600" },
    { label: "Data Quality",        text: "Suggest improvements for data quality",            icon: BarChart3,    color: "from-cyan-500 to-sky-600" },
    { label: "Growth Trends",       text: "Show me platform growth trends this month",        icon: TrendingUp,   color: "from-pink-500 to-fuchsia-600" },
    { label: "Recent Activity",     text: "What are the most recent activities on the platform?", icon: MessageSquare, color: "from-indigo-500 to-blue-600" },
];

function renderMarkdown(text: string) {
    const lines = text.split("\n");
    const nodes: React.ReactNode[] = [];
    let i = 0;

    const parseInline = (line: string): React.ReactNode => {
        // bold: wrap in styled span
        let html = line
            .replace(/\*\*\*(.*?)\*\*\*/g, '<strong style="color:#e2e8f0;font-weight:700"><em>$1</em></strong>')
            .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#e9d5ff;font-weight:700">$1</strong>')
            .replace(/\*(.*?)\*/g, '<em style="color:#c4b5fd">$1</em>')
            .replace(/`([^`]+)`/g, '<code style="background:rgba(99,102,241,0.2);color:#a78bfa;padding:2px 7px;border-radius:5px;font-family:monospace;font-size:0.78em;border:1px solid rgba(139,92,246,0.25)">$1</code>');
        return <span dangerouslySetInnerHTML={{ __html: html }} />;
    };

    // detect "Label: value" stat lines  e.g.  **Total Users**: 16 users...
    const isStatLine = (line: string) => /^\*\*[^*]+\*\*\s*:/.test(line);

    while (i < lines.length) {
        const line = lines[i];

        if (line.startsWith("### ")) {
            nodes.push(
                <div key={i} className="flex items-center gap-2 mt-5 mb-2">
                    <span className="w-1 h-5 rounded-full bg-gradient-to-b from-violet-400 to-blue-500 shrink-0" />
                    <p className="font-bold text-violet-300 text-sm tracking-wide">{parseInline(line.slice(4))}</p>
                </div>
            );
        } else if (line.startsWith("## ")) {
            nodes.push(
                <p key={i} className="font-extrabold text-white text-base mt-5 mb-2 pb-1.5"
                    style={{ borderBottom: "1px solid rgba(139,92,246,0.2)" }}>
                    {parseInline(line.slice(3))}
                </p>
            );
        } else if (/^\d+\.\s/.test(line)) {
            const items: React.ReactNode[] = [];
            let n = 1;
            while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
                const txt = lines[i].replace(/^\d+\.\s/, "");
                items.push(
                    <li key={i} className="flex items-start gap-3 py-1">
                        <span className="w-5 h-5 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{n}</span>
                        <span className="text-sm text-gray-200 leading-relaxed">{parseInline(txt)}</span>
                    </li>
                );
                i++; n++;
            }
            nodes.push(<ul key={`ol-${i}`} className="space-y-0.5 my-3 list-none">{items}</ul>);
            continue;
        } else if (/^[-*]\s/.test(line)) {
            const items: React.ReactNode[] = [];
            while (i < lines.length && /^[-*]\s/.test(lines[i])) {
                const txt = lines[i].replace(/^[-*]\s/, "");
                items.push(
                    <li key={i} className="flex items-start gap-2.5 py-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-2 shrink-0" style={{ boxShadow: "0 0 4px rgba(167,139,250,0.6)" }} />
                        <span className="text-sm text-gray-200 leading-relaxed">{parseInline(txt)}</span>
                    </li>
                );
                i++;
            }
            nodes.push(<ul key={`ul-${i}`} className="space-y-0.5 my-3 list-none">{items}</ul>);
            continue;
        } else if (/^---+$/.test(line.trim())) {
            nodes.push(<hr key={i} className="my-4" style={{ borderColor: "rgba(139,92,246,0.2)" }} />);
        } else if (line.trim() === "") {
            nodes.push(<div key={i} className="h-2" />);
        } else if (isStatLine(line)) {
            // Render "**Label**: description" as a highlighted stat card
            const match = line.match(/^\*\*([^*]+)\*\*\s*:(.*)/);
            if (match) {
                nodes.push(
                    <div key={i} className="flex items-start gap-3 my-1.5 px-3 py-2.5 rounded-xl"
                        style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(139,92,246,0.15)" }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-2 shrink-0" style={{ boxShadow: "0 0 6px rgba(167,139,250,0.7)" }} />
                        <p className="text-sm leading-relaxed text-gray-200">
                            <strong style={{ color: "#c4b5fd", fontWeight: 600 }}>{match[1]}</strong>
                            <span style={{ color: "#94a3b8" }}>:</span>
                            <span style={{ color: "#cbd5e1" }}>{match[2]}</span>
                        </p>
                    </div>
                );
            }
        } else {
            nodes.push(
                <p key={i} className="text-sm leading-relaxed text-gray-300">{parseInline(line)}</p>
            );
        }
        i++;
    }
    return nodes;
}

function TypingDots() {
    return (
        <div className="flex items-center gap-1.5 py-1">
            {[0, 1, 2].map(n => (
                <span key={n} className="w-2 h-2 rounded-full bg-violet-400 inline-block"
                    style={{ animation: `aiDotBounce 1.4s ease-in-out ${n * 0.18}s infinite` }} />
            ))}
            <style>{`@keyframes aiDotBounce{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-7px);opacity:1}}`}</style>
        </div>
    );
}

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button onClick={copy} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-white/10 text-gray-500 hover:text-gray-300">
            {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
        </button>
    );
}

const STORAGE_KEY = "admin_ai_chat_history";

const INITIAL_MSG: Message = {
    role: "assistant",
    content: "👋 **Salam! Main ScholarIQ Admin Intelligence hoon.**\n\nMain aapka dedicated AI assistant hoon jo live database access ke saath kaam karta hai.\n\n## Main kya kar sakta hoon:\n- Platform analytics aur user statistics\n- Fraud detection patterns ka analysis\n- Pipeline aur auto-verify status\n- Teacher approvals management\n- Scholarship data quality reports\n\nNeeche se koi quick topic select karein ya apna sawaal directly type karein! 🚀",
    ts: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
};

export function AdminAIChat() {
    const [messages, setMessages] = useState<Message[]>([INITIAL_MSG]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPrompts, setShowPrompts] = useState(true);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const history = await api.chatbot.getAdminHistory();
                if (history && history.length > 0) {
                    const mapped = history.map((m: any) => ({
                        role: m.role === "ai" ? "assistant" : m.role,
                        content: m.content,
                        ts: m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : undefined
                    }));
                    setMessages(mapped);
                    if (mapped.filter((m: Message) => m.role === "user").length > 0) {
                        setShowPrompts(false);
                    }
                }
            } catch (err) {
                console.error("Failed to load history", err);
            }
        };
        fetchHistory();
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    const handleSend = async (text?: string) => {
        const msg = text || input;
        if (!msg.trim() || loading) return;
        const ts = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        setMessages(prev => [...prev, { role: "user", content: msg, ts }]);
        setInput("");
        setShowPrompts(false);
        setLoading(true);
        inputRef.current?.focus();
        try {
            const res = await api.chatbot.sendAdminMessage(msg);
            const replyTs = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            setMessages(prev => [...prev, { role: "assistant", content: res.reply, ts: replyTs }]);
        } catch (err: any) {
            setMessages(prev => [...prev, {
                role: "assistant",
                content: "❌ **Error:** " + (err.message || "Failed to get response. Please try again."),
                ts: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        localStorage.removeItem(STORAGE_KEY);
        setMessages([INITIAL_MSG]);
        setShowPrompts(true);
        setInput("");
    };

    const msgCount = messages.filter(m => m.role === "user").length;

    return (
        <div className="flex flex-col h-full overflow-hidden rounded-2xl shadow-2xl"
            style={{ minHeight: 0, background: "linear-gradient(160deg, #0f0c1d 0%, #0a0a14 40%, #0c0f1e 100%)", border: "1px solid rgba(139,92,246,0.2)" }}>

            {/* ── HEADER ── */}
            <div className="shrink-0 px-6 py-4"
                style={{ background: "linear-gradient(135deg, rgba(109,40,217,0.3) 0%, rgba(10,10,20,0.98) 60%, rgba(37,99,235,0.2) 100%)", borderBottom: "1px solid rgba(139,92,246,0.2)" }}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {/* AI Avatar */}
                        <div className="relative shrink-0">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl"
                                style={{ background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #2563eb 100%)", boxShadow: "0 0 30px rgba(124,58,237,0.5), inset 0 1px 0 rgba(255,255,255,0.15)" }}>
                                <Sparkles size={24} className="text-white drop-shadow-lg" />
                            </div>
                            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-gray-950 animate-pulse shadow-lg shadow-emerald-500/50" />
                        </div>
                        {/* Title */}
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-black tracking-tight"
                                    style={{ background: "linear-gradient(135deg, #c4b5fd 0%, #818cf8 50%, #60a5fa 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                                    Admin Intelligence
                                </h2>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 uppercase tracking-wider">AI</span>
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                                <p className="text-xs text-gray-500">Live DB · Urdu &amp; English · Analytics</p>
                                {msgCount > 0 && (
                                    <span className="text-[10px] text-gray-600 flex items-center gap-1">
                                        <MessageSquare size={9} /> {msgCount} message{msgCount > 1 ? "s" : ""}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <button onClick={handleClear}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all"
                            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.15)"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.08)"; }}>
                            <Trash2 size={13} /> Clear
                        </button>
                    </div>
                </div>

                {/* Quick Prompts */}
                <div className="mt-4">
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold mb-2">Quick Actions</p>
                    <div className="flex gap-2 flex-wrap">
                        {QUICK_PROMPTS.map((p, i) => (
                            <button key={i} onClick={() => handleSend(p.text)} disabled={loading}
                                className="group flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-40 hover:scale-105 active:scale-95"
                                style={{ background: "rgba(20,18,40,0.8)", border: "1px solid rgba(139,92,246,0.2)", color: "#9ca3af" }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(139,92,246,0.5)"; (e.currentTarget as HTMLElement).style.color = "#c4b5fd"; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(139,92,246,0.2)"; (e.currentTarget as HTMLElement).style.color = "#9ca3af"; }}>
                                <span className={`w-5 h-5 rounded-lg bg-gradient-to-br ${p.color} flex items-center justify-center shadow`}>
                                    <p.icon size={10} className="text-white" />
                                </span>
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── MESSAGES ── */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scroll-smooth"
                style={{ minHeight: 0, background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(109,40,217,0.06) 0%, transparent 70%)" }}>

                {/* Welcome state when no user messages */}
                {showPrompts && messages.length === 1 && (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="w-16 h-16 rounded-2xl mb-4 flex items-center justify-center"
                            style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(37,99,235,0.2))", border: "1px solid rgba(139,92,246,0.2)" }}>
                            <Sparkles size={28} className="text-violet-400" />
                        </div>
                        <p className="text-gray-500 text-sm">Select a quick action above or type your question below</p>
                    </div>
                )}

                {messages.map((msg, i) => (
                    <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}>

                        {/* Bot avatar */}
                        {msg.role === "assistant" && (
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-lg"
                                style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)", boxShadow: "0 0 14px rgba(124,58,237,0.35)" }}>
                                <Bot size={15} className="text-white" />
                            </div>
                        )}

                        <div className={`group flex flex-col max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                            {/* Role label */}
                            <span className="text-[10px] font-semibold mb-1 px-1" style={{ color: msg.role === "user" ? "#818cf8" : "#6b7280" }}>
                                {msg.role === "user" ? "You" : "Admin AI"}
                            </span>

                            <div className={`relative rounded-2xl px-5 py-4 ${msg.role === "user" ? "rounded-tr-sm" : "rounded-tl-sm"}`}
                                style={msg.role === "user"
                                    ? { background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 60%, #2563eb 100%)", boxShadow: "0 4px 24px rgba(124,58,237,0.4)", color: "white" }
                                    : { background: "rgba(20,18,42,0.95)", border: "1px solid rgba(139,92,246,0.18)", boxShadow: "0 4px 24px rgba(0,0,0,0.4)", color: "#e2e8f0" }}>

                                {msg.role === "user" ? (
                                    <p className="text-sm leading-relaxed">{msg.content}</p>
                                ) : (
                                    <div className="prose-sm max-w-none [&_b]:font-bold [&_b]:text-white [&_i]:italic">
                                        {renderMarkdown(msg.content)}
                                    </div>
                                )}

                                {/* Copy button for assistant */}
                                {msg.role === "assistant" && (
                                    <div className="absolute top-2 right-2">
                                        <CopyButton text={msg.content} />
                                    </div>
                                )}
                            </div>

                            {msg.ts && (
                                <span className="text-[10px] mt-1.5 px-1" style={{ color: "#4b5563" }}>{msg.ts}</span>
                            )}
                        </div>

                        {/* User avatar */}
                        {msg.role === "user" && (
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-lg"
                                style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)", boxShadow: "0 0 14px rgba(79,70,229,0.35)" }}>
                                <User size={15} className="text-white" />
                            </div>
                        )}
                    </div>
                ))}

                {/* Typing indicator */}
                {loading && (
                    <div className="flex gap-3 justify-start animate-in fade-in duration-200">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)", boxShadow: "0 0 14px rgba(124,58,237,0.35)" }}>
                            <Bot size={15} className="text-white" />
                        </div>
                        <div className="rounded-2xl rounded-tl-sm px-5 py-3.5"
                            style={{ background: "rgba(20,18,42,0.95)", border: "1px solid rgba(139,92,246,0.18)" }}>
                            <div className="flex items-center gap-2">
                                <TypingDots />
                                <span className="text-xs text-gray-600">Thinking...</span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* ── INPUT ── */}
            <div className="shrink-0 px-6 py-4"
                style={{ background: "rgba(10,9,20,0.97)", borderTop: "1px solid rgba(139,92,246,0.15)" }}>
                <div className="flex gap-3 items-center">
                    <div className="flex-1 relative">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                            placeholder="Ask anything about users, fraud, pipeline, scholarships..."
                            disabled={loading}
                            className="w-full rounded-2xl pl-6 pr-6 focus:outline-none transition-all disabled:opacity-50"
                            style={{ background: "rgba(25,22,50,0.9)", border: "1px solid rgba(139,92,246,0.25)", outline: "none", color: "#f1f5f9", caretColor: "#a78bfa", height: "56px", fontSize: "15px", lineHeight: "56px" }}
                            onFocus={e => { e.target.style.borderColor = "rgba(139,92,246,0.6)"; e.target.style.boxShadow = "0 0 0 3px rgba(139,92,246,0.1)"; }}
                            onBlur={e => { e.target.style.borderColor = "rgba(139,92,246,0.25)"; e.target.style.boxShadow = "none"; }}
                        />
                    </div>
                    <button
                        onClick={() => handleSend()}
                        disabled={loading || !input.trim()}
                        className="w-14 rounded-2xl text-white flex items-center justify-center transition-all disabled:opacity-30 shrink-0 hover:scale-110 active:scale-95"
                        style={{ height: "56px", background: input.trim() && !loading ? "linear-gradient(135deg, #7c3aed, #2563eb)" : "rgba(30,27,54,0.8)", boxShadow: input.trim() && !loading ? "0 0 24px rgba(124,58,237,0.5)" : "none", border: "1px solid rgba(139,92,246,0.3)", transition: "all 0.2s" }}>
                        <Send size={16} />
                    </button>
                </div>
                <div className="flex items-center justify-between mt-2.5 px-1">
                    <p className="text-[10px] text-gray-700">Press <kbd className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-500 font-mono text-[9px]">Enter</kbd> to send</p>
                    <p className="text-[10px] text-gray-700 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                        Live DB connected
                    </p>
                </div>
            </div>
        </div>
    );
}
