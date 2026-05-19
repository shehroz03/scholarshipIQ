import { useState, useEffect, useCallback, useRef } from "react";
import { 
  MapPin, 
  Search, 
  Globe, 
  Navigation, 
  Zap, 
  Building2, 
  ExternalLink, 
  Trophy,
  Filter,
  ArrowLeft
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { api } from "../api";
import { useTheme } from "../context/ThemeContext";

interface University {
  id: number;
  name: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  website_url?: string;
  qs_ranking?: number;
  logo_url?: string;
}

// Map Controller to handle flying to locations
function MapController({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true, duration: 1.5 });
  }, [center, zoom, map]);
  return null;
}

// Custom Marker Creator (Enhanced for visibility with inline styles)
const createMarkerIcon = (isSelected: boolean) => {
  const color = isSelected ? '#f59e0b' : '#6366f1';
  const size = isSelected ? 18 : 14;
  const pulseColor = isSelected ? 'rgba(245, 158, 11, 0.4)' : 'rgba(99, 102, 241, 0.4)';
  
  return L.divIcon({
    html: `
      <div style="
        position: relative;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          position: absolute;
          width: 100%;
          height: 100%;
          background: ${pulseColor};
          border-radius: 50%;
          animation: marker-pulse-animation 2s infinite;
          z-index: 1;
        "></div>
        <div style="
          width: ${size}px;
          height: ${size}px;
          background: ${color};
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 0 10px ${color}80;
          z-index: 2;
          transition: all 0.3s ease;
          transform: ${isSelected ? 'scale(1.2)' : 'scale(1)'};
        "></div>
        <style>
          @keyframes marker-pulse-animation {
            0% { transform: scale(0.5); opacity: 0.8; }
            100% { transform: scale(1.5); opacity: 0; }
          }
        </style>
      </div>`,
    className: 'custom-university-marker',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });
};

