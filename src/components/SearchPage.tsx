import { useState, useEffect } from "react";
import ApplyButton from "./ApplyButton";
import { Scholarship } from "../types/scholarship";
import {
  Search,
  GraduationCap,
  LayoutDashboard,
  Bookmark,
  Filter,
  MapPin,
  Calendar,
  Banknote,
  Loader2,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  ArrowUpDown,
  X
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "./ui/select";
import { Card, CardContent } from "./ui/card";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import { api } from "../api";

// --- Types ---
// Interface imported from ../types/scholarship.ts

interface University {
  id: number;
  name: string;
  city: string;
  country: string;
  website_url: string;
}

interface FilterState {
  targetCountry: string;
  targetCity: string;
  degreeLevel: string;
  fundingType: string;
  minCGPA: string;
  minFunding: string;
  fieldCategory: string;
  deadlineBefore: string;
}

// --- Navbar Component ---
function Navbar({ onNavigate }: { onNavigate?: (path: string) => void }) {
  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between shadow-sm">
      <div
        className="flex items-center gap-3 cursor-pointer group"
        onClick={() => onNavigate?.('dashboard')}
      >
        <div className="bg-[#1e3a8a] text-white p-2 rounded-lg shadow-sm group-hover:bg-blue-800 transition-colors">
          <GraduationCap className="h-5 w-5" />
        </div>
        <span className="text-xl font-bold text-gray-900 tracking-tight group-hover:text-[#1e3a8a] transition-colors">
          ScholarIQ
        </span>
      </div>

      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          className="text-gray-600 hover:text-[#1e3a8a] hover:bg-blue-50/50 font-medium hidden sm:flex"
          onClick={() => onNavigate?.('dashboard')}
        >
          <LayoutDashboard className="h-4 w-4 mr-2" />
          Dashboard
        </Button>
        <Button
          className="bg-[#1e3a8a] hover:bg-blue-800 text-white rounded-full px-6 font-semibold shadow-blue-900/10 shadow-lg transition-all"
          onClick={() => onNavigate?.('saved')}
        >
          <Bookmark className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Saved</span>
        </Button>
      </div>
    </nav>
  );
}

