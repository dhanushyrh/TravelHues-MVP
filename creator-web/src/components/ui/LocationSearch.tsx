import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface LocationValue {
  address: string;
  latitude: number;
  longitude: number;
  osmId?: string;
  placeType?: string;
}

interface NominatimResult {
  place_id: number;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  type: string;
  class: string;
}

interface LocationSearchProps {
  value?: LocationValue | null;
  onChange: (location: LocationValue | null) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

export function LocationSearch({
  value,
  onChange,
  label = 'Location',
  placeholder = 'Search for a place…',
  required = false,
}: LocationSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const search = (q: string) => {
    if (!q.trim() || q.length < 3) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setIsLoading(true);
    fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=6`,
      { headers: { 'Accept-Language': 'en' }, signal: abortRef.current.signal },
    )
      .then((r) => r.json())
      .then((data: NominatimResult[]) => {
        setResults(data);
        setIsOpen(data.length > 0);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(q), 400);
  };

  const handleSelect = (result: NominatimResult) => {
    onChange({
      address: result.display_name,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      osmId: `${result.osm_type}/${result.osm_id}`,
      placeType: result.type,
    });
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div className="space-y-1.5" ref={containerRef}>
      {label && (
        <Label>
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </Label>
      )}

      {value ? (
        <div className="flex items-start gap-2.5 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-emerald-800 font-medium leading-snug line-clamp-2">
              {value.address}
            </p>
            <p className="text-xs text-emerald-600 mt-0.5 font-mono">
              {value.latitude.toFixed(5)}, {value.longitude.toFixed(5)}
              {value.placeType && <span className="font-sans ml-2 opacity-70">· {value.placeType}</span>}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="flex-shrink-0 p-0.5 text-emerald-500 hover:text-emerald-700 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
            {isLoading
              ? <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
              : <Search className="w-4 h-4 text-gray-400" />}
          </div>
          <Input
            className="pl-9"
            placeholder={placeholder}
            value={query}
            onChange={handleInputChange}
            onFocus={() => results.length > 0 && setIsOpen(true)}
          />
          {isOpen && results.length > 0 && (
            <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
              {results.map((r) => (
                <button
                  key={r.place_id}
                  type="button"
                  onClick={() => handleSelect(r)}
                  className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-gray-50 text-left border-b border-gray-50 last:border-0 transition-colors"
                >
                  <MapPin className="w-4 h-4 text-[#E8342A] flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm text-gray-800 font-medium line-clamp-1">
                      {r.display_name.split(',')[0]}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                      {r.display_name}
                    </p>
                  </div>
                </button>
              ))}
              <p className="text-xs text-gray-400 px-4 py-2 bg-gray-50 border-t border-gray-100">
                © OpenStreetMap contributors
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
