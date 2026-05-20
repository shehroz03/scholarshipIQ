import { useState, useRef, useEffect } from "react";
import { api } from "../../api";
import {
    Send, Sparkles, Bot, User, Trash2,
    ShieldAlert, BarChart3, Users, Zap, GraduationCap, Database
} from "lucide-react";

interface Message {
    role: "user" | "assistant";
    content: string;
    ts?: string;
}

const QUICK_PROMPTS = [
    { label: "User Stats",          text: "How many users registered this week?",               icon: Users },
    { label: "Fraud Analysis",      text: "Analyze fraud patterns in the system",               icon: ShieldAlert },
    { label: "Pipeline Status",     text: "How is the auto-verify pipeline performing?",        icon: Zap },
    { label: "Teacher Approvals",   text: "How many teachers are pending approval?",            icon: GraduationCap },
    { label: "Scholarship Summary", text: "Give me a summary of all scholarships in the DB",   icon: Database },
    { label: "Data Quality",        text: "Suggest improvements for data quality",              icon: BarChart3 },
];

/** Convert markdown-ish text → React nodes with proper formatting */
function renderMarkdown(text: string) {
    const lines = text.split("\n");
    const nodes: React.ReactNode[] = [];
    let i = 0;

    const parseInline = (line: string): React.ReactNode => {
        // bold + italic combined ***text***
        line = line.replace(/\*\*\*(.*?)\*\*\*/g, '<b><i>$1</i></b>');
        // bold **text**
        line = line.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
        // italic *text*
        line = line.replace(/\*(.*?)\*/g, '<i>$1</i>');
        // inline code `code`
        line = line.replace(/`([^`]+)`/g, '<code>$1</code>');
        return <span dangerouslySetInnerHTML={{ __html: line }} />;
    };

    while (i < lines.length) {
        const line = lines[i];

        // Heading ## or ###
        if (line.startsWith("### ")) {
            nodes.push(<p key={i} className="font-bold text-gray-900 text-sm mt-3 mb-1">{parseInline(line.slice(4))}</p>);
        } else if (line.startsWith("## ")) {
            nodes.push(<p key={i} className="font-bold text-gray-900 text-base mt-3 mb-1">{parseInline(line.slice(3))}</p>);
        }
        // Numbered list  1. 2. 3.
        else if (/^\d+\.\s/.test(line)) {
            const items: React.ReactNode[] = [];
            while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
                const txt = lines[i].replace(/^\d+\.\s/, "");
                items.push(<li key={i} className="ml-1">{parseInline(txt)}</li>);
                i++;
            }
            nodes.push(<ol key={`ol-${i}`} className="list-decimal list-inside space-y-1 my-2 text-sm">{items}</ol>);
            continue;
        }
        // Bullet list - or *
        else if (/^[-*]\s/.test(line)) {
            const items: React.ReactNode[] = [];
            while (i < lines.length && /^[-*]\s/.test(lines[i])) {
                const txt = lines[i].replace(/^[-*]\s/, "");
                items.push(<li key={i} className="ml-1">{parseInline(txt)}</li>);
                i++;
            }
            nodes.push(<ul key={`ul-${i}`} className="list-disc list-inside space-y-1 my-2 text-sm">{items}</ul>);
            continue;
        }
        // Horizontal rule ---
        else if (/^---+$/.test(line.trim())) {
            nodes.push(<hr key={i} className="my-3 border-gray-200" />);
        }
        // Empty line → small spacer
        else if (line.trim() === "") {
            nodes.push(<div key={i} className="h-1.5" />);
        }
        // Normal paragraph
        else {
            nodes.push(<p key={i} className="text-sm leading-relaxed">{parseInline(line)}</p>);
        }
        i++;
    }
    return nodes;
}

/** Typing indicator — three animated dots */
function TypingDots() {
    return (
        <div className="flex items-center gap-1 py-1 px-1">
            {[0, 1, 2].map(n => (
                <span
                    key={n}
                    className="w-2 h-2 rounded-full bg-purple-400 inline-block"
                    style={{ animation: `bounce 1.2s ease-in-out ${n * 0.2}s infinite` }}
                />
            ))}
            <style>{`
                @keyframes bounce {
                    0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
                    40% { transform: translateY(-6px); opacity: 1; }
                }
            `}</style>
        </div>
    );
}

const INITIAL_MSG: Message = {
    role: "assistant",
    content: "👋 Salam! Main **ScholarIQ Admin Intelligence** hoon — aapke liye specially trained AI.\n\nMujhe platform analytics, fraud patterns, pipeline status, ya koi bhi admin decision ke baare mein poochh saktay hain. Main **live database data** ke saath jawab deta hoon.",
    ts: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
};

export function AdminAIChat() {
    const [messages, setMessages] = useState<Message[]>([INITIAL_MSG]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    const handleSend = async (text?: string) => {
        const msg = text || input;
        if (!msg.trim() || loading) return;
        const ts = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        setMessages(prev => [...prev, { role: "user", content: msg, ts }]);
        setInput("");
        setLoading(true);
        try {
            const res = await api.chatbot.sendAdminMessage(msg);
            const replyTs = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            setMessages(prev => [...prev, { role: "assistant", content: res.reply, ts: replyTs }]);
        } catch (err: any) {
            setMessages(prev => [...prev, {
                role: "assistant",
                content: "❌ **Error:** " + (err.message || "Failed to get response."),
                ts: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-120px)]" style={{ minHeight: 0 }}>
            {/* ── Header ── */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-200">
                        <Sparkles size={20} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 leading-tight">Admin Intelligence</h2>
                        <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block animate-pulse" />
                            Live data · Urdu &amp; English · Fraud + Analytics
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setMessages([INITIAL_MSG])}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-gray-500 hover:bg-red-50 hover:text-red-500 border border-gray-200 hover:border-red-200 transition-all"
                >
                    <Trash2 size={13} /> Clear chat
                </button>
            </div>

            {/* ── Quick Prompts ── */}
            <div className="flex gap-2 flex-wrap py-3 shrink-0">
                {QUICK_PROMPTS.map((p, i) => (
                    <button
                        key={i}
                        onClick={() => handleSend(p.text)}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-gray-200 text-gray-600 hover:border-purple-300 hover:text-purple-700 hover:bg-purple-50 transition-all disabled:opacity-40 shadow-sm"
                    >
                        <p.icon size={12} />
                        {p.label}
                    </button>
                ))}
            </div>

            {/* ── Messages ── */}
            <div className="flex-1 overflow-y-auto space-y-5 pr-1 pb-2" style={{ minHeight: 0 }}>
                {messages.map((msg, i) => (
                    <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>

                        {/* Bot avatar */}
                        {msg.role === "assistant" && (
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shrink-0 mt-0.5 shadow shadow-purple-200">
                                <Bot size={14} className="text-white" />
                            </div>
                        )}

                        <div className={`flex flex-col max-w-[78%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                            <div className={`rounded-2xl px-4 py-3 shadow-sm ${
                                msg.role === "user"
                                    ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-none"
                                    : "bg-white border border-gray-100 text-gray-800 rounded-bl-none"
                            }`}>
                                {msg.role === "user" ? (
                                    <p className="text-sm leading-relaxed">{msg.content}</p>
                                ) : (
                                    <div className="prose-sm max-w-none [&_b]:font-semibold [&_b]:text-gray-900 [&_i]:italic [&_code]:bg-gray-100 [&_code]:text-purple-700 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono">
                                        {renderMarkdown(msg.content)}
                                    </div>
                                )}
                            </div>
                            {msg.ts && (
                                <span className="text-[10px] text-gray-400 mt-1 px-1">{msg.ts}</span>
                            )}
                        </div>

                        {/* User avatar */}
                        {msg.role === "user" && (
                            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 mt-0.5 shadow shadow-blue-200">
                                <User size={14} className="text-white" />
                            </div>
                        )}
                    </div>
                ))}

                {/* Typing indicator */}
                {loading && (
                    <div className="flex gap-2.5 justify-start">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shrink-0 shadow shadow-purple-200">
                            <Bot size={14} className="text-white" />
                        </div>
                        <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-none px-4 py-2.5 shadow-sm">
                            <TypingDots />
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* ── Input ── */}
            <div className="pt-3 border-t border-gray-100 shrink-0">
                <div className="flex gap-2 items-end">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                            placeholder="Ask about users, fraud, pipeline, scholarships..."
                            disabled={loading}
                            className="w-full h-11 rounded-xl border border-gray-200 pl-4 pr-12 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 transition-all placeholder:text-gray-400 disabled:opacity-60"
                        />
                    </div>
                    <button
                        onClick={() => handleSend()}
                        disabled={loading || !input.trim()}
                        className="h-11 w-11 rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white flex items-center justify-center transition-all disabled:opacity-40 shadow-lg shadow-purple-200 shrink-0"
                    >
                        <Send size={15} />
                    </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-2 text-center">
                    ScholarIQ Admin AI · Live DB access · Press Enter to send
                </p>
            </div>
        </div>
    );
}
