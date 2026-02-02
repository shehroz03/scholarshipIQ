import { useState, useEffect, useRef, useMemo } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import {
    MapPin,
    ExternalLink,
    Search,
    Target,
    Navigation,
    Calendar,
    GraduationCap,
    Loader2,
    Info,
    ChevronRight,
    Sparkles,
    Banknote
} from "lucide-react";
import { api } from "../api";
import { CurrencySelector } from "../components/CurrencySelector";
import { useCurrency } from "../context/CurrencyContext";

// Google Maps Configuration
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyAq2y3A26R2QNkzCvap9koXzRpXeHnpRpo";
const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = ["places"];

const mapContainerStyle = {
    width: "100%",
    height: "100%",
};

const defaultCenter = {
    lat: 51.5074,
    lng: -0.1278, // London
};

const mapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: true,
    styles: [
        {
            featureType: "all",
            elementType: "labels.text.fill",
            stylers: [{ color: "#1e3a8a" }],
        },
        {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#e3f2fd" }],
        },
    ],
};

interface UniversityScholarship {
    id: number;
    name: string;
    field_of_study: string;
    funding_type: string;
    funding_amount: string;
    duration_years: number;
    duration_text: string;
    deadline: string;
    eligibility: string;
    scholarship_url: string;
}

interface University {
    id: number;
    name: string;
    city: string;
    country: string;
    latitude: number | null;
    longitude: number | null;
    website_url: string;
    scholarship_count: number;
    scholarships?: UniversityScholarship[];
}



