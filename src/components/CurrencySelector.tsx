import { useCurrency, currencies } from "../context/CurrencyContext";
import {
    DropdownMenu,
    DropdownMenuContentInline,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { Globe, ChevronDown, Check } from "lucide-react";

export function CurrencySelector({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
    const { currency, setCurrency } = useCurrency();
    const isDark = variant === 'dark';

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    style={isDark ? {
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "#fff",
                        borderRadius: "100px",
                        padding: "8px 16px",
                        height: "auto",
                        boxShadow: "inset 0 1px 1px rgba(255,255,255,0.05)"
                    } : {}}
                    className={`flex items-center gap-2 rounded-full px-4 h-10 transition-all font-bold shadow-sm ${
                        !isDark ? 'bg-white text-[#1a2250] hover:bg-gray-50 border border-gray-100 hover:border-gray-200' : 'hover:bg-white/10'
                    }`}
                >
                    <Globe className={`w-4 h-4 ${isDark ? 'text-indigo-400' : 'text-[#1a2250]'} opacity-80`} />
                    <span className="text-[12px] font-black uppercase tracking-tight">{currency.code}</span>
                    <ChevronDown className={`w-3 h-3 ${isDark ? 'text-white' : 'text-[#1a2250]'} opacity-50`} />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContentInline
                align="end"
                sideOffset={12}
                style={isDark ? {
                    background: "rgba(10, 15, 46, 0.95)",
                    backdropFilter: "blur(24px)",
                    WebkitBackdropFilter: "blur(24px)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "24px",
                    boxShadow: "0 40px 100px rgba(0,0,0,0.8)"
                } : {}}
                className={`w-52 max-h-[260px] overflow-y-auto rounded-[24px] p-2 z-[99999] custom-scrollbar scroll-smooth ${
                    !isDark ? 'bg-white border border-gray-100 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)]' : ''
                }`}
            >
                <div className={`px-3 py-2 text-[9px] font-black uppercase tracking-[0.25em] mb-1 opacity-80 ${isDark ? 'text-indigo-300' : 'text-gray-400'}`}>
                    Regional Currency
                </div>
                <div className="grid grid-cols-1 gap-1">
                    {Object.values(currencies).map((c) => {
                        const isActive = currency.code === c.code;
                        return (
                            <DropdownMenuItem
                                key={c.code}
                                onSelect={() => setCurrency(c.code)}
                                style={isDark ? {
                                    background: isActive ? "rgba(99,102,241,0.15)" : "transparent",
                                    border: isActive ? "1px solid rgba(99,102,241,0.3)" : "1px solid transparent",
                                    color: isActive ? "#fff" : "rgba(255,255,255,0.7)",
                                } : {}}
                                className={`flex items-center justify-between px-3 py-1.5 rounded-2xl cursor-pointer transition-all duration-200 group ${
                                    !isDark && (isActive 
                                    ? "bg-indigo-50 text-indigo-700" 
                                    : "hover:bg-gray-50 text-gray-600")
                                } ${isDark && !isActive ? "hover:bg-white/5 hover:text-white" : ""}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div 
                                        style={isDark ? {
                                            background: isActive ? "linear-gradient(135deg, #4f46e5, #7c3aed)" : "rgba(255,255,255,0.05)",
                                            color: "#fff",
                                            boxShadow: isActive ? "0 4px 12px rgba(99,102,241,0.4)" : "none"
                                        } : {}}
                                        className={`w-7 h-7 rounded-xl flex items-center justify-center text-[10px] font-black transition-all ${
                                        !isDark && (isActive ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "bg-gray-100 text-gray-500 group-hover:bg-white group-hover:shadow-sm")
                                    }`}>
                                        {c.symbol}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={`text-[12px] font-black leading-none mb-0.5 ${!isDark ? (isActive ? "text-indigo-900" : "text-gray-900") : ""}`}>
                                            {c.code}
                                        </span>
                                        <span className={`text-[10px] opacity-60 font-bold truncate max-w-[80px] ${isDark ? (isActive ? "text-indigo-200" : "text-slate-400") : ""}`}>
                                            {c.name}
                                        </span>
                                    </div>
                                </div>
                                {isActive && <Check className={`w-3.5 h-3.5 animate-in zoom-in duration-300 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />}
                            </DropdownMenuItem>
                        );
                    })}
                </div>
            </DropdownMenuContentInline>
        </DropdownMenu>
    );
}
