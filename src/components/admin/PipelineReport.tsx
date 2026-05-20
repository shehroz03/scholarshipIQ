import { useState, useEffect } from "react";
import { api } from "../../api";
import {
  CheckCircle, XCircle, AlertTriangle, RefreshCw, Loader2,
  BarChart3, ShieldCheck, Clock, Database, TrendingUp, Bot
} from "lucide-react";

interface ReportData {
  period: string;
  days: number;
  since: string;
  pipeline: {
    total_runs: number;
    total_scraped: number;
    total_staged: number;
    fraud_blocked: number;
    duplicates_skipped: number;
  };
  bot_decisions: {
    approved: number;
    rejected: number;
    total: number;
    approval_rate: number;
  };
  admin_overrides: number;
  staging_queue: {
    pending_review: number;
    rejected: number;
  };
  production: {
    total_live_scholarships: number;
  };
  daily_breakdown: { date: string; approved: number; rejected: number }[];
}

const StatCard = ({
  icon: Icon, label, value, sub, color
}: {
  icon: any; label: string; value: string | number; sub?: string; color: string;
}) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
      <Icon size={20} className="text-white" />
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm font-medium text-gray-700">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

export function PipelineReport() {
  const [period, setPeriod] = useState<"weekly" | "monthly">("monthly");
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.admin.getPipelineReport(period);
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(); }, [period]);

  const maxBar = data
    ? Math.max(...data.daily_breakdown.map(d => d.approved + d.rejected), 1)
    : 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Pipeline Report</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Scholarship scraping → bot verification → production results
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-gray-200 overflow-hidden">
            <button
              onClick={() => setPeriod("weekly")}
              className={`px-4 py-2 text-sm font-medium transition-all ${period === "weekly" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
            >
              Weekly
            </button>
            <button
              onClick={() => setPeriod("monthly")}
              className={`px-4 py-2 text-sm font-medium transition-all ${period === "monthly" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
            >
              Monthly
            </button>
          </div>
          <button
            onClick={fetchReport}
            disabled={loading}
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition-all"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-blue-500" size={32} />
        </div>
      ) : data ? (
        <>
          {/* Pipeline Stats */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              🔄 Scraper Pipeline — {data.days} Days
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={BarChart3}    label="Pipeline Runs"       value={data.pipeline.total_runs}          color="bg-blue-500" />
              <StatCard icon={Database}     label="Total Scraped"       value={data.pipeline.total_scraped}       sub="found by scraper" color="bg-indigo-500" />
              <StatCard icon={Clock}        label="Sent to Bot Staging" value={data.pipeline.total_staged}        sub="waiting for bot" color="bg-violet-500" />
              <StatCard icon={AlertTriangle} label="Fraud Blocked"      value={data.pipeline.fraud_blocked}       sub="never reached bot" color="bg-red-500" />
            </div>
          </div>

          {/* Bot Decisions */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              🤖 Auto-Verify Bot Decisions
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={CheckCircle}  label="Bot Approved"        value={data.bot_decisions.approved}       sub="promoted to production" color="bg-emerald-500" />
              <StatCard icon={XCircle}      label="Bot Rejected"        value={data.bot_decisions.rejected}       sub="held in staging" color="bg-rose-500" />
              <StatCard icon={TrendingUp}   label="Approval Rate"       value={`${data.bot_decisions.approval_rate}%`} sub="bot pass rate" color="bg-cyan-500" />
              <StatCard icon={ShieldCheck}  label="Admin Overrides"     value={data.admin_overrides}              sub="manually corrected" color="bg-amber-500" />
            </div>
          </div>

          {/* Current Status Row */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              📊 Current Status
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard icon={Clock}        label="Pending in Staging"  value={data.staging_queue.pending_review} sub="awaiting bot run" color="bg-orange-500" />
              <StatCard icon={XCircle}      label="Rejected in Staging" value={data.staging_queue.rejected}       sub="admin can override" color="bg-gray-500" />
              <StatCard icon={Database}     label="Live Scholarships"   value={data.production.total_live_scholarships} sub="visible to students" color="bg-green-600" />
            </div>
          </div>

          {/* Daily Breakdown Chart */}
          {data.daily_breakdown.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-5">
                <Bot size={18} className="text-blue-600" />
                <h3 className="font-semibold text-gray-900">Daily Bot Decisions</h3>
                <span className="ml-auto flex gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-400 inline-block"></span>Approved</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-rose-400 inline-block"></span>Rejected</span>
                </span>
              </div>
              <div className="flex items-end gap-2 h-40 overflow-x-auto pb-2">
                {data.daily_breakdown.map((day) => {
                  const total = day.approved + day.rejected;
                  const approvedH = Math.round((day.approved / maxBar) * 140);
                  const rejectedH = Math.round((day.rejected / maxBar) * 140);
                  return (
                    <div key={day.date} className="flex flex-col items-center gap-1 min-w-[36px] group">
                      <div className="flex flex-col-reverse items-center gap-0.5 w-full">
                        {day.rejected > 0 && (
                          <div
                            style={{ height: `${rejectedH}px` }}
                            className="w-7 bg-rose-400 rounded-t-sm transition-all group-hover:opacity-80"
                            title={`Rejected: ${day.rejected}`}
                          />
                        )}
                        {day.approved > 0 && (
                          <div
                            style={{ height: `${approvedH}px` }}
                            className="w-7 bg-emerald-400 rounded-t-sm transition-all group-hover:opacity-80"
                            title={`Approved: ${day.approved}`}
                          />
                        )}
                        {total === 0 && <div className="w-7 h-1 bg-gray-100 rounded" />}
                      </div>
                      <span className="text-[9px] text-gray-400 rotate-45 origin-left mt-1 whitespace-nowrap">
                        {day.date.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Summary Text Box */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-5">
            <p className="text-sm font-semibold text-blue-800 mb-2">
              📋 {period === "weekly" ? "7-Day" : "30-Day"} Summary
            </p>
            <p className="text-sm text-blue-700 leading-relaxed">
              Is {period === "weekly" ? "hafte" : "mahine"} mein scraper ne{" "}
              <strong>{data.pipeline.total_scraped}</strong> scholarships find kiye.{" "}
              <strong>{data.pipeline.fraud_blocked}</strong> fraud gate par block hue.{" "}
              Baki <strong>{data.pipeline.total_staged}</strong> staging mein gaye — jahan se bot ne{" "}
              <strong>{data.bot_decisions.approved}</strong> approve aur{" "}
              <strong>{data.bot_decisions.rejected}</strong> reject kiye
              ({data.bot_decisions.approval_rate}% pass rate).{" "}
              Abhi <strong>{data.production.total_live_scholarships}</strong> scholarships students ko visible hain.
            </p>
          </div>
        </>
      ) : (
        <div className="text-center text-gray-400 py-20">No data available</div>
      )}
    </div>
  );
}