export function UniversityMatcher({ onNavigate }: { onNavigate: (page: string, params?: any) => void }) {
    const { convertAndFormat } = useCurrency();
    const [countries, setCountries] = useState<string[]>([]);
    const [cities, setCities] = useState<string[]>([]);
    const [selectedCountry, setSelectedCountry] = useState<string>("");
    const [selectedCity, setSelectedCity] = useState<string>("");
    const [universities, setUniversities] = useState<University[]>([]);

    const [isLoadingCountries, setIsLoadingCountries] = useState(false);
    const [isLoadingCities, setIsLoadingCities] = useState(false);
    const [isLoadingUnis, setIsLoadingUnis] = useState(false);

    const [hoveredUni, setHoveredUni] = useState<string | null>(null);
    const [activeMarker, setActiveMarker] = useState<University | null>(null);
    const [selectedUniDetails, setSelectedUniDetails] = useState<University | null>(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [mapCenter, setMapCenter] = useState(defaultCenter);
    const [mapZoom, setMapZoom] = useState(11);

    const mapRef = useRef<google.maps.Map | null>(null);
    const listRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries,
    });

    // Fetch initial countries
    useEffect(() => {
        const fetchCountries = async () => {
            setIsLoadingCountries(true);
            try {
                const data = await api.scholarships.getCountries();
                setCountries(data);
            } catch (err) {
                console.error("Failed to fetch countries", err);
            } finally {
                setIsLoadingCountries(false);
            }
        };
        fetchCountries();
    }, []);

    // Fetch cities when country changes
    useEffect(() => {
        if (!selectedCountry) return;
        const fetchCities = async () => {
            setIsLoadingCities(true);
            try {
                const data = await api.scholarships.getCities(selectedCountry);
                setCities(data);
                setSelectedCity("");
            } catch (err) {
                console.error("Failed to fetch cities", err);
            } finally {
                setIsLoadingCities(false);
            }
        };
        fetchCities();
    }, [selectedCountry]);

    // Fetch universities when city changes
    useEffect(() => {
        if (!selectedCountry || !selectedCity) return;
        const fetchUniversities = async () => {
            setIsLoadingUnis(true);
            try {
                const data = await api.scholarships.getUniversities({ country: selectedCountry, city: selectedCity });
                setUniversities(data);
                setSelectedUniDetails(null); // Reset details on city change

                // Update map center to first university if available
                if (data.length > 0 && data[0].latitude && data[0].longitude) {
                    setMapCenter({ lat: data[0].latitude, lng: data[0].longitude });
                    setMapZoom(12);
                }
            } catch (err) {
                console.error("Failed to fetch universities", err);
            } finally {
                setIsLoadingUnis(false);
            }
        };
        fetchUniversities();
    }, [selectedCity, selectedCountry]);

    const fetchUniDetails = async (name: string) => {
        setIsLoadingDetails(true);
        try {
            const details = await api.scholarships.getUniversityByName(name);
            setSelectedUniDetails(details);
        } catch (err) {
            console.error("Failed to fetch university details", err);
        } finally {
            setIsLoadingDetails(false);
        }
    };

    const onMapLoad = (map: google.maps.Map) => {
        mapRef.current = map;
    };

    const handleUniClick = (uni: University) => {
        setActiveMarker(uni);
        fetchUniDetails(uni.name);
        if (uni.latitude && uni.longitude) {
            setMapCenter({ lat: uni.latitude, lng: uni.longitude });
            setMapZoom(15);
            mapRef.current?.panTo({ lat: uni.latitude, lng: uni.longitude });
        }
    };

    const handleMarkerClick = (uni: University) => {
        setActiveMarker(uni);
        fetchUniDetails(uni.name);
        // Scroll list to the university card
        listRefs.current[uni.name]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    if (loadError) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-red-50">
                <div className="text-center p-8 bg-white rounded-2xl shadow-xl border border-red-100 max-w-md">
                    <Info className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Map Load Error</h2>
                    <p className="text-gray-600 mb-6">We couldn't load the Google Maps interface. Please check your internet connection and API key.</p>
                    <Button onClick={() => window.location.reload()} variant="outline">Try Again</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
            {/* Navbar Placeholder / Back Button */}
            <div className="bg-white border-b px-4 lg:px-6 py-4 flex flex-col sm:flex-row items-center justify-between z-40 shadow-sm gap-4">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <Button variant="ghost" size="sm" onClick={() => onNavigate('landing')} className="hover:bg-blue-50 text-blue-600">
                        <ChevronRight className="w-4 h-4 rotate-180 mr-1" /> Back
                    </Button>
                    <h1 className="text-lg lg:text-xl font-bold text-gray-900 flex items-center gap-2 truncate">
                        <MapPin className="text-blue-600 w-5 h-5 shrink-0" /> University Matcher
                        <Badge variant="outline" className="hidden sm:inline-flex bg-blue-50 text-blue-700 border-blue-100">Live Map</Badge>
                    </h1>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
                    <CurrencySelector />
                    <div className="flex items-center gap-2">
                        <Label className="text-[10px] lg:text-xs font-bold uppercase text-gray-500 whitespace-nowrap">Country</Label>
                        <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                            <SelectTrigger className="w-[130px] lg:w-[180px] h-9 bg-white border-gray-200">
                                <SelectValue placeholder={isLoadingCountries ? "..." : "Select"} />
                            </SelectTrigger>
                            <SelectContent>
                                {countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2">
                        <Label className="text-[10px] lg:text-xs font-bold uppercase text-gray-500 whitespace-nowrap">City</Label>
                        <Select value={selectedCity} onValueChange={setSelectedCity} disabled={!selectedCountry || isLoadingCities}>
                            <SelectTrigger className="w-[130px] lg:w-[180px] h-9 bg-white border-gray-200">
                                <SelectValue placeholder={isLoadingCities ? "..." : "Select"} />
                            </SelectTrigger>
                            <SelectContent>
                                {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
                {/* Left Panel: University List (30%) */}
                <aside className="w-full lg:w-[30%] flex flex-col bg-white border-r relative z-10 shadow-2xl">
                    <div className="p-6 border-b bg-gray-50/50">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-bold text-gray-900 flex items-center gap-2">
                                <GraduationCap className="text-blue-600 w-5 h-5" /> Universities
                                <span className="text-xs font-normal text-gray-500 ml-2">({universities.length} found)</span>
                            </h2>
                        </div>
                        {!selectedCity && (
                            <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl flex items-start gap-3 animate-pulse">
                                <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-blue-700">Please select a country and city to see available universities.</p>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                        {isLoadingUnis ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
                            ))
                        ) : universities.length === 0 && selectedCity ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400">
                                <Navigation className="w-12 h-12 mb-4 opacity-20" />
                                <p>No universities found in {selectedCity}.</p>
                            </div>
                        ) : (
                            universities.map((uni) => (
                                <Card
                                    key={uni.name}
                                    ref={el => { listRefs.current[uni.name] = el; }}
                                    onMouseEnter={() => setHoveredUni(uni.name)}
                                    onMouseLeave={() => setHoveredUni(null)}
                                    className={`border-none transition-all duration-300 rounded-2xl cursor-pointer ${hoveredUni === uni.name || activeMarker?.name === uni.name
                                        ? "bg-blue-600 text-white shadow-xl shadow-blue-900/20 translate-x-2"
                                        : "bg-white border-gray-100 shadow-sm hover:shadow-md hover:bg-gray-50"
                                        }`}
                                    onClick={() => handleUniClick(uni)}
                                >
                                    <CardContent className="p-4">
                                        <h3 className="font-bold mb-1 leading-tight">{uni.name}</h3>
                                        <p className={`text-xs mb-3 flex items-center gap-1 opacity-80 ${hoveredUni === uni.name || activeMarker?.name === uni.name ? "text-white" : "text-gray-500"
                                            }`}>
                                            <MapPin className="w-3 h-3" /> {uni.city}, {uni.country}
                                        </p>
                                        <div className="flex items-center justify-between gap-2 mt-auto">
                                            <a
                                                href={uni.website_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 hover:underline ${hoveredUni === uni.name || activeMarker?.name === uni.name ? "text-blue-100" : "text-blue-600"
                                                    }`}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                Visit Website <ExternalLink className="w-3 h-3" />
                                            </a>
                                            <Button
                                                size="sm"
                                                className={`h-9 rounded-xl px-4 text-[10px] uppercase font-black tracking-widest transition-all duration-300 shadow-lg ${hoveredUni === uni.name || activeMarker?.name === uni.name
                                                    ? "bg-white text-blue-600 hover:bg-white/90 scale-105"
                                                    : "bg-[#1e3a8a] text-white hover:bg-blue-700 hover:scale-105"
                                                    }`}
                                                onClick={(e: React.MouseEvent) => {
                                                    e.stopPropagation();
                                                    onNavigate('search', {
                                                        activeTab: 'scholarships',
                                                        university_id: uni.id
                                                    });
                                                }}
                                            >
                                                {uni.scholarship_count > 0 ? (
                                                    <span className="flex items-center gap-2">
                                                        <GraduationCap className="w-3 h-3" />
                                                        Explore {uni.scholarship_count} Scholarships
                                                    </span>
                                                ) : (
                                                    "View on Map"
                                                )}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </aside>

                {/* Right Panel: Google Map or University Details (70%) */}
                <main className="flex-1 h-1/2 lg:h-auto relative bg-gray-200">
                    {selectedUniDetails ? (
                        <div className="absolute inset-0 bg-white overflow-y-auto custom-scrollbar animate-in slide-in-from-right duration-500 z-30">
                            <div className="max-w-4xl mx-auto p-8 lg:p-12">
                                <Button
                                    variant="ghost"
                                    className="mb-8 text-blue-600 hover:bg-blue-50"
                                    onClick={() => setSelectedUniDetails(null)}
                                >
                                    <ChevronRight className="w-4 h-4 rotate-180 mr-2" /> Back to Map
                                </Button>

                                <div className="space-y-12">
                                    <header className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <Badge className="bg-blue-600 text-white border-none py-1 px-3">University Profile</Badge>
                                            <Badge variant="outline" className="border-blue-200 text-blue-700">{selectedUniDetails.country}</Badge>
                                        </div>
                                        <h2 className="text-4xl lg:text-5xl font-black text-gray-900 tracking-tight">{selectedUniDetails.name}</h2>
                                        <div className="flex flex-wrap items-center gap-6 text-gray-600">
                                            <span className="flex items-center gap-2"><MapPin className="w-5 h-5 text-blue-500" /> {selectedUniDetails.city}</span>
                                            <a
                                                href={selectedUniDetails.website_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 text-blue-600 hover:underline font-bold"
                                            >
                                                <ExternalLink className="w-5 h-5" /> Visit Official Website
                                            </a>
                                        </div>
                                    </header>

                                    <section className="space-y-6">
                                        <div className="flex items-center gap-2 border-b pb-4">
                                            <Sparkles className="w-6 h-6 text-yellow-500" />
                                            <h3 className="text-2xl font-bold text-gray-900">Available Scholarships</h3>
                                        </div>

                                        {isLoadingDetails ? (
                                            <div className="flex flex-col items-center justify-center py-20">
                                                <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
                                                <p className="text-gray-500 italic">Analyzing funding opportunities...</p>
                                            </div>
                                        ) : selectedUniDetails.scholarships && selectedUniDetails.scholarships.length > 0 ? (
                                            <div className="grid gap-8">
                                                {/* Group by Field */}
                                                {Object.entries(
                                                    selectedUniDetails.scholarships.reduce((acc, s) => {
                                                        const field = s.field_of_study || "General";
                                                        if (!acc[field]) acc[field] = [];
                                                        acc[field].push(s);
                                                        return acc;
                                                    }, {} as Record<string, UniversityScholarship[]>)
                                                ).map(([field, fieldSchols]) => (
                                                    <div key={field} className="space-y-4">
                                                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                                                            {field} Scholarships <div className="h-px flex-1 bg-gray-100" />
                                                        </h4>
                                                        <div className="grid md:grid-cols-1 gap-4">
                                                            {fieldSchols.map((s) => (
                                                                <Card key={s.id} className="border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden group">
                                                                    <CardContent className="p-0 flex flex-col md:flex-row">
                                                                        <div className="p-6 flex-1 space-y-4">
                                                                            <div className="flex items-start justify-between gap-4">
                                                                                <h5 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{s.name}</h5>
                                                                                <Badge className={s.funding_type.includes("Full") ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}>
                                                                                    {s.funding_type}
                                                                                </Badge>
                                                                            </div>
                                                                            <p className="text-sm text-gray-600 line-clamp-3">{s.eligibility}</p>
                                                                            <div className="flex flex-wrap items-center gap-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                                                                                <span className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-lg"><GraduationCap className="w-3.5 h-3.5" /> {s.duration_text}</span>
                                                                                <span className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${(() => {
                                                                                    const d = new Date(s.deadline);
                                                                                    const isSoon = !isNaN(d.getTime()) && d > new Date() && d < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                                                                                    return isSoon ? "bg-red-50 text-red-600 font-bold animate-pulse border border-red-100" : "bg-gray-50";
                                                                                })()}`}>
                                                                                    <Calendar className="w-3.5 h-3.5" />
                                                                                    {(() => {
                                                                                        const d = new Date(s.deadline);
                                                                                        if (isNaN(d.getTime())) return "Deadline: Ongoing";
                                                                                        const isSoon = d > new Date() && d < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                                                                                        return (isSoon ? "Expiring Soon: " : "Deadline: ") + s.deadline;
                                                                                    })()}
                                                                                </span>
                                                                                <span className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-lg"><Banknote className="w-3.5 h-3.5" /> {convertAndFormat(s.funding_amount)}</span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="bg-gray-50 p-6 flex items-center justify-center md:border-l border-gray-100">
                                                                            <Button
                                                                                className="bg-[#1e3a8a] hover:bg-blue-700 text-white rounded-xl shadow-lg hover:shadow-blue-200 px-6"
                                                                                onClick={() => window.open(s.scholarship_url, "_blank")}
                                                                            >
                                                                                Apply Now
                                                                            </Button>
                                                                        </div>
                                                                    </CardContent>
                                                                </Card>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                                                <Info className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                                <p className="text-gray-500">No active scholarships found for this university at the moment.</p>
                                            </div>
                                        )}
                                    </section>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {!isLoaded ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-20">
                            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                            <p className="text-gray-500 font-medium tracking-wide">Loading Intelligent Map...</p>
                        </div>
                    ) : (
                        <GoogleMap
                            mapContainerStyle={mapContainerStyle}
                            center={mapCenter}
                            zoom={mapZoom}
                            onLoad={onMapLoad}
                            options={mapOptions}
                            onClick={() => {
                                setActiveMarker(null);
                                setSelectedUniDetails(null);
                            }}
                        >
                            {universities.filter(u => u.latitude !== null && u.longitude !== null).map((uni) => (
                                <Marker
                                    key={uni.name}
                                    position={{ lat: uni.latitude as number, lng: uni.longitude as number }}
                                    onClick={() => handleMarkerClick(uni)}
                                    onMouseOver={() => setHoveredUni(uni.name)}
                                    onMouseOut={() => setHoveredUni(null)}
                                    icon={{
                                        url: (hoveredUni === uni.name || activeMarker?.name === uni.name)
                                            ? "https://maps.google.com/mapfiles/ms/icons/red-dot.png"
                                            : "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                                    }}
                                />
                            ))}
                        </GoogleMap>
                    )}

                    {/* Floating UI on Map */}
                    {!selectedUniDetails && (
                        <>
                            <div className="absolute top-6 left-6 z-10 pointer-events-none">
                                <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-white/20 pointer-events-auto">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Target className="w-4 h-4 text-blue-600" />
                                        <span className="text-xs font-bold uppercase tracking-widest text-gray-800">Map Intelligence</span>
                                    </div>
                                    <p className="text-[10px] text-gray-500 leading-relaxed">Interactive visualization of academic hubs. Hover to peek, click to navigate.</p>
                                </div>
                            </div>

                            <div className="absolute top-6 right-6 z-10 pointer-events-none">
                                <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-white/20 pointer-events-auto">
                                    <p className="text-[10px] font-bold text-blue-800 flex items-center gap-2">
                                        <Sparkles className="w-3 h-3 text-yellow-500" /> ScholarIQ Virtual Explorer Active
                                    </p>
                                </div>
                            </div>
                        </>
                    )}
                </main>
            </div>

            <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
        </div>
    );
}
