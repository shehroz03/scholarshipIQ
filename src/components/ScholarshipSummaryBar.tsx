import React from 'react';
import { 
  Search, 
  Target, 
  Banknote, 
  AlertTriangle 
} from 'lucide-react';

interface ScholarshipSummaryBarProps {
  summary: {
    total_found: number;
    high_match_count: number;
    fully_funded_count: number;
    urgent_deadlines: number;
  };
}

export const ScholarshipSummaryBar: React.FC<ScholarshipSummaryBarProps> = ({ summary }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 p-4 rounded-2xl flex items-center gap-4 transition-all hover:bg-slate-900/60">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
          <Search size={20} className="text-indigo-400" />
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Found</p>
          <p className="text-xl font-black text-white">{summary.total_found}</p>
        </div>
      </div>

      <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 p-4 rounded-2xl flex items-center gap-4 transition-all hover:bg-slate-900/60">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
          <Target size={20} className="text-emerald-400" />
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">High Match</p>
          <p className="text-xl font-black text-white">{summary.high_match_count}</p>
        </div>
      </div>

      <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 p-4 rounded-2xl flex items-center gap-4 transition-all hover:bg-slate-900/60">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
          <Banknote size={20} className="text-amber-400" />
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Fully Funded</p>
          <p className="text-xl font-black text-white">{summary.fully_funded_count}</p>
        </div>
      </div>

      <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 p-4 rounded-2xl flex items-center gap-4 transition-all hover:bg-slate-900/60">
        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
          <AlertTriangle size={20} className="text-orange-400" />
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Urgent</p>
          <p className="text-xl font-black text-white">{summary.urgent_deadlines}</p>
        </div>
      </div>
    </div>
  );
};
