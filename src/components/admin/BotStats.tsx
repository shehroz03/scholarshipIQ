import { useState, useEffect } from "react";
import { Bot, CheckCircle, RefreshCw, AlertCircle, Play, Clock, TrendingUp, Zap, XCircle, ChevronDown, ChevronUp, X, ExternalLink } from "lucide-react";

const API_BASE = "http://localhost:8000";

function getAdminToken() {
  return localStorage.getItem("token") || "";
}

interface RunEntry {
  run_number: number;
  run_at: string;
  checked: number;
  updated: number;
  errors: number;
  updates: { title: string; university?: string; changes: string[]; ai_notes: string; updated_at: string }[];
}

interface BotStatsData {
  total_runs: number;
  total_checked: number;
  total_updated: number;
  total_errors: number;
  last_run_at: string | null;
  next_run_at: string | null;
  serper_api: string;
  openai_api: string;
  runs: RunEntry[];
}

function fmtDate(iso: string | null) {
  if (!iso) return "Never";
  try {
    return new Date(iso).toLocaleString("en-PK", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  } catch { return iso; }
}

function timeAgo(iso: string | null) {
  if (!iso) return "";
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  } catch { return ""; }
}

export function BotStats() {
  const [data, setData] = useState<BotStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [runMsg, setRunMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [expandedRun, setExpandedRun] = useState<number | null>(null);
  const [showUpdatesModal, setShowUpdatesModal] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/bot-stats`, {
        headers: { Authorization: `Bearer ${getAdminToken()}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchStats(); }, []);

  const handleRunNow = async () => {
    setRunning(true);
    setRunMsg(null);
    try {
      const res = await fetch(`${API_BASE}/admin/bot-stats/run-now`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getAdminToken()}` }
      });
      const json = await res.json();
      if (res.ok) {
        setRunMsg({ type: "success", text: `Run complete! Checked: ${json.checked} | Updated: ${json.updated} | Errors: ${json.errors}` });
        await fetchStats();
      } else {
        setRunMsg({ type: "error", text: json.detail || "Bot run failed." });
      }
    } catch (e: any) {
      setRunMsg({ type: "error", text: "Network error: " + e.message });
    }
    setRunning(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-3 text-gray-500">Loading bot stats...</span>
      </div>
    );
  }

  const statCards = [
    { label: "Total Bot Runs", value: data?.total_runs ?? 0, icon: Bot, color: "from-blue-500 to-blue-600", bg: "bg-blue-50", text: "text-blue-700", clickable: false },
    { label: "Scholarships Checked", value: data?.total_checked ?? 0, icon: CheckCircle, color: "from-green-500 to-green-600", bg: "bg-green-50", text: "text-green-700", clickable: false },
    { label: "Updates Applied", value: data?.total_updated ?? 0, icon: TrendingUp, color: "from-purple-500 to-purple-600", bg: "bg-purple-50", text: "text-purple-700", clickable: true, onClick: () => setShowUpdatesModal(true) },
    { label: "Total Errors", value: data?.total_errors ?? 0, icon: AlertCircle, color: "from-red-500 to-red-600", bg: "bg-red-50", text: "text-red-700", clickable: false },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Bot className="w-7 h-7 text-blue-600" />
            AI Auto-Update Bot
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Automatically checks and updates scholarship data every 4 days using Serper + GPT-4o
          </p>
        </div>
        <button
          onClick={handleRunNow}
          disabled={running}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-60 transition-all shadow-md"
        >
          {running ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {running ? "Running..." : "Run Now"}
        </button>
      </div>

      {/* Run message */}
      {runMsg && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${
          runMsg.type === "success"
            ? "bg-green-50 border-green-200 text-green-800"
            : "bg-red-50 border-red-200 text-red-800"
        }`}>
          {runMsg.type === "success" ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <XCircle className="w-5 h-5 flex-shrink-0" />}
          {runMsg.text}
        </div>
      )}

      {/* API Status */}
      <div className="flex gap-3 flex-wrap">
        {[
          { label: "Serper API", status: data?.serper_api },
          { label: "OpenAI API", status: data?.openai_api },
        ].map(({ label, status }) => (
          <div key={label} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${
            status === "configured"
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}>
            <span className={`w-2 h-2 rounded-full ${status === "configured" ? "bg-green-500" : "bg-red-500"}`} />
            {label}: {status === "configured" ? "Configured ✓" : "Missing ✗"}
          </div>
        ))}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 text-xs font-semibold text-gray-600">
          <Clock className="w-3.5 h-3.5" />
          Runs every 4 days · Batch: 6 scholarships
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg, text, clickable, onClick }) => (
          <div
            key={label}
            onClick={onClick}
            className={`bg-white rounded-2xl border border-gray-100 p-5 shadow-sm transition-all ${clickable ? 'cursor-pointer hover:shadow-md hover:border-purple-300 hover:-translate-y-0.5' : ''}`}
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-3xl font-bold text-gray-800">{value}</p>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              {label}
              {clickable && <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">Click to view</span>}
            </p>
          </div>
        ))}
      </div>

      {/* Last / Next Run */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Last Bot Run</p>
            <p className="text-sm font-semibold text-gray-800">{fmtDate(data?.last_run_at ?? null)}</p>
            {data?.last_run_at && <p className="text-xs text-gray-400">{timeAgo(data.last_run_at)}</p>}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
            <Zap className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Next Scheduled Run</p>
            <p className="text-sm font-semibold text-gray-800">{fmtDate(data?.next_run_at ?? null)}</p>
            {data?.next_run_at && <p className="text-xs text-gray-400">in {timeAgo(data.next_run_at).replace(" ago", "")}</p>}
          </div>
        </div>
      </div>

      {/* Run History Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Run History</h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
            {data?.runs.length ?? 0} records
          </span>
        </div>

        {!data?.runs.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Bot className="w-12 h-12 mb-3 opacity-30" />
            <p className="font-medium">No runs yet</p>
            <p className="text-sm">Click "Run Now" to trigger the first bot run</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {/* Table Header */}
            <div className="grid grid-cols-6 px-6 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide bg-gray-50">
              <span>Run #</span>
              <span className="col-span-2">Date & Time</span>
              <span>Checked</span>
              <span>Updated</span>
              <span>Errors</span>
            </div>

            {data.runs.map((run) => (
              <div key={run.run_number}>
                <div
                  className="grid grid-cols-6 px-6 py-3 items-center hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setExpandedRun(expandedRun === run.run_number ? null : run.run_number)}
                >
                  <span className="text-sm font-bold text-blue-600">#{run.run_number}</span>
                  <span className="col-span-2 text-sm text-gray-700">
                    {fmtDate(run.run_at)}
                    <span className="ml-2 text-xs text-gray-400">{timeAgo(run.run_at)}</span>
                  </span>
                  <span className="text-sm font-medium text-gray-700">{run.checked}</span>
                  <span className={`text-sm font-bold ${run.updated > 0 ? "text-green-600" : "text-gray-400"}`}>
                    {run.updated > 0 ? `+${run.updated}` : "0"}
                  </span>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${run.errors > 0 ? "text-red-500" : "text-gray-400"}`}>
                      {run.errors}
                    </span>
                    {run.updates?.length > 0 && (
                      expandedRun === run.run_number
                        ? <ChevronUp className="w-4 h-4 text-gray-400" />
                        : <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Expanded updates detail */}
                {expandedRun === run.run_number && run.updates?.length > 0 && (
                  <div className="px-6 pb-4 bg-blue-50/40 border-t border-blue-100">
                    <p className="text-xs font-semibold text-blue-700 py-2 uppercase tracking-wide">Scholarship Updates in This Run</p>
                    <div className="space-y-2">
                      {run.updates.map((u, i) => (
                        <div key={i} className="bg-white rounded-lg border border-blue-100 px-4 py-3">
                          <p className="text-sm font-semibold text-gray-800">{u.title}</p>
                          <ul className="mt-1 space-y-0.5">
                            {u.changes.map((c, j) => (
                              <li key={j} className="text-xs text-gray-600 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                                {c}
                              </li>
                            ))}
                          </ul>
                          {u.ai_notes && (
                            <p className="mt-1 text-xs text-purple-600 italic">AI: {u.ai_notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Updates Modal */}
      {showUpdatesModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50">
              <div>
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  All Scholarship Updates
                </h2>
                <p className="text-xs text-gray-500">Total {data?.total_updated ?? 0} updates applied across all bot runs</p>
              </div>
              <button
                onClick={() => setShowUpdatesModal(false)}
                className="p-2 hover:bg-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-6 space-y-4">
              {!data?.runs?.some(r => r.updates?.length > 0) ? (
                <div className="text-center py-8 text-gray-400">
                  <Bot className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No updates yet</p>
                  <p className="text-sm">Updates will appear here after bot runs</p>
                </div>
              ) : (
                data.runs.flatMap(run =>
                  (run.updates || []).map((u, idx) => ({ ...u, run_number: run.run_number, run_at: run.run_at, key: `${run.run_number}-${idx}` }))
                ).map((update) => (
                  <div key={update.key} className="bg-gradient-to-r from-purple-50/50 to-white border border-purple-100 rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-800">{update.title}</h3>
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Run #{update.run_number}</span>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">{fmtDate(update.run_at)} · {update.university || 'Unknown University'}</p>

                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Changes Applied:</p>
                          <ul className="space-y-1">
                            {update.changes.map((c, j) => (
                              <li key={j} className="text-sm text-gray-700 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                                {c}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {update.ai_notes && (
                          <div className="mt-3 p-3 bg-white rounded-lg border border-purple-100">
                            <p className="text-xs font-semibold text-purple-600 mb-1">🤖 AI Notes:</p>
                            <p className="text-sm text-gray-600 italic">{update.ai_notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Showing all updates from {data?.runs?.length ?? 0} bot runs
              </p>
              <button
                onClick={() => setShowUpdatesModal(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
