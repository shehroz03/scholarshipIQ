import { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { api } from '../api';

interface SmartSearchBarProps {
    onResults?: (results: any, query: string) => void;
    onClear?: () => void;
    initialQuery?: string;
    userCgpa?: number;
    // Props for controlled usage (from SearchPage)
    value?: string;
    onChange?: (val: string) => void;
    onSearch?: () => void;
    isActive?: boolean;
    setIsActive?: (val: boolean) => void;
}

export function SmartSearchBar({ 
    onResults, 
    onClear, 
    initialQuery = '', 
    userCgpa,
    value,
    onChange,
    onSearch,
    isActive,
    setIsActive
}: SmartSearchBarProps) {
    const [localQuery, setLocalQuery] = useState(initialQuery);
    const query = value !== undefined ? value : localQuery;
    const setQuery = onChange !== undefined ? onChange : setLocalQuery;

    const [isSearching, setIsSearching] = useState(false);
    const [parsedFilters, setParsedFilters] = useState<any>(null);
    const [isFocused, setIsFocused] = useState(false);

    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (initialQuery) {
            handleSearch(initialQuery);
        }
    }, [initialQuery]);

    useEffect(() => {
        // Handle clicking outside to close the dropdown
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsFocused(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSearch = async (searchQuery: string) => {
        if (!searchQuery.trim()) {
            handleClear();
            return;
        }

        if (isActive === false) {
            onSearch?.();
            return;
        }

        setIsSearching(true);
        setIsFocused(false);
        try {
            const resp = await api.scholarships.smartSearch(searchQuery, userCgpa);
            if (resp && resp.parsed_filters) {
                setParsedFilters(resp.parsed_filters);
            } else {
                setParsedFilters(null);
            }
            if (resp && resp.results) {
                onResults?.(resp.results, searchQuery);
            }
        } catch (e) {
            console.error("Smart search failed", e);
            setParsedFilters(null);
        } finally {
            setIsSearching(false);
            onSearch?.();
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setQuery(val);
        setParsedFilters(null); // Clear AI tags when typing new query

        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (!val.trim()) {
            handleClear();
            return;
        }

        debounceRef.current = setTimeout(() => {
            handleSearch(val);
        }, 500);
    };

    const handleClear = () => {
        setQuery('');
        setParsedFilters(null);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        onClear?.();
        // Keep focus theoretically, but state resets
    };

    const setSuggested = (q: string) => {
        setQuery(q);
        handleSearch(q);
    };

    const suggestions = [
        { icon: "🇬🇧", text: "UK Masters Computer Science" },
        { icon: "🇦🇺", text: "Australia Full Funded PhD" },
        { icon: "🇨🇦", text: "Canada Engineering Low CGPA" },
        { icon: "🇩🇪", text: "Germany Masters Scholarship" },
        { icon: "🇹🇷", text: "Turkey Full Funded Masters" }
    ];

    return (
        <div className="w-full max-w-[700px] mx-auto relative" ref={containerRef}>
            {/* Search Bar Container */}
            <div
                className={`flex items-center bg-white dark:bg-[#1e1e2e] border-[1.5px] border-slate-200 dark:border-[#374151] rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all duration-200 ease-in-out focus-within:border-[#f4c44e] focus-within:shadow-[0_4px_25px_rgba(244,196,78,0.15)] ${isFocused ? 'border-[#f4c44e]' : ''}`}
            >
                {/* Left Icon Area */}
                <div className="pl-[20px] pr-[12px] flex items-center justify-center shrink-0">
                    {isSearching ? (
                        <Loader2 className="w-[20px] h-[20px] text-[#f4c44e] animate-spin" />
                    ) : (
                        <Search className="w-[20px] h-[20px] text-[#f4c44e]" />
                    )}
                </div>

                {/* Input Field */}
                <input
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() => setIsFocused(true)}
                    className="flex-1 w-full bg-transparent border-none outline-none ring-0 focus:ring-0 py-[16px] px-0 text-[16px] font-normal text-gray-900 dark:text-white placeholder:text-slate-400"
                    placeholder={isSearching ? "Searching..." : "e.g. UK Masters Computer Science 3.1 CGPA"}
                />

                {/* Right Actions Area */}
                <div className="pr-[8px] flex items-center gap-[4px] shrink-0">
                    {setIsActive && (
                        <button
                            type="button"
                            onClick={() => setIsActive(!isActive)}
                            className={`p-2 rounded-full transition-all flex items-center gap-1.5 px-3 mr-1 ${isActive ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-100'}`}
                            title={isActive ? "Disable AI Search" : "Enable AI Search"}
                        >
                            <span className="text-[12px] font-bold">{isActive ? 'AI' : 'Regular'}</span>
                        </button>
                    )}
                    {query && (
                        <>
                            <button
                                type="button"
                                onClick={handleClear}
                                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                                aria-label="Clear search"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSearch(query)}
                                className="bg-[#f4c44e] hover:bg-[#e8b43a] text-white font-semibold py-[8px] px-[20px] rounded-full transition-colors ml-1 shadow-sm"
                            >
                                Search
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Suggestions Dropdown */}
            {isFocused && !query && (
                <div className="absolute top-[calc(100%+12px)] left-0 w-full bg-white dark:bg-[#1e1e2e] rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.10)] border border-slate-100 dark:border-slate-800 z-50 overflow-hidden py-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 pb-2 mb-1 border-b border-slate-50 dark:border-slate-800">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Try searching for...</span>
                    </div>
                    <ul className="flex flex-col">
                        {suggestions.map((item, idx) => (
                            <li key={idx}>
                                <button
                                    onClick={() => setSuggested(item.text)}
                                    className="w-full text-left px-5 py-3 text-[15px] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-3 font-medium"
                                >
                                    <span className="text-lg leading-none">{item.icon}</span>
                                    {item.text}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* AI Parsed Tags (Chips) */}
            {parsedFilters && !isSearching && query && (
                <div className="flex flex-wrap items-center gap-[8px] mt-4 px-2 animate-in fade-in slide-in-from-top-1">
                    {parsedFilters.country && (
                        <span className="bg-[#eef2ff] text-[#e8b43a] dark:bg-[#312e81] dark:text-[#a5b4fc] rounded-full px-[12px] py-[4px] text-[13px] font-medium inline-flex items-center gap-1.5 border border-[#c7d2fe]/50 dark:border-indigo-400/20">
                            <span>🌍</span> {parsedFilters.country}
                        </span>
                    )}
                    {parsedFilters.degree_level && (
                        <span className="bg-[#eef2ff] text-[#e8b43a] dark:bg-[#312e81] dark:text-[#a5b4fc] rounded-full px-[12px] py-[4px] text-[13px] font-medium inline-flex items-center gap-1.5 border border-[#c7d2fe]/50 dark:border-indigo-400/20">
                            <span>🎓</span> {parsedFilters.degree_level}
                        </span>
                    )}
                    {parsedFilters.field && (
                        <span className="bg-[#eef2ff] text-[#e8b43a] dark:bg-[#312e81] dark:text-[#a5b4fc] rounded-full px-[12px] py-[4px] text-[13px] font-medium inline-flex items-center gap-1.5 border border-[#c7d2fe]/50 dark:border-indigo-400/20">
                            <span>💻</span> {parsedFilters.field}
                        </span>
                    )}
                    {parsedFilters.funding_type && (
                        <span className="bg-[#eef2ff] text-[#e8b43a] dark:bg-[#312e81] dark:text-[#a5b4fc] rounded-full px-[12px] py-[4px] text-[13px] font-medium inline-flex items-center gap-1.5 border border-[#c7d2fe]/50 dark:border-indigo-400/20">
                            <span>💰</span> {parsedFilters.funding_type}
                        </span>
                    )}
                    {parsedFilters.cgpa && (
                        <span className="bg-[#eef2ff] text-[#e8b43a] dark:bg-[#312e81] dark:text-[#a5b4fc] rounded-full px-[12px] py-[4px] text-[13px] font-medium inline-flex items-center gap-1.5 border border-[#c7d2fe]/50 dark:border-indigo-400/20">
                            <span>📊</span> CGPA {parsedFilters.cgpa}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
