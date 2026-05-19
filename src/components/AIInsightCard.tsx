import React from 'react';
import { Brain, Sparkles } from 'lucide-react';

interface AIInsightCardProps {
  insight: {
    strategic_summary: string;
  };
}

export const AIInsightCard: React.FC<AIInsightCardProps> = ({ insight }) => {
  return (
    <div className="relative overflow-hidden bg-indigo-600/10 border border-indigo-500/20 p-6 rounded-[2rem] mb-8">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Brain size={120} className="text-indigo-500" />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h4 className="text-white font-black text-sm uppercase tracking-widest">ScholarIQ Strategic Insight</h4>
            <p className="text-indigo-300/60 text-[10px] font-bold uppercase tracking-tighter">AI-Generated Personal Analysis</p>
          </div>
        </div>
        
        <p className="text-indigo-100 text-base font-medium leading-relaxed max-w-2xl">
          "{insight.strategic_summary}"
        </p>
        
        <div className="mt-4 flex items-center gap-2">
          <div className="h-[2px] w-8 bg-indigo-500 rounded-full" />
          <span className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">Premium Match Strategy</span>
        </div>
      </div>
    </div>
  );
};