// --- Refine Search Card Component ---
function RefineSearchPanel({
  filters,
  setFilters,
  onSearch
}: {
  filters: FilterState,
  setFilters: (f: FilterState) => void,
  onSearch: () => void
}) {
  const handleChange = (key: keyof FilterState, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  return (
    <Card className="rounded-[1.5rem] border-none shadow-xl shadow-blue-900/5 bg-white sticky top-28 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 p-6 border-b border-blue-100/50">
        <div className="flex items-center gap-2.5 text-[#1e3a8a]">
          <div className="bg-white p-2 rounded-xl shadow-sm border border-blue-100">
            <Filter className="h-4 w-4" />
          </div>
          <h2 className="font-bold text-lg tracking-tight">Refine Results</h2>
        </div>
      </div>

      <CardContent className="p-6 space-y-6">
        {/* Target Country */}
        <div className="space-y-3">
          <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-blue-400" /> Target Country
          </label>
          <Select
            value={filters.targetCountry}
            onValueChange={(val: string) => handleChange('targetCountry', val)}
          >
            <SelectTrigger className="w-full bg-gray-50/50 border-gray-200 rounded-xl h-11 focus:ring-2 focus:ring-blue-100 focus:border-blue-200 hover:bg-white hover:border-blue-200 transition-all font-medium text-gray-700">
              <SelectValue placeholder="Global (All)" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-gray-100 shadow-xl">
              <SelectItem value="all">Global (All)</SelectItem>
              <SelectItem value="Australia">Australia</SelectItem>
              <SelectItem value="Canada">Canada</SelectItem>
              <SelectItem value="Germany">Germany</SelectItem>
              <SelectItem value="Malaysia">Malaysia</SelectItem>
              <SelectItem value="United Kingdom">United Kingdom</SelectItem>
              <SelectItem value="United States">United States</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Target City */}
        <div className="space-y-3">
          <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-blue-400" /> Target City
          </label>
          <Select
            value={filters.targetCity}
            onValueChange={(val: string) => handleChange('targetCity', val)}
          >
            <SelectTrigger className="w-full bg-gray-50/50 border-gray-200 rounded-xl h-11 focus:ring-2 focus:ring-blue-100 focus:border-blue-200 hover:bg-white hover:border-blue-200 transition-all font-medium text-gray-700">
              <SelectValue placeholder="All Cities" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-gray-100 shadow-xl">
              <SelectItem value="all">All Cities</SelectItem>
              <SelectItem value="London">London</SelectItem>
              <SelectItem value="Melbourne">Melbourne</SelectItem>
              <SelectItem value="Berlin">Berlin</SelectItem>
              <SelectItem value="Toronto">Toronto</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Degree Level */}
        <div className="space-y-3">
          <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest flex items-center gap-1.5">
            <GraduationCap className="w-3 h-3 text-blue-400" /> Degree Level
          </label>
          <Select
            value={filters.degreeLevel}
            onValueChange={(val: string) => handleChange('degreeLevel', val)}
          >
            <SelectTrigger className="w-full bg-gray-50/50 border-gray-200 rounded-xl h-11 focus:ring-2 focus:ring-blue-100 focus:border-blue-200 hover:bg-white hover:border-blue-200 transition-all font-medium text-gray-700">
              <SelectValue placeholder="All Levels" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-gray-100 shadow-xl">
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="Bachelors">Bachelor's</SelectItem>
              <SelectItem value="Masters">Master's</SelectItem>
              <SelectItem value="PhD">PhD</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Funding Type */}
        <div className="space-y-3">
          <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest flex items-center gap-1.5">
            <Banknote className="w-3 h-3 text-blue-400" /> Funding Type
          </label>
          <Select
            value={filters.fundingType}
            onValueChange={(val: string) => handleChange('fundingType', val)}
          >
            <SelectTrigger className="w-full bg-gray-50/50 border-gray-200 rounded-xl h-11 focus:ring-2 focus:ring-blue-100 focus:border-blue-200 hover:bg-white hover:border-blue-200 transition-all font-medium text-gray-700">
              <SelectValue placeholder="Any Funding" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-gray-100 shadow-xl">
              <SelectItem value="all">Any Funding</SelectItem>
              <SelectItem value="Fully Funded">Fully Funded</SelectItem>
              <SelectItem value="Partial">Partially Funded</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator className="bg-gray-100" />

        {/* Minimal CGPA */}
        <div className="space-y-3">
          <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest flex items-center gap-1.5">
            <GraduationCap className="w-3 h-3 text-blue-400" /> Min. CGPA
          </label>
          <Input
            type="number"
            step="0.1"
            placeholder="e.g. 3.0"
            className="bg-gray-50/50 border-gray-200 rounded-xl h-11"
            value={filters.minCGPA}
            onChange={(e) => handleChange('minCGPA', e.target.value)}
          />
        </div>

        {/* Min Funding */}
        <div className="space-y-3">
          <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest flex items-center gap-1.5">
            <Banknote className="w-3 h-3 text-blue-400" /> Min. Funding (USD)
          </label>
          <Input
            type="number"
            placeholder="e.g. 10000"
            className="bg-gray-50/50 border-gray-200 rounded-xl h-11"
            value={filters.minFunding}
            onChange={(e) => handleChange('minFunding', e.target.value)}
          />
        </div>

        {/* Field Category */}
        <div className="space-y-3">
          <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest flex items-center gap-1.5">
            <Filter className="w-3 h-3 text-blue-400" /> Field of Study
          </label>
          <Input
            placeholder="e.g. Computer Science"
            className="bg-gray-50/50 border-gray-200 rounded-xl h-11"
            value={filters.fieldCategory}
            onChange={(e) => handleChange('fieldCategory', e.target.value)}
          />
        </div>

        {/* Deadline Before */}
        <div className="space-y-3">
          <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest flex items-center gap-1.5">
            <Calendar className="w-3 h-3 text-blue-400" /> Deadline Before
          </label>
          <Input
            type="date"
            className="bg-gray-50/50 border-gray-200 rounded-xl h-11"
            value={filters.deadlineBefore}
            onChange={(e) => handleChange('deadlineBefore', e.target.value)}
          />
        </div>

        <div className="pt-4 mt-2 border-t border-gray-50">
          <Button
            className="w-full bg-[#1e3a8a] hover:bg-blue-800 text-white font-bold rounded-xl h-12 shadow-lg shadow-blue-900/10 hover:shadow-blue-900/20 transition-all active:scale-[0.98]"
            onClick={onSearch}
          >
            Apply Filters
          </Button>
        </div>
      </CardContent>

    </Card>
  );
}

// --- Loading Skeleton ---
function ScholarshipsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="border-none shadow-sm bg-white overflow-hidden border border-gray-100/50">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 space-y-3">
                <div className="h-6 bg-gray-100 rounded-md w-3/4 animate-pulse" />
                <div className="flex gap-4">
                  <div className="h-4 bg-gray-50 rounded w-1/4 animate-pulse" />
                  <div className="h-4 bg-gray-50 rounded w-1/4 animate-pulse" />
                </div>
                <div className="flex gap-2 pt-2">
                  <div className="h-5 bg-gray-100 rounded w-20 animate-pulse" />
                  <div className="h-5 bg-gray-100 rounded w-24 animate-pulse" />
                </div>
              </div>
              <div className="flex flex-col items-end gap-4">
                <div className="h-10 w-32 bg-gray-100 rounded-xl animate-pulse" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// --- Main Page Component ---
