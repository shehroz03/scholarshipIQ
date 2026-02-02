import { currencies, CurrencyCode, useCurrency } from "../context/CurrencyContext";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { Globe, ChevronDown } from "lucide-react";

export function CurrencySelector() {
    const { currency, setCurrency } = useCurrency();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="flex items-center gap-2 hover:bg-gray-100/50 rounded-xl px-3 h-10 transition-all font-bold text-gray-700"
                >
                    <Globe className="w-4 h-4 text-[#1e3a8a]" />
                    <span>{currency.code} ({currency.symbol})</span>
                    <ChevronDown className="w-3 h-3 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="w-64 max-h-[240px] overflow-y-auto bg-white/98 backdrop-blur-xl border border-gray-100 rounded-2xl shadow-2xl p-1.5 z-[100] custom-scrollbar scroll-smooth"
            >
                {Object.values(currencies).map((c) => (
                    <DropdownMenuItem
                        key={c.code}
                        onClick={() => setCurrency(c.code)}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all duration-200 mb-0.5 last:mb-0 ${currency.code === c.code
                            ? "bg-blue-50 text-[#1e3a8a] font-bold shadow-sm"
                            : "hover:bg-gray-50 text-gray-600 font-medium"
                            }`}
                    >
                        <div className="flex flex-col gap-0.5">
                            <span className="text-sm leading-tight">{c.name}</span>
                            <span className="text-[9px] uppercase opacity-40 font-bold tracking-wider">{c.code}</span>
                        </div>
                        <div className={`w-8 h-8 flex items-center justify-center rounded-lg ${currency.code === c.code ? "bg-white shadow-sm" : ""}`}>
                            <span className="text-sm font-black">{c.symbol}</span>
                        </div>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