function UniversityMarker({ uni, isSelected, onSelect, onNavigate }: { 
  uni: University, 
  isSelected: boolean, 
  onSelect: () => void,
  onNavigate: (page: string) => void
}) {
  const markerRef = useRef<L.Marker>(null);
  
  useEffect(() => {
    if (isSelected && markerRef.current) {
      markerRef.current.openPopup();
    }
  }, [isSelected]);

  return (
    <Marker 
      ref={markerRef}
      position={[Number(uni.latitude), Number(uni.longitude)]}
      icon={createMarkerIcon(isSelected)}
      eventHandlers={{
        click: onSelect
      }}
    >
      <Popup position={[uni.latitude, uni.longitude]} autoPan={false}>
        <div style={{
          minWidth: '220px',
          fontFamily: "'Inter', sans-serif",
          padding: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            {uni.logo_url ? (
              <img src={uni.logo_url} alt={uni.name} style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '8px' }} />
            ) : (
              <div style={{ width: '40px', height: '40px', background: '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={20} color="#64748b" />
              </div>
            )}
            <div>
              <p style={{fontWeight:'800',fontSize:'15px', color: '#0f172a', lineHeight: 1.2, margin: 0}}>
                {uni.name}
              </p>
              <p style={{color:'#64748b',fontSize:'11px', fontWeight: 600, margin: 0}}>
                {uni.city}, {uni.country}
              </p>
            </div>
          </div>
          
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
            {uni.qs_ranking && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Trophy size={14} className="text-amber-500" />
                <span style={{ color: '#0f172a', fontSize: '12px', fontWeight: 700 }}>QS Rank #{uni.qs_ranking}</span>
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button 
                onClick={() => onNavigate(`search?university_id=${uni.id}`)}
                style={{
                  flex: 1,
                  background: '#6366f1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Scholarships
              </button>
              <a 
                href={uni.website_url} 
                target="_blank" 
                rel="noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  color: '#64748b'
                }}
              >
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

export function UniversityMatcher({ onNavigate = () => {} }: { onNavigate?: (page: string) => void }) {
  const { isDark } = useTheme();
  
  // State
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [countries, setCountries] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedUniId, setSelectedUniId] = useState<number | null>(null);
  
  // Map View State
  const [mapCenter, setMapCenter] = useState<[number, number]>([30.3753, 69.3451]); // Initial regional focus
  const [mapZoom, setMapZoom] = useState(3);

  // 1. Initial Load: Fetch All Universities & Countries
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      // Get countries first for the filter
      const countryData = await api.scholarships.getCountries();
      setCountries(countryData);

      // Get all universities (limit 100)
      const uniData = await api.scholarships.getUniversities({ limit: 100 });
      setUniversities(uniData);
      
      // If we have data, focus map on a reasonable cluster
      if (uniData.length > 0) {
        // Try to find a Pakistani university or just first in list
        const focus = uniData.find((u: University) => u.country === "Pakistan") || uniData[0];
        setMapCenter([focus.latitude, focus.longitude]);
      }
    } catch (err) {
      console.error("Initial load failed", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // 2. Fetch Cities when Country changes
  useEffect(() => {
    if (selectedCountry !== "all") {
      api.scholarships.getCities(selectedCountry).then(setCities);
    } else {
      setCities([]);
    }
    setSelectedCity("all");
  }, [selectedCountry]);

  // 3. Handle Filtering Logic
  const handleFilter = async () => {
    setLoading(true);
    try {
      const params: any = { limit: 100 };
      if (selectedCountry !== "all") params.country = selectedCountry;
      if (selectedCity !== "all") params.city = selectedCity;
      
      const data = await api.scholarships.getUniversities(params);
      setUniversities(data);

      if (data.length > 0) {
        setMapCenter([data[0].latitude, data[0].longitude]);
        setMapZoom(selectedCity !== "all" ? 12 : 5);
      }
    } catch (err) {
      console.error("Filter failed", err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger filter when selections change
  useEffect(() => {
    if (selectedCountry !== "all") {
      handleFilter();
    } else if (selectedCountry === "all") {
       // Reset to all if global selected
       api.scholarships.getUniversities({ limit: 100 }).then(setUniversities);
    }
  }, [selectedCountry, selectedCity]);


  const handleUniClick = (uni: University) => {
    setSelectedUniId(uni.id);
    setMapCenter([Number(uni.latitude), Number(uni.longitude)]);
    setMapZoom(16); // Close in zoom for selected uni
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f172a',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Navbar Section */}
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 24px',
        background: 'rgba(255,255,255,0.03)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        zIndex: 1000
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button 
            onClick={() => onNavigate('dashboard')}
            style={{ 
              background: 'rgba(255,255,255,0.05)', 
              border: '1px solid rgba(255,255,255,0.1)',
              padding: '10px',
              borderRadius: '12px',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <p style={{
              color: '#6366f1', fontSize: '11px',
              fontWeight: '600', letterSpacing: '2px',
              textTransform: 'uppercase'
            }}>
              INSTITUTION RADAR
            </p>
            <p style={{ color: 'white', fontWeight: '700', fontSize: '18px' }}>
              University Matcher
            </p>
          </div>
        </div>

        {/* Filters Panel */}
        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center'
        }}>
          <select 
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '10px',
              padding: '8px 16px',
              color: 'white',
              fontSize: '13px',
              cursor: 'pointer',
              minWidth: '150px',
              outline: 'none'
            }}
          >
            <option value="all" style={{ background: '#0f172a' }}>All Countries</option>
            {countries.map(c => <option key={c} value={c} style={{ background: '#0f172a' }}>{c}</option>)}
          </select>

          <select 
            value={selectedCity}
            disabled={selectedCountry === "all"}
            onChange={(e) => setSelectedCity(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '10px',
              padding: '8px 16px',
              color: 'white',
              fontSize: '13px',
              cursor: 'pointer',
              minWidth: '150px',
              outline: 'none',
              opacity: selectedCountry === "all" ? 0.5 : 1
            }}
          >
            <option value="all" style={{ background: '#0f172a' }}>All Cities</option>
            {cities.map(c => <option key={c} value={c} style={{ background: '#0f172a' }}>{c}</option>)}
          </select>
        </div>
      </nav>

      {/* Main Content Area */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '380px 1fr',
        flex: 1,
        overflow: 'hidden'
      }}>
        {/* Left Panel: University List */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          borderRight: '1px solid rgba(255,255,255,0.08)',
          overflowY: 'auto',
          padding: '16px'
        }} className="custom-scrollbar">
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <h3 style={{ color: 'white', fontWeight: '700', fontSize: '15px' }}>
              Universities
            </h3>
            <span style={{
              background: 'rgba(99,102,241,0.2)',
              color: '#a5b4fc',
              border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: '999px',
              padding: '2px 10px',
              fontSize: '12px'
            }}>
              {universities.length} found
            </span>
          </div>

          <div style={{ marginTop: '20px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>
                <Zap className="animate-spin mx-auto mb-2" size={24} />
                <p style={{ fontSize: '12px' }}>Updating Radar...</p>
              </div>
            ) : universities.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: '#64748b'
              }}>
                <div style={{fontSize:'40px',marginBottom:'12px'}}>🗺️</div>
                <p style={{color:'white',fontWeight:'600', fontSize:'14px'}}>
                  No universities found
                </p>
                <p style={{fontSize:'12px',marginTop:'4px'}}>
                  Try selecting a different country or city
                </p>
              </div>
            ) : (
              universities.map(uni => (
                <div 
                  key={uni.id}
                  onClick={() => handleUniClick(uni)}
                  style={{
                    background: selectedUniId === uni.id ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                    border: selectedUniId === uni.id ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    padding: '12px',
                    marginBottom: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  <p style={{
                    color: 'white',
                    fontWeight: '600',
                    fontSize: '13px',
                    marginBottom: '4px'
                  }}>
                    {uni.name}
                  </p>
                  <div style={{
                    color: '#94a3b8',
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <MapPin size={10} />
                    <span>{uni.city}, {uni.country}</span>
                  </div>
                  
                  {uni.qs_ranking && (
                    <div style={{
                      display: 'inline-flex',
                      background: 'rgba(251,191,36,0.15)',
                      color: '#fbbf24',
                      border: '1px solid rgba(251,191,36,0.3)',
                      borderRadius: '6px',
                      padding: '2px 8px',
                      fontSize: '11px',
                      marginTop: '6px'
                    }}>
                      # {uni.qs_ranking} Global
                    </div>
                  )}

                  <a 
                    href={uni.website_url} 
                    target="_blank" 
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      color: '#6366f1',
                      fontSize: '11px',
                      marginTop: '8px',
                      display: 'block',
                      textDecoration: 'none',
                      fontWeight: '600'
                    }}
                  >
                    Visit Website →
                  </a>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Panel: Map Section */}
        <div style={{
          position: 'relative',
          flex: 1
        }}>
          <div style={{ height: '100%', width: '100%', minHeight: '600px' }}>
            <MapContainer 
              center={mapCenter} 
              zoom={mapZoom} 
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
            >
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url={isDark 
                  ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                }
              />
              
              <MapController center={mapCenter} zoom={mapZoom} />

              {universities.filter(u => u.latitude && u.longitude).map(uni => (
                <UniversityMarker 
                  key={uni.id}
                  uni={uni}
                  isSelected={selectedUniId === uni.id}
                  onSelect={() => {
                    setSelectedUniId(uni.id);
                    setMapCenter([uni.latitude, uni.longitude]);
                    setMapZoom(14);
                  }}
                  onNavigate={onNavigate}
                />
              ))}
            </MapContainer>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.1);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.1);
        }
        
        .leaflet-container {
          background: #0f172a !important;
        }

        .leaflet-popup-content-wrapper {
          border-radius: 12px !important;
          padding: 8px !important;
        }
        
        .leaflet-div-icon {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
    </div>
  );
}