export function SearchPage({ onNavigate = () => { }, initialFilters = {} }: { onNavigate?: (page: string, params?: any) => void; initialFilters?: any }) {
  // --- State ---
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    targetCountry: "all",
    targetCity: "all",
    degreeLevel: "all",
    fundingType: "all",
    minCGPA: "",
    minFunding: "",
    fieldCategory: "",
    deadlineBefore: ""
  });
  const [activeTab, setActiveTab] = useState("SCHOLARSHIPS");
  const [sortBy, setSortBy] = useState("relevance");

  // Data State
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Initialize universities with dummy data (placeholder)
  useEffect(() => {
    setUniversities([
      { id: 1, name: "University of Melbourne", city: "Melbourne", country: "Australia", website_url: "https://unimelb.edu.au" },
      { id: 2, name: "Technical University of Munich", city: "Munich", country: "Germany", website_url: "https://tum.de" },
      { id: 3, name: "University of Toronto", city: "Toronto", country: "Canada", website_url: "https://utoronto.ca" },
      { id: 4, name: "Imperial College London", city: "London", country: "UK", website_url: "https://imperial.ac.uk" },
      { id: 5, name: "Universiti Malaya", city: "Kuala Lumpur", country: "Malaysia", website_url: "https://um.edu.my" },
    ]);
  }, []);

  // Initialize from URL params or initialFilters prop
  useEffect(() => {
    if (initialFilters && Object.keys(initialFilters).length > 0) {
      // Set query if provided
      if (initialFilters.query) {
        setQuery(initialFilters.query);
      }

      // Set filters from props
      const updatedFilters: FilterState = { ...filters };

      if (initialFilters.country) {
        updatedFilters.targetCountry = initialFilters.country;
      }
      if (initialFilters.city) {
        updatedFilters.targetCity = initialFilters.city;
      }
      if (initialFilters.level) {
        updatedFilters.degreeLevel = initialFilters.level;
      }
      if (initialFilters.funding_type) {
        updatedFilters.fundingType = initialFilters.funding_type;
      }
      if (initialFilters.min_cgpa) {
        updatedFilters.minCGPA = initialFilters.min_cgpa.toString();
      }
      if (initialFilters.min_funding) {
        updatedFilters.minFunding = initialFilters.min_funding.toString();
      }
      if (initialFilters.field_category) {
        updatedFilters.fieldCategory = initialFilters.field_category;
      }
      if (initialFilters.deadline_before) {
        updatedFilters.deadlineBefore = initialFilters.deadline_before;
      }

      // Update filters state
      setFilters(updatedFilters);

      // Mark that we should auto-search
      setHasSearched(true);

      // Auto-trigger search after state updates
      setTimeout(() => {
        const params = new URLSearchParams();
        if (initialFilters.query) params.append("keyword", initialFilters.query);
        if (initialFilters.country && initialFilters.country !== "all") params.append("country", initialFilters.country);
        if (initialFilters.city && initialFilters.city !== "all") params.append("city", initialFilters.city);
        if (initialFilters.level && initialFilters.level !== "all") params.append("level", initialFilters.level);
        if (initialFilters.funding_type && initialFilters.funding_type !== "all") params.append("funding_type", initialFilters.funding_type);
        if (initialFilters.min_cgpa) params.append("min_cgpa", initialFilters.min_cgpa.toString());
        if (initialFilters.min_funding) params.append("min_funding_amount", initialFilters.min_funding.toString());
        if (initialFilters.field_category) params.append("field_category", initialFilters.field_category);
        if (initialFilters.deadline_before) params.append("deadline_before", initialFilters.deadline_before);
        params.append("page_size", pageSize.toString());

        setLoading(true);
        api.scholarships.list({
          keyword: initialFilters.query,
          country: initialFilters.country === "all" ? undefined : initialFilters.country,
          city: initialFilters.city === "all" ? undefined : initialFilters.city,
          level: initialFilters.level === "all" ? undefined : initialFilters.level,
          funding_type: initialFilters.funding_type === "all" ? undefined : initialFilters.funding_type,
          min_cgpa: initialFilters.min_cgpa,
          min_funding_amount: initialFilters.min_funding,
          field_category: initialFilters.field_category,
          deadline_before: initialFilters.deadline_before,
          page: 1,
          page_size: pageSize
        })
          .then(data => {
            const results = data.results || [];
            setTotalResults(data.total || 0);
            setTotalPages(data.total_pages || 0);
            setCurrentPage(data.page || 1);

            const sanitizedResults: Scholarship[] = (results || []).map((item: any) => ({
              id: item.id,
              title: item.title || "Untitled Scholarship",
              university_name: item.university_name || (item.university ? item.university.name : "Unknown University"),
              country: item.country || "Unknown Country",
              city: item.city || null,
              degree_level: item.degree_level || "Not Specified",
              funding_type: item.funding_type || "Various",
              deadline: item.deadline || new Date().toISOString(),
              funding_amount: item.funding_amount || item.scholarship_amount_value || null,
              tuition_fee_per_year: item.tuition_fee_per_year,
              net_cost_per_year: item.net_cost_per_year,
              tuition_verified: item.tuition_verified,
              university: item.university,
              scholarship_url: item.scholarship_url || item.website_url,
              website_url: item.website_url
            }));
            setScholarships(sanitizedResults);
            setLoading(false);
          })
          .catch(err => {
            console.error("Search error:", err);
            setError("Failed to load scholarships. Please try again.");
            setLoading(false);
          });
      }, 100);
    }
  }, []);

  // --- Search Handler with Pagination ---
  const handleSearch = async (page: number = currentPage, forcedPageSize?: number) => {
    setLoading(true);
    setError(null);
    setHasSearched(true);

    const sizeToUse = forcedPageSize || pageSize;

    try {
      const data = await api.scholarships.list({
        page: page,
        page_size: sizeToUse,
        keyword: query || undefined,
        country: filters.targetCountry === "all" ? undefined : filters.targetCountry,
        city: filters.targetCity === "all" ? undefined : filters.targetCity,
        level: filters.degreeLevel === "all" ? undefined : filters.degreeLevel,
        funding_type: filters.fundingType === "all" ? undefined : filters.fundingType,
        min_cgpa: filters.minCGPA || undefined,
        min_funding_amount: filters.minFunding || undefined,
        field_category: filters.fieldCategory || undefined,
        deadline_before: filters.deadlineBefore || undefined
      });

      // Handle paginated response
      const results = data.results || [];
      setTotalResults(data.total || 0);
      setTotalPages(data.total_pages || 0);
      setCurrentPage(data.page || 1);

      const sanitizedResults: Scholarship[] = (results || []).map((item: any) => ({
        id: item.id,
        title: item.title || "Untitled Scholarship",
        university_name: item.university_name || (item.university ? item.university.name : "Unknown University"),
        country: item.country || "Unknown Country",
        city: item.city,
        degree_level: item.degree_level || "Any Degree",
        funding_type: item.funding_type || "Various",
        deadline: item.deadline || new Date().toISOString(),
        funding_amount: item.funding_amount || item.scholarship_amount_value || null,
        tuition_fee_per_year: item.tuition_fee_per_year,
        net_cost_per_year: item.net_cost_per_year,
        tuition_verified: item.tuition_verified,
        university: item.university,
        scholarship_url: item.scholarship_url || item.website_url,
        website_url: item.website_url
      }));

      setScholarships(sanitizedResults);

      // Scroll to top of results
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      console.error("Search error:", err);
      setError("We couldn't load scholarships right now. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  // --- Pagination & Page Size Handlers ---
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    handleSearch(newPage);
  };

  const handlePageSizeChange = (newSize: string) => {
    const size = parseInt(newSize);
    setPageSize(size);
    setCurrentPage(1);
    handleSearch(1, size);
  };

  // --- Results Summary Helper ---
  const getResultsSummary = () => {
    if (totalResults === 0) return "";

    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalResults);

    let summary = `Showing ${start}\u2013${end} of ${totalResults} scholarships`;

    const { degreeLevel, targetCountry } = filters;

    if (degreeLevel !== "all" && targetCountry !== "all") {
      summary += ` for ${degreeLevel} in ${targetCountry}`;
    } else if (degreeLevel !== "all") {
      summary += ` for ${degreeLevel} programs`;
    } else if (targetCountry !== "all") {
      summary += ` in ${targetCountry}`;
    }

    if (query) {
      summary += ` matching "${query}"`;
    }

    return summary;
  };

  // --- Remove Filter Handler ---
  const removeFilter = (filterKey: keyof FilterState) => {
    const isSpecialValue = ["targetCountry", "targetCity", "degreeLevel", "fundingType"].includes(filterKey);
    setFilters({ ...filters, [filterKey]: isSpecialValue ? "all" : "" });
    setCurrentPage(1);
    // Trigger search with updated filters (effect will catch filter change and reset page)
  };

  // --- Helper: Parse numeric funding amount for sorting ---
  const getNumericAmount = (amountStr?: string | null): number => {
    if (!amountStr) return 0;
    // Extract first number found
    const match = amountStr.match(/(\d[\d,.]*)/);
    if (match) {
      // Remove commas
      return parseFloat(match[1].replace(/,/g, ''));
    }
    return 0;
  };

  // --- Derived State: Sorted Scholarships ---
  const sortedScholarships = [...scholarships].sort((a, b) => {
    if (sortBy === "deadline") {
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    }
    if (sortBy === "amount") {
      return getNumericAmount(b.funding_amount) - getNumericAmount(a.funding_amount);
    }
    return 0; // Default relevance (API order)
  });

  // Effect to trigger search when filters or search query change
  useEffect(() => {
    const isAnyFilterActive = filters.targetCountry !== "all" ||
      filters.targetCity !== "all" ||
      filters.degreeLevel !== "all" ||
      filters.fundingType !== "all" ||
      filters.minCGPA ||
      filters.minFunding ||
      filters.fieldCategory ||
      filters.deadlineBefore;

    // Trigger search if any filter is active, or if we've already searched, or if there's a keyword
    if (isAnyFilterActive || hasSearched || query) {
      // Use a small delay for text-based refinement to avoid too many API calls while typing
      const debounceDelay = (query.length > 0 || filters.fieldCategory || filters.minCGPA) ? 500 : 0;

      const timer = setTimeout(() => {
        setCurrentPage(1);
        handleSearch(1);
      }, debounceDelay);

      return () => clearTimeout(timer);
    }
  }, [filters, query]);

  // Format Date
  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? "Ongoing" : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Chip Component
  const FilterChip = ({ label, onRemove }: { label: string, onRemove: () => void }) => (
    <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100 transition-colors">
      {label}
      <button onClick={onRemove} className="hover:bg-blue-200 rounded-full p-0.5 ml-1">
        <X className="w-3 h-3" />
      </button>
    </Badge>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-gray-50 font-sans">
      <Navbar onNavigate={onNavigate} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start relative">
          {/* Left Sidebar - Sticky & Premium */}
          <aside className="w-full md:w-72 lg:w-80 flex-shrink-0 z-10 sticky top-24">
            <RefineSearchPanel
              filters={filters}
              setFilters={setFilters}
              onSearch={() => handleSearch()}
            />
          </aside>

          {/* Right Content */}
          <div className="flex-1 w-full min-w-0">
            <div className="flex flex-col gap-6">

              {/* Search Header Area (Inside Right Column) */}
              <div className="space-y-4">
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full blur opacity-50 group-hover:opacity-75 transition duration-1000 group-hover:duration-200" />
                  <div className="relative flex items-center bg-white rounded-full shadow-[0_2px_20px_rgb(0,0,0,0.04)] border border-gray-100 p-1.5 h-16 transition-all focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-200">
                    <div className="pl-6 pr-4 text-gray-400">
                      <Search className="h-5 w-5" />
                    </div>
                    <Input
                      placeholder="Search by title, country, or keyword..."
                      className="flex-1 border-none shadow-none text-base sm:text-lg h-full focus-visible:ring-0 px-0 placeholder:text-gray-400 bg-transparent text-gray-800"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { setCurrentPage(1); handleSearch(1); } }}
                    />
                    <Button
                      className="h-12 px-8 rounded-full bg-[#1e3a8a] hover:bg-blue-800 text-white font-bold tracking-wide transition-all shadow-lg shadow-blue-900/10 hover:shadow-blue-900/20 disabled:opacity-70 mx-1"
                      onClick={() => { setCurrentPage(1); handleSearch(1); }}
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Search"}
                    </Button>
                  </div>
                </div>

                {/* Active Filter Chips */}
                {(filters.targetCountry !== "all" || filters.targetCity !== "all" || filters.degreeLevel !== "all" || filters.fundingType !== "all" || filters.minCGPA || filters.minFunding || filters.fieldCategory || filters.deadlineBefore) && (
                  <div className="flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-top-2 ml-1">
                    {filters.targetCountry !== "all" && <FilterChip label={`Country: ${filters.targetCountry}`} onRemove={() => removeFilter('targetCountry')} />}
                    {filters.targetCity !== "all" && <FilterChip label={`City: ${filters.targetCity}`} onRemove={() => removeFilter('targetCity')} />}
                    {filters.degreeLevel !== "all" && <FilterChip label={`Level: ${filters.degreeLevel}`} onRemove={() => removeFilter('degreeLevel')} />}
                    {filters.fundingType !== "all" && <FilterChip label={`Funding: ${filters.fundingType}`} onRemove={() => removeFilter('fundingType')} />}
                    {filters.minCGPA && <FilterChip label={`Min CGPA: ${filters.minCGPA}`} onRemove={() => removeFilter('minCGPA')} />}
                    {filters.minFunding && <FilterChip label={`Min Funding: $${filters.minFunding}`} onRemove={() => removeFilter('minFunding')} />}
                    {filters.fieldCategory && <FilterChip label={`Field: ${filters.fieldCategory}`} onRemove={() => removeFilter('fieldCategory')} />}
                    {filters.deadlineBefore && <FilterChip label={`Before: ${filters.deadlineBefore}`} onRemove={() => removeFilter('deadlineBefore')} />}
                    <button
                      className="text-gray-400 hover:text-red-500 text-xs font-semibold px-3 py-1.5 transition-colors"
                      onClick={() => setFilters({
                        targetCountry: "all",
                        targetCity: "all",
                        degreeLevel: "all",
                        fundingType: "all",
                        minCGPA: "",
                        minFunding: "",
                        fieldCategory: "",
                        deadlineBefore: ""
                      })}
                    >
                      Clear all
                    </button>
                  </div>
                )}
              </div>

              {/* Tab Headers & Sort Controls */}
              {/* Tab Headers & Sort Controls - VIP Style */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-2">

                {/* Custom Segmented Control */}
                <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 inline-flex items-center gap-1 w-full sm:w-auto">
                  <button
                    className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'SCHOLARSHIPS'
                      ? 'bg-[#1e3a8a] text-white shadow-md shadow-blue-900/10'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    onClick={() => setActiveTab('SCHOLARSHIPS')}
                  >
                    <GraduationCap className={`w-4 h-4 ${activeTab === 'SCHOLARSHIPS' ? 'text-blue-200' : 'text-gray-400'}`} />
                    Scholarships
                    {activeTab === 'SCHOLARSHIPS' && sortedScholarships.length > 0 && (
                      <span className="bg-blue-500/20 text-blue-100 text-[10px] px-1.5 py-0.5 rounded-md ml-1">{sortedScholarships.length}</span>
                    )}
                  </button>
                  <button
                    className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'UNIVERSITIES'
                      ? 'bg-[#1e3a8a] text-white shadow-md shadow-blue-900/10'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    onClick={() => setActiveTab('UNIVERSITIES')}
                  >
                    <div className={`p-0.5 rounded-md ${activeTab === 'UNIVERSITIES' ? 'bg-blue-500/20' : 'bg-gray-200'}`}>
                      <Search className={`w-3 h-3 ${activeTab === 'UNIVERSITIES' ? 'text-blue-100' : 'text-gray-500'}`} />
                    </div>
                    Universities
                  </button>
                </div>

                {activeTab === 'SCHOLARSHIPS' && (
                  <div className="flex items-center gap-3 bg-white p-1 pl-4 rounded-xl border border-gray-100 shadow-sm ml-auto sm:ml-0">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider hidden sm:inline">Sort by</span>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-[160px] h-9 text-xs bg-gray-50 border-transparent rounded-lg font-bold text-gray-700 hover:bg-gray-100 transition-colors focus:ring-0">
                        <SelectValue placeholder="Relevance" />
                      </SelectTrigger>
                      <SelectContent align="end" className="rounded-xl border-gray-100 shadow-xl">
                        <SelectItem value="relevance" className="font-medium text-xs py-2">Most Relevant</SelectItem>
                        <SelectItem value="deadline" className="font-medium text-xs py-2">Deadline (Soonest)</SelectItem>
                        <SelectItem value="amount" className="font-medium text-xs py-2">Funding Amount (High)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Error Banner */}
              {error && (
                <div className="bg-red-50 border border-red-100 rounded-lg p-4 flex items-center justify-between text-sm text-red-700 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-2">
                    <div className="bg-red-100 p-1 rounded-full"><Search className="w-4 h-4 text-red-600" /></div>
                    {error}
                  </div>
                  <Button variant="outline" size="sm" className="bg-white border-red-200 text-red-600 hover:bg-red-50 h-8" onClick={() => handleSearch()}>
                    Retry
                  </Button>
                </div>
              )}

              {/* Tab Content */}
              <div className="min-h-[400px]">
                {loading ? (
                  <ScholarshipsSkeleton />
                ) : activeTab === 'SCHOLARSHIPS' ? (
                  // SCHOLARSHIPS TAB CONTENT
                  !hasSearched && sortedScholarships.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white/80 rounded-2xl border border-gray-200 text-center shadow-sm">
                      <div className="bg-blue-50 p-4 rounded-full mb-4 ring-4 ring-blue-50/50">
                        <Search className="w-8 h-8 text-[#1e3a8a]" />
                      </div>
                      <h3 className="font-bold text-gray-900 text-lg mb-2">Ready to explore?</h3>
                      <p className="text-gray-500 max-w-sm px-6">
                        Start by entering a keyword or choosing filters to discover scholarships explicitly tailored to you.
                      </p>
                    </div>
                  ) : sortedScholarships.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white/80 rounded-2xl border border-gray-200 text-center shadow-sm">
                      <div className="bg-blue-50 p-4 rounded-full mb-4">
                        <GraduationCap className="w-8 h-8 text-[#1e3a8a]" />
                      </div>
                      <h3 className="font-bold text-gray-900 text-lg mb-2">No scholarships loaded yet</h3>
                      <p className="text-gray-500 max-w-sm px-6">
                        Admin is importing verified data.
                      </p>
                      <Button
                        variant="link"
                        className="text-[#1e3a8a] mt-2 font-bold"
                        onClick={() => {
                          setFilters({
                            targetCountry: "all",
                            targetCity: "all",
                            degreeLevel: "all",
                            fundingType: "all",
                            minCGPA: "",
                            minFunding: "",
                            fieldCategory: "",
                            deadlineBefore: ""
                          });
                          setQuery("");
                        }}
                      >
                        Clear Filters
                      </Button>
                    </div>
                  ) : (
                    <>
                      {/* Results Summary Line */}
                      {totalResults > 0 && activeTab === 'SCHOLARSHIPS' && (
                        <div className="mb-5 px-1 animate-in fade-in slide-in-from-left-2 duration-700">
                          <p className="text-sm font-medium text-gray-500 bg-white/50 backdrop-blur-sm inline-flex py-1 px-3 rounded-full border border-gray-100 shadow-sm">
                            {getResultsSummary()}
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {sortedScholarships.map((s) => (
                          <Card key={s.id} className="group border-none shadow-sm hover:shadow-lg transition-all duration-300 bg-white overflow-hidden border border-gray-100/50">
                            <CardContent className="p-6">
                              <div className="flex flex-col md:flex-row gap-6">
                                {s.university?.logo_url && (
                                  <div className="hidden md:flex w-16 h-16 bg-white rounded-xl border border-gray-100 p-1 items-center justify-center shrink-0 shadow-sm overflow-hidden self-start">
                                    <img
                                      src={s.university.logo_url}
                                      alt={s.university_name}
                                      className="max-w-full max-h-full object-contain"
                                      onError={(e) => (e.currentTarget.style.display = 'none')}
                                    />
                                  </div>
                                )}
                                <div className="flex-1 space-y-4">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="font-bold text-xl text-gray-900 group-hover:text-[#1e3a8a] transition-colors">{s.title}</h3>
                                    {s.tuition_verified === "verified" && (
                                      <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-none px-2 py-0.5 text-[10px] font-black uppercase tracking-widest">
                                        Verified ✅
                                      </Badge>
                                    )}
                                    {typeof s.match_score === 'number' && s.match_score > 0 && (
                                      <Badge className={`border-none px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${s.match_score >= 80 ? "bg-green-500 text-white" :
                                        s.match_score >= 50 ? "bg-amber-100 text-amber-700" :
                                          "bg-red-50 text-red-700"
                                        }`}>
                                        {s.match_score}% Match ⚡
                                      </Badge>
                                    )}
                                  </div>

                                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500 font-medium">
                                    <span className="flex items-center gap-1.5 hover:text-[#1e3a8a] transition-colors cursor-default">
                                      <GraduationCap className="h-4 w-4 text-[#1e3a8a]" />
                                      {s.university_name}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                      <MapPin className="h-4 w-4 text-gray-400" />
                                      {s.city ? `${s.city}, ` : ''}{s.country}
                                    </span>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-3">
                                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 font-bold border-none">{s.degree_level}</Badge>
                                    <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 font-bold border-none">{s.funding_type}</Badge>
                                    {s.university?.min_cgpa && (
                                      <Badge variant="outline" className="border-amber-200 text-amber-700 font-bold">
                                        Min. {s.university.min_cgpa} CGPA
                                      </Badge>
                                    )}
                                  </div>

                                  {s.tuition_fee_per_year && s.net_cost_per_year && (
                                    <div className="bg-gray-50/50 rounded-2xl p-3 inline-flex items-center gap-3 border border-gray-100">
                                      <span className="text-xs font-bold text-gray-400 line-through">{s.tuition_fee_per_year.split(' ')[0]}</span>
                                      <ChevronRight className="w-3 h-3 text-gray-300" />
                                      <span className="text-sm font-black text-green-600">{s.net_cost_per_year}</span>
                                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Net Fee</span>
                                    </div>
                                  )}
                                </div>

                                <div className="flex flex-col items-end justify-between min-w-[180px] gap-4">
                                  <div className="text-right space-y-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Deadline</p>
                                    <p className={`font-bold flex items-center gap-1.5 ${new Date(s.deadline).getTime() < new Date().getTime() + 1000 * 60 * 60 * 24 * 30 ? 'text-red-500' : 'text-gray-700'}`}>
                                      <Calendar className="w-4 h-4" />
                                      {formatDate(s.deadline)}
                                    </p>
                                  </div>

                                  <div className="flex flex-col gap-2 w-full">
                                    <Button
                                      className="w-full bg-[#1e3a8a] text-white font-bold rounded-xl h-11 shadow-lg shadow-blue-900/10 transition-all active:scale-[0.98] border-2 border-transparent hover:border-blue-300 hover:bg-blue-700"
                                      onClick={() => onNavigate('detail', { id: s.id })}
                                    >
                                      View Details
                                    </Button>

                                    <ApplyButton scholarship={s} variant="card" />
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {/* Pagination Bar */}
                      {totalPages > 1 && (
                        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-6 bg-white p-4 rounded-2xl border border-gray-100 shadow-md shadow-blue-900/5">
                          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                            <p className="text-sm text-gray-500 font-medium whitespace-nowrap">
                              Page <span className="text-gray-900 font-bold">{currentPage}</span> of <span className="text-gray-900 font-bold">{totalPages}</span>
                            </p>

                            <div className="h-4 w-px bg-gray-100 hidden sm:block" />

                            <div className="flex items-center gap-2">
                              <span className="text-[10px] uppercase font-black text-gray-400 tracking-widest whitespace-nowrap">Show</span>
                              <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                                <SelectTrigger className="w-[75px] h-9 text-xs bg-gray-50 border-gray-100 rounded-xl font-bold text-gray-700 hover:bg-gray-100 hover:border-blue-200 transition-all focus:ring-0">
                                  <SelectValue placeholder="15" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-gray-100 shadow-2xl">
                                  <SelectItem value="15" className="font-bold text-xs py-2">15</SelectItem>
                                  <SelectItem value="30" className="font-bold text-xs py-2">30</SelectItem>
                                  <SelectItem value="50" className="font-bold text-xs py-2">50</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-xl border-gray-200 hover:bg-gray-50 hover:border-blue-200 disabled:opacity-50 h-10 px-4 font-bold transition-all"
                              onClick={() => handlePageChange(currentPage - 1)}
                              disabled={currentPage === 1 || loading}
                            >
                              <ChevronLeft className="w-4 h-4 mr-1.5" /> Prev
                            </Button>

                            <div className="flex items-center gap-1.5 mx-1 hidden md:flex">
                              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                  pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                  pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                  pageNum = totalPages - 4 + i;
                                } else {
                                  pageNum = currentPage - 2 + i;
                                }

                                return (
                                  <button
                                    key={pageNum}
                                    onClick={() => handlePageChange(pageNum)}
                                    className={`w-10 h-10 rounded-xl text-sm font-bold transition-all duration-300 ${currentPage === pageNum
                                      ? 'bg-[#1e3a8a] text-white shadow-lg shadow-blue-900/20 scale-105'
                                      : 'text-gray-500 hover:bg-blue-50 hover:text-[#1e3a8a]'
                                      }`}
                                    disabled={loading}
                                  >
                                    {pageNum}
                                  </button>
                                );
                              })}
                            </div>

                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-xl border-gray-200 hover:bg-gray-50 hover:border-blue-200 disabled:opacity-50 h-10 px-4 font-bold transition-all"
                              onClick={() => handlePageChange(currentPage + 1)}
                              disabled={currentPage === totalPages || loading}
                            >
                              Next <ChevronRight className="w-4 h-4 ml-1.5" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )
                ) : (
                  // UNIVERSITIES TAB CONTENT
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {universities.map((uni) => (
                      <Card key={uni.id} className="border-none shadow-sm hover:shadow-lg transition-all duration-300 bg-white group hover:-translate-y-1">
                        <CardContent className="p-6 flex flex-col h-full">
                          <div className="flex items-start justify-between mb-4">
                            <div className="bg-blue-50 p-3 rounded-xl group-hover:bg-[#1e3a8a] group-hover:text-white transition-colors duration-300">
                              <GraduationCap className="h-6 w-6" />
                            </div>
                          </div>

                          <div className="mb-4 flex-1">
                            <h3 className="font-bold text-lg text-gray-900 group-hover:text-[#1e3a8a] transition-colors mb-1">
                              {uni.name}
                            </h3>
                            <p className="text-sm text-gray-500 flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5" /> {uni.city}, {uni.country}
                            </p>
                          </div>

                          <div className="pt-4 border-t border-gray-50 mt-auto">
                            <a
                              href={uni.website_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-bold text-[#1e3a8a] hover:text-blue-700 flex items-center gap-1 group/link"
                            >
                              Visit Website <ExternalLink className="w-3 h-3 opacity-50 group-hover/link:opacity-100 transition-opacity" />
                            </a>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default SearchPage;