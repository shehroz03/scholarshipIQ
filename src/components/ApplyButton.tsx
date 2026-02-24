import React from 'react';
import { ExternalLink, Info } from 'lucide-react';
import { Scholarship } from '../types/scholarship';

interface ApplyButtonProps {
    scholarship: Scholarship;
    variant?: 'card' | 'detail';
    className?: string;
}

const ApplyButton: React.FC<ApplyButtonProps> = ({ scholarship, variant = 'card', className = '' }) => {
    const { application_type, button_label, scholarship_url, user_note, deadline } = scholarship;

    // Check for expiration
    const isExpired = deadline ? new Date(deadline).getTime() < new Date().getTime() : false;

    const config = {
        direct_form: {
            bg: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/20',
            text: 'text-white',
            badge: 'bg-emerald-100/80 text-emerald-800 border-emerald-200',
            badgeIcon: '✅',
            badgeText: 'Direct Application',
            emoji: '🎯'
        },
        portal_application: {
            bg: 'bg-blue-600 hover:bg-blue-700 shadow-blue-900/20',
            text: 'text-white',
            badge: 'bg-blue-100/80 text-blue-800 border-blue-200',
            badgeIcon: '🔐',
            badgeText: 'Portal-Based',
            emoji: '📋'
        },
        auto_considered: {
            bg: 'bg-orange-600 hover:bg-orange-700 shadow-orange-900/20',
            text: 'text-white',
            badge: 'bg-orange-100/80 text-orange-800 border-orange-200',
            badgeIcon: '⚡',
            badgeText: 'Auto-Considered',
            emoji: '🎓'
        },
        expired: {
            bg: 'bg-gray-300 cursor-not-allowed',
            text: 'text-gray-500',
            badge: 'bg-red-100/80 text-red-800 border-red-200',
            badgeIcon: '🚫',
            badgeText: 'Closed',
            emoji: '🔒'
        }
    };

    const type = isExpired ? 'expired' : (application_type || 'direct_form');
    // @ts-ignore
    const styles = config[type] || config['direct_form'];

    const note = isExpired ? "This opportunity has expired." : (user_note || ((type === 'auto_considered') ? "No separate form needed" : ""));

    // Check if label already has emoji to avoid double
    const finalLabel = isExpired ? "Applications Closed" : (button_label || "Apply Now");
    const hasEmoji = /[\u{1F300}-\u{1F9FF}]/u.test(finalLabel);
    const labelWithEmoji = hasEmoji ? finalLabel : `${finalLabel} ${styles.emoji}`;

    if (variant === 'card') {
        return (
            <div className={`flex flex-col gap-2.5 ${className}`}>
                <div className={`self-start inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border backdrop-blur-md ${styles.badge}`}>
                    <span>{styles.badgeIcon}</span>
                    {styles.badgeText}
                </div>

                {isExpired ? (
                    <div
                        className={`group relative flex items-center justify-between gap-3 w-full px-5 py-3 rounded-2xl font-black transition-all shadow-none ${styles.bg} ${styles.text}`}
                    >
                        <span className="flex items-center gap-2 text-sm tracking-tight">
                            {labelWithEmoji}
                        </span>
                        <div className="w-6 h-6 bg-black/5 rounded-lg flex items-center justify-center">
                            <Info className="w-3.5 h-3.5 opacity-50" />
                        </div>
                    </div>
                ) : (
                    <a
                        href={scholarship_url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`group relative flex items-center justify-between gap-3 w-full px-5 py-3 rounded-2xl font-black transition-all shadow-xl active:scale-95 hover:-translate-y-0.5 ${styles.bg} ${styles.text}`}
                    >
                        <span className="flex items-center gap-2 text-sm tracking-tight">
                            {labelWithEmoji}
                        </span>
                        <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-colors">
                            <ExternalLink className="w-3.5 h-3.5 opacity-90 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </div>
                    </a>
                )}

                {note && (
                    <p className={`flex items-start gap-2 text-[10px] font-medium px-1 leading-relaxed ${isExpired ? 'text-red-500 font-bold' : 'text-slate-500'}`}>
                        <Info className={`w-3 h-3 mt-0.5 shrink-0 ${isExpired ? 'text-red-400' : 'text-slate-400'}`} />
                        {note}
                    </p>
                )}
            </div>
        );
    }

    return (
        <div className={`w-full ${className}`}>
            {isExpired ? (
                <div
                    className={`group relative flex items-center justify-center gap-4 w-full p-5 md:p-6 rounded-[2rem] font-black text-lg md:text-xl transition-all shadow-none mb-4 overflow-hidden ${styles.bg} ${styles.text}`}
                >
                    <span className="relative z-10">{labelWithEmoji}</span>
                    <div className="relative z-10 w-10 h-10 bg-black/5 rounded-2xl flex items-center justify-center">
                        <Info className="w-5 h-5 md:w-6 md:h-6 opacity-50" />
                    </div>
                </div>
            ) : (
                <a
                    href={scholarship_url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group relative flex items-center justify-center gap-4 w-full p-5 md:p-6 rounded-[2rem] font-black text-lg md:text-xl transition-all shadow-2xl hover:shadow-3xl active:scale-[0.98] hover:-translate-y-1 mb-4 overflow-hidden ${styles.bg} ${styles.text}`}
                >
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    <span className="relative z-10">{labelWithEmoji}</span>
                    <div className="relative z-10 w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-all">
                        <ExternalLink className="w-5 h-5 md:w-6 md:h-6 opacity-95" />
                    </div>
                </a>
            )}

            {note && (
                <div className={`flex items-center justify-center gap-3 text-xs md:text-sm text-center font-bold bg-white/40 backdrop-blur-sm rounded-2xl p-4 border shadow-sm animate-in fade-in zoom-in-95 duration-700 ${isExpired ? 'text-red-600 border-red-100' : 'text-slate-500 border-slate-100'}`}>
                    <div className={`p-1 rounded-lg ${isExpired ? 'bg-red-50' : 'bg-slate-100'}`}>
                        <Info className={`w-4 h-4 ${isExpired ? 'text-red-500' : 'text-slate-500'}`} />
                    </div>
                    <span className="italic">{note}</span>
                </div>
            )}
        </div>
    );
};

export default ApplyButton;
