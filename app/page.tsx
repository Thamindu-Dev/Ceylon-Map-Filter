'use client';

import React, { useState, useMemo } from 'react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { ResultsTable } from '../components/ResultsTable';
import { PlaceResult } from '../types';
import { p } from 'sl-address';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { MapCircle } from '../components/MapCircle';

const CATEGORIES = [
  'Hospital',
  'Restaurant',
  'Hotel',
  'Bank',
  'Supermarket',
  'School',
  'Cafe',
  'Pharmacy'
];

export default function SearchPage() {
  const [category, setCategory] = useState('');
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [keyword, setKeyword] = useState('');
  
  const [activeTab, setActiveTab] = useState<'dropdown' | 'map'>('dropdown');
  const [mapCenter] = useState({ lat: 7.8731, lng: 80.7718 });
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState<number>(1000);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [places, setPlaces] = useState<PlaceResult[]>([]);
  const [searchMetadata, setSearchMetadata] = useState<{
    category: string;
    keyword: string;
    city: string;
    radius: number;
    mode: 'dropdown' | 'map';
  } | null>(null);

  // Derived options based on current selection
  const provinces = useMemo(() => p.getProvinces().map(pr => ({ value: pr, label: pr })), []);
  
  const districts = useMemo(() => {
    if (province) return p.getDistrictsByProvince(province).map(d => ({ value: d, label: d }));
    return p.getDistricts().map(d => ({ value: d, label: d }));
  }, [province]);

  const cities = useMemo(() => {
    if (district) return p.getCitiesByDistrict(district).map(c => ({ value: c, label: c }));
    if (province) return p.getCitiesByProvince(province).map(c => ({ value: c, label: c }));
    return p.getCities().map(c => ({ value: c, label: c }));
  }, [district, province]);

  // Handlers for selection
  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setProvince(val);
    setDistrict('');
    setCity('');
    setPostalCode('');
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setDistrict(val);
    setCity('');
    setPostalCode('');
    if (val && !province) {
      // Auto-fill province from district (pick first match if any)
      const citiesInDist = p.getCitiesByDistrict(val);
      if (citiesInDist.length > 0) {
        const info = p.getInfoByCity(citiesInDist[0]);
        if (info && info.length > 0) {
          setProvince(info[0].province);
        }
      }
    }
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setCity(val);
    setPostalCode('');
    if (val) {
      const info = p.getInfoByCity(val);
      if (info && info.length > 0) {
        setDistrict(info[0].district);
        setProvince(info[0].province);
      }
    }
  };

  const handlePostalCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPostalCode(val);
    if (p.isValidPostal(val)) {
      const info = p.getInfoByPostal(val);
      if (info) {
        setCity(info.city);
        setDistrict(info.district);
        setProvince(info.province);
      }
    }
  };

  const handleReset = () => {
    setCategory('');
    setProvince('');
    setDistrict('');
    setCity('');
    setPostalCode('');
    setKeyword('');
    setPlaces([]);
    setSearchMetadata(null);
    setError(null);
  };

  // Validation
  const isLocationValid = Boolean(province && district && city);
  const hasSearchTerm = Boolean(category || keyword);
  const isValid = activeTab === 'dropdown' 
    ? isLocationValid && hasSearchTerm
    : Boolean(markerPosition && hasSearchTerm && radius > 0);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setIsLoading(true);
    setError(null);
    setPlaces([]);
    setSearchMetadata(null);

    const searchKeyword = keyword || category;

    const payload =
      activeTab === 'dropdown'
        ? {
            keyword: searchKeyword,
            mode: activeTab,
            location: `${city}, ${district}, ${province}, Sri Lanka`,
            radius: 5000,
          }
        : {
            keyword: searchKeyword,
            mode: activeTab,
            latitude: markerPosition?.lat,
            longitude: markerPosition?.lng,
            radius,
          };

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch results');
      }

      setPlaces(data.data.places);
      
      const resolvedCity = data.data.centerCoordinates?.city || (activeTab === 'dropdown' ? city : '');
      setSearchMetadata({
        category,
        keyword,
        city: resolvedCity,
        radius,
        mode: activeTab
      });
      
      if (data.data.places.length === 0) {
        setError('No places found for this search criteria.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 selection:bg-blue-500/30">
      {/* Dynamic Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px]" />
      </div>

      <main className="relative z-10 container mx-auto px-4 py-12 flex flex-col items-center min-h-screen">
        
        {/* Header Section */}
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-4">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Google Maps Extractor
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400">
            Discover <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Places</span> Faster
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Search for businesses and extract their details instantly.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 bg-gray-900/50 p-1 rounded-full border border-gray-800">
          <button
            onClick={() => setActiveTab('dropdown')}
            className={`px-6 py-2 rounded-full font-medium transition-all ${
              activeTab === 'dropdown'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Dropdown Search
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`px-6 py-2 rounded-full font-medium transition-all ${
              activeTab === 'map'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Map Search
          </button>
        </div>

        {/* Search Form Card */}
        <div className="w-full max-w-5xl bg-gray-900/40 backdrop-blur-xl border border-gray-800 rounded-3xl p-6 md:p-8 shadow-2xl mb-12 transition-all">
          <form onSubmit={handleSearch} className="flex flex-col gap-6">
            
            {activeTab === 'dropdown' && (
              <>
                {/* Row 1: Location Filters */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                  <Select
                    label="Category"
                    placeholder="Select Category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    options={CATEGORIES.map(c => ({ value: c, label: c }))}
                  />
                  <Select
                    label="Province"
                    placeholder="Select Province"
                    value={province}
                    onChange={handleProvinceChange}
                    options={provinces}
                    required
                  />
                  <Select
                    label="District"
                    placeholder="Select District"
                    value={district}
                    onChange={handleDistrictChange}
                    options={districts}
                    required
                  />
                  <Select
                    label="City"
                    placeholder="Select City"
                    value={city}
                    onChange={handleCityChange}
                    options={cities}
                    required
                  />
                  <Input
                    label="Postal Code"
                    placeholder="e.g., 10280"
                    value={postalCode}
                    onChange={handlePostalCodeChange}
                  />
                </div>

                {/* Row 2: Keyword & Actions */}
                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1 w-full">
                    <Input
                      label="Search Keyword"
                      placeholder="Or enter custom keyword..."
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                    />
                  </div>
                  <div className="w-full md:w-auto flex gap-3">
                    <Button type="button" onClick={handleReset} className="h-[50px] px-6 bg-gray-700 hover:bg-gray-600 border-none">
                      Reset
                    </Button>
                    <Button type="submit" disabled={!isValid} isLoading={isLoading} className="h-[50px] px-8 disabled:opacity-50 disabled:cursor-not-allowed">
                      Search
                    </Button>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'map' && (
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                  <Select
                    label="Category"
                    placeholder="Select Category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    options={CATEGORIES.map(c => ({ value: c, label: c }))}
                  />
                  <Input
                    label="Search Keyword"
                    placeholder="Or enter custom keyword..."
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                  />
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Search Radius: {radius}m
                    </label>
                    <input
                      type="range"
                      min="100"
                      max="5000"
                      step="100"
                      value={radius}
                      onChange={(e) => setRadius(Number(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>
                </div>

                <div className="w-full h-[400px] rounded-2xl overflow-hidden border border-gray-700 relative">
                  {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
                      <p className="text-red-400">Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env</p>
                    </div>
                  )}
                  <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
                    <Map
                      defaultZoom={7}
                      defaultCenter={mapCenter}
                      mapId="dark_map"
                      onClick={(e) => {
                        if (e.detail.latLng) {
                          setMarkerPosition(e.detail.latLng);
                        }
                      }}
                      // @ts-expect-error — options prop not typed in @vis.gl/react-google-maps
                      options={{
                        styles: [
                          { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                          { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
                          { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
                          { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
                          { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
                          { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
                          { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
                          { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
                          { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
                          { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
                          { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
                          { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
                          { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
                          { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
                          { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
                          { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] }
                        ]
                      }}
                    >
                      {markerPosition && (
                        <>
                          <AdvancedMarker position={markerPosition} />
                          <MapCircle
                            center={markerPosition}
                            radius={radius}
                            // @ts-expect-error — options prop not typed in @vis.gl/react-google-maps
                            options={{
                              fillColor: '#3b82f6',
                              fillOpacity: 0.2,
                              strokeColor: '#3b82f6',
                              strokeOpacity: 0.8,
                              strokeWeight: 2,
                            }}
                          />
                        </>
                      )}
                    </Map>
                  </APIProvider>
                </div>
                
                <div className="flex justify-end gap-3">
                  <Button type="button" onClick={handleReset} className="h-[50px] px-6 bg-gray-700 hover:bg-gray-600 border-none">
                    Reset
                  </Button>
                  <Button type="submit" disabled={!isValid} isLoading={isLoading} className="h-[50px] px-8 disabled:opacity-50 disabled:cursor-not-allowed">
                    Search Map Area
                  </Button>
                </div>
              </div>
            )}
          </form>

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3 transition-all">
              <span className="text-xl">⚠️</span>
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}
        </div>

        {/* Results Section */}
        <div className="w-full max-w-6xl transition-all">
          <ResultsTable places={places} searchMetadata={searchMetadata} />
        </div>

      </main>
    </div>
  );
}
