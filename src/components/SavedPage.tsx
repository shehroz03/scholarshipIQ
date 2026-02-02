import { useState, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { GraduationCap, MapPin, Calendar, DollarSign, Trash2, Loader2, BookmarkX, Banknote } from "lucide-react";
import { api } from "../api";
import { CurrencySelector } from "./CurrencySelector";
import { useCurrency } from "../context/CurrencyContext";

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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('dashboard')}>
          <GraduationCap className="w-8 h-8 text-[#1e3a8a]" />
          <span className="text-xl font-semibold text-[#1e3a8a]">ScholarIQ</span>
        </div>
        <div className="flex items-center gap-4">
          <CurrencySelector />
          <Button variant="outline" onClick={() => onNavigate('dashboard')}>Back to Dashboard</Button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Saved Scholarships</h1>
          <p className="text-gray-600">Review and manage your bookmarked opportunities.</p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-[#1e3a8a] mb-4" />
            <p className="text-gray-500">Loading your saved list...</p>
          </div>
        ) : savedScholarships.length === 0 ? (
          <Card className="border-dashed border-2 py-20">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <BookmarkX className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Saved Scholarships</h3>
              <p className="text-gray-500 max-w-sm mb-6">
                You haven't saved any scholarships yet. Start exploring to find the best opportunities for you!
              </p>
              <Button onClick={() => onNavigate('search')} className="bg-[#1e3a8a] hover:bg-[#1e3a8a]/90">
                Explore Scholarships
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
            {savedScholarships.map((s: Scholarship) => (
              <Card key={s.id} className="border-none shadow-sm hover:shadow-md transition-shadow active:scale-[0.99]">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg text-gray-900">{s.title}</h3>
                        {s.is_suspicious && <Badge variant="destructive" className="animate-pulse">Suspicious</Badge>}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                        <span className="flex items-center gap-1"><GraduationCap className="w-4 h-4" /> {s.university_name}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {s.country}</span>
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50">{s.degree_level}</Badge>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <span className="flex items-center gap-1.5 p-1.5 bg-green-50 text-green-700 rounded-md font-medium">
                          <Banknote className="w-4 h-4" /> {convertAndFormat(s.amount || "")}
                        </span>
                        <span className="flex items-center gap-1.5 text-gray-500">
                          <Calendar className="w-4 h-4" /> Deadline: {new Date(s.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    <div className="flex md:flex-col gap-2 shrink-0 justify-end md:justify-center">
                      <Button
                        size="sm"
                        variant="destructive"
                        className="bg-red-50 text-red-600 hover:bg-red-100 border-none shadow-none"
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
        )}
      </main>
    </div>
  );
}
