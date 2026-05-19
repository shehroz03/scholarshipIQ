import { useState, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { GraduationCap, MapPin, Calendar, Trash2, Loader2, BookmarkX, Banknote, Lock, Crown, ChevronLeft } from "lucide-react";
import { AIScholarshipButton } from "./AIScholarshipButton";
import { api } from "../api";
import { CurrencySelector } from "./CurrencySelector";
import { useCurrency } from "../context/CurrencyContext";
import { useTheme } from "../context/ThemeContext";
import { darkTheme, lightTheme } from "../styles/theme";
import { ThemeToggle } from "./ThemeToggle";

interface Scholarship {
  id: number;
  title: string;
  university_id: number;
  university_name: string;
  country: string;
  degree_level: string;
  amount: string;
  deadline: string;
  is_suspicious?: boolean;
  match_score?: number;
}

export function SavedPage({ onNavigate }: { onNavigate: (page: string, params?: any) => void }) {
  const { convertAndFormat } = useCurrency();
  const { isDark } = useTheme();
  const theme = isDark ? darkTheme : lightTheme;
  const [savedScholarships, setSavedScholarships] = useState<Scholarship[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSaved();
  }, []);

  const fetchSaved = async () => {
    try {
      const data = await api.dashboard.getSaved();
      setSavedScholarships(data);
    } catch (err) {
      console.error("Failed to fetch saved scholarships", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsave = async (id: number) => {
    try {
      await api.dashboard.unsave(id);
      setSavedScholarships(savedScholarships.filter((s: Scholarship) => s.id !== id));
    } catch (err) {
      alert("Failed to remove scholarship");
    }
  };

  return (
    <div className="min-h-screen transition-colors duration-300 flex flex-col" style={{ backgroundColor: theme.bg, color: theme.text }}>
      <header className="border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md" style={{ backgroundColor: theme.headerBg, borderColor: theme.border }}>
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('dashboard')}>
          <GraduationCap className="w-8 h-8 text-[#1e3a8a]" />
          <span className="text-xl font-bold" style={{ color: theme.text }}>ScholarIQ</span>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <CurrencySelector />
          <Button variant="ghost" onClick={() => onNavigate('dashboard')} style={{ color: theme.textSecondary }}>
            <ChevronLeft size={16} className="mr-1" /> Dashboard
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black mb-2" style={{ color: theme.text }}>Saved Scholarships</h1>
          <p style={{ color: theme.textSecondary }}>Review and manage your bookmarked opportunities.</p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-[#1e3a8a] mb-4" />
            <p style={{ color: theme.textSecondary }}>Loading your saved list...</p>
          </div>
        ) : savedScholarships.length === 0 ? (
          <Card className="border-dashed border-2 py-20" style={{ backgroundColor: theme.bgSecondary, borderColor: theme.border }}>
            <CardContent className="flex flex-col items-center justify-center text-center">
              <BookmarkX className="w-16 h-16 mb-4" style={{ color: theme.border }} />
              <h3 className="text-xl font-bold mb-2" style={{ color: theme.text }}>No Saved Scholarships</h3>
              <p className="max-w-sm mb-6" style={{ color: theme.textSecondary }}>
                You haven't saved any scholarships yet. Start exploring to find the best opportunities for you!
              </p>
              <Button onClick={() => onNavigate('search')} className="bg-[#1e3a8a] hover:bg-[#1e3a8a]/90">
                Explore Scholarships
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4">
              {savedScholarships.map((s: Scholarship) => (
                <Card key={s.id} className="border-none shadow-sm hover:shadow-md transition-all" style={{ backgroundColor: theme.bgSecondary }}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold text-lg" style={{ color: theme.text }}>{s.title}</h3>
                          {s.is_suspicious && <Badge variant="destructive" className="animate-pulse">Suspicious</Badge>}
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm mb-4" style={{ color: theme.textSecondary }}>
                          <span className="flex items-center gap-1"><GraduationCap className="w-4 h-4" /> {s.university_name}</span>
                          <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {s.country}</span>
                          <Badge variant="secondary" style={{ backgroundColor: theme.bg, color: theme.textSecondary }}>{s.degree_level}</Badge>
                        </div>
                        <div className="flex items-center gap-6 text-sm mb-4">
                          <span className="flex items-center gap-1.5 p-1.5 rounded-md font-bold" style={{ backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#f0fdf4', color: '#10b981' }}>
                            <Banknote className="w-4 h-4" /> {convertAndFormat(s.amount || "")}
                          </span>
                          <span className="flex items-center gap-1.5" style={{ color: theme.textSecondary }}>
                            <Calendar className="w-4 h-4" /> Deadline: {new Date(s.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                          </span>
                        </div>
                        <AIScholarshipButton
                          scholarship={{
                            id: s.id,
                            title: s.title,
                            university_name: s.university_name,
                            country: s.country,
                            amount: s.amount,
                            deadline: s.deadline,
                            degree_level: s.degree_level,
                          }}
                          variant={isDark ? 'dark' : 'light'}
                        />
                      </div>
                      <div className="flex md:flex-col gap-2 shrink-0 justify-end md:justify-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleUnsave(s.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Remove
                        </Button>
                        <Button size="sm" className="bg-[#1e3a8a] hover:bg-blue-800 rounded-xl font-bold px-6" onClick={() => onNavigate('detail', { id: s.id })}>
                          Explore
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
