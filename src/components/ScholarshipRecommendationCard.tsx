import React from 'react';
import { 
  Trophy, 
  MapPin, 
  Clock, 
  Banknote, 
  ExternalLink, 
  CheckCircle2, 
  Bookmark, 
  Zap,
  GraduationCap,
  ChevronRight
} from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { useTheme } from '../context/ThemeContext';
import { darkTheme, lightTheme } from '../styles/theme';
import { AIScholarshipButton } from './AIScholarshipButton';

interface ScholarshipRecommendationCardProps {
  scholarship: {
    id: string;
    name: string;
    university: string;
    country: string;
    deadline: string;
    funding_type: string;
    match_score: number;
    match_label: string;
    match_color: string;
    why_recommended: string[];
    action_link?: string;
  };
  onAction?: (type: 'view' | 'save' | 'apply' | 'compare', id: string) => void;
}

export const ScholarshipRecommendationCard: React.FC<ScholarshipRecommendationCardProps> = ({ 
  scholarship, 
  onAction 
}) => {
  const { isDark } = useTheme();
  const theme = isDark ? darkTheme : lightTheme;

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-500';
    if (score >= 70) return 'text-amber-500';
    return 'text-indigo-500';
  };

  return (
    <Card className="group relative overflow-hidden transition-all duration-500 hover:shadow-2xl" style={{ backgroundColor: theme.bgSecondary, borderColor: theme.border }}>
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="p-5 flex flex-col h-full relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-black ${getScoreColor(scholarship.match_score)}`}>
                {scholarship.match_score}%
              </span>
              <Badge variant="outline" className={`text-[10px] font-bold uppercase tracking-widest ${getScoreColor(scholarship.match_score)}`} style={{ backgroundColor: theme.bg, borderColor: theme.border }}>
                {scholarship.match_label}
              </Badge>
            </div>
            <div className="w-24">
              <Progress value={scholarship.match_score} className="h-1" style={{ backgroundColor: theme.bg }} />
            </div>
          </div>
          
          <Badge className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5" style={{ backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : '#e0e7ff', color: '#6366f1' }}>
            <Banknote size={12} />
            {scholarship.funding_type}
          </Badge>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-bold mb-2 leading-tight group-hover:text-indigo-500 transition-colors" style={{ color: theme.text }}>
            {scholarship.name}
          </h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium" style={{ color: theme.textSecondary }}>
              <GraduationCap size={14} className="text-indigo-400" />
              <span className="truncate">{scholarship.university}</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium" style={{ color: theme.textSecondary }}>
              <MapPin size={14} className="text-red-400" />
              <span>{scholarship.country}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-4 mb-6 border" style={{ backgroundColor: theme.bg, borderColor: theme.border }}>
          <p className="text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: theme.textSecondary }}>
            <Zap size={12} className="text-amber-400 fill-amber-400" /> Why Recommended
          </p>
          <ul className="space-y-2">
            {scholarship.why_recommended.map((reason, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs leading-relaxed font-medium" style={{ color: theme.textSecondary }}>
                <CheckCircle2 size={12} className="text-emerald-500 mt-0.5 shrink-0" />
                {reason}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-auto pt-4 border-t" style={{ borderColor: theme.border }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider" style={{ color: theme.textSecondary }}>
              <Clock size={14} className="text-orange-400" />
              <span>Deadline: <span style={{ color: theme.text }}>{new Date(scholarship.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span></span>
            </div>
          </div>

          <div className="mb-3">
            <AIScholarshipButton
              scholarship={{
                id: scholarship.id,
                title: scholarship.name,
                university_name: scholarship.university,
                country: scholarship.country,
                deadline: scholarship.deadline,
                funding_type: scholarship.funding_type,
              }}
              variant={isDark ? 'dark' : 'light'}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onAction?.('save', scholarship.id)}
              style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
              className="rounded-xl h-10 font-bold hover:bg-opacity-80"
            >
              <Bookmark size={14} className="mr-2" /> Save
            </Button>
            <Button 
              size="sm"
              onClick={() => onAction?.('apply', scholarship.id)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl h-10 font-bold shadow-lg shadow-indigo-500/20"
            >
              Apply <ExternalLink size={14} className="ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
