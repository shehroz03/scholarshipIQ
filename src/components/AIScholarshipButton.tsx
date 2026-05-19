import { useState } from "react";
import { Sparkles, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { api } from "../api";

// Module-level cache — persists across re-renders & shared across all pages
const summaryCache: Record<string, string> = {};

export interface ScholarshipInfoForAI {
  id: number | string;
  title: string;
  university_name?: string;
  country?: string;
  amount?: string;
  deadline?: string;
  degree_level?: string;
  funding_type?: string;
}

interface AIScholarshipButtonProps {
  scholarship: ScholarshipInfoForAI;
  variant?: "dark" | "light";
}

export function AIScholarshipButton({
  scholarship,
  variant = "dark",
}: AIScholarshipButtonProps) {
  const cacheKey = String(scholarship.id);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(
    summaryCache[cacheKey] ?? null
  );
  const [error, setError] = useState<string | null>(null);
  const isDark = variant === "dark";

  const handleToggle = async () => {
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    setIsOpen(true);

    // Use cached result — no extra API call
    if (summaryCache[cacheKey]) {
      setSummary(summaryCache[cacheKey]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const prompt = `[SCHOLARSHIP SUMMARY REQUEST - RESPOND IN ENGLISH ONLY]

You are a helpful scholarship guide. Write a short action guide for this scholarship in simple, everyday English. No jargon. No Urdu. English only.

Scholarship: ${scholarship.title}
University: ${scholarship.university_name || "Not specified"}
Country: ${scholarship.country || "Global"}
Funding: ${scholarship.amount || "Varies"}
Deadline: ${scholarship.deadline || "Not specified"}
Level: ${scholarship.degree_level || "Graduate"}

Reply using EXACTLY this format. Keep each point short (under 25 words):

🎯 BIGGEST CHALLENGE:
[The hardest part about winning this specific scholarship — one sentence]

🗓️ YOUR 3-STEP PLAN:
1. [Do this first — right now]
2. [Do this next — within this week]
3. [Do this last — before the deadline]

💡 WINNING TIP:
[One specific tip to make your application stand out for this scholarship]`;

      const response = await api.chatbot.sendMessage(prompt);
      const text =
        response?.reply ||
        response?.message ||
        response?.response ||
        "Could not generate a summary right now.";

      summaryCache[cacheKey] = text;
      setSummary(text);
    } catch {
      setError("AI summary is not available right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setSummary(null);
    delete summaryCache[cacheKey];
    setIsOpen(false);
  };

  return (
    <div>
      {/* Toggle button */}
      <button
        onClick={handleToggle}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200 cursor-pointer"
        style={{
          background: isOpen
            ? "linear-gradient(135deg,#4f46e5,#6366f1)"
            : isDark
            ? "rgba(99,102,241,0.12)"
            : "rgba(99,102,241,0.08)",
          border: "1px solid rgba(99,102,241,0.3)",
          color: isOpen ? "white" : "#818cf8",
        }}
      >
        <Sparkles size={11} />
        {isOpen ? "Hide AI Guide" : "✨ AI Action Guide"}
        {isOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
      </button>

      {/* Expandable summary panel */}
      {isOpen && (
        <div
          className="mt-2 rounded-xl overflow-hidden"
          style={{
            background: isDark
              ? "linear-gradient(135deg, rgba(30,27,75,0.9), rgba(15,23,42,0.97))"
              : "linear-gradient(135deg, #eef2ff, #e0e7ff)",
            border: "1px solid rgba(99,102,241,0.25)",
          }}
        >
          {/* Loading shimmer */}
          {isLoading && (
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Loader2 size={13} className="animate-spin text-indigo-400" />
                <span className="text-indigo-400 text-[11px] font-bold">
                  AI is analyzing this scholarship...
                </span>
              </div>
              {[92, 70, 85, 55, 78].map((w, i) => (
                <div
                  key={i}
                  className="h-2.5 rounded-full mb-2 animate-pulse"
                  style={{
                    background: "rgba(99,102,241,0.18)",
                    width: `${w}%`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Error state */}
          {!isLoading && error && (
            <div className="p-4">
              <p className="text-rose-400 text-[12px] mb-2">{error}</p>
              <button
                onClick={handleRetry}
                className="text-indigo-400 text-[11px] underline cursor-pointer"
              >
                Try again
              </button>
            </div>
          )}

          {/* Summary content */}
          {!isLoading && !error && summary && (
            <div className="p-4">
              {/* Header */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded-lg bg-indigo-500 flex items-center justify-center shrink-0">
                  <Sparkles size={11} color="white" />
                </div>
                <span
                  className={`text-[10px] font-black uppercase tracking-widest ${
                    isDark ? "text-indigo-400" : "text-indigo-600"
                  }`}
                >
                  AI Action Guide
                </span>
                <span className="text-[9px] text-slate-500 font-medium ml-auto">
                  Powered by ScholarIQ AI
                </span>
              </div>

              {/* Parsed lines */}
              <div className="space-y-1">
                {summary
                  .split("\n")
                  .filter((l) => l.trim())
                  .map((line, i) => {
                    const isHeader =
                      line.startsWith("🎯") ||
                      line.startsWith("🗓️") ||
                      line.startsWith("💡");
                    return (
                      <p
                        key={i}
                        className={`leading-relaxed ${
                          isHeader
                            ? `text-[12px] font-black ${
                                i !== 0 ? "mt-3" : ""
                              } ${isDark ? "text-white" : "text-slate-800"}`
                            : `text-[11px] pl-1 ${
                                isDark ? "text-slate-300" : "text-slate-600"
                              }`
                        }`}
                      >
                        {line}
                      </p>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
