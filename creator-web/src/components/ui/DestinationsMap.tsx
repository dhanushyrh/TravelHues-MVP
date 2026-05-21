import React, { useEffect, useRef } from 'react';

// Country centroids for plotting creator's focused destinations
const COUNTRY_COORDS: Record<string, [number, number]> = {
  Thailand: [15.87, 100.99],
  Indonesia: [-0.79, 113.92],
  India: [20.59, 78.96],
  Vietnam: [14.06, 108.28],
  Japan: [36.2, 138.25],
  Singapore: [1.35, 103.82],
  Malaysia: [4.21, 101.97],
  Maldives: [3.2, 73.22],
  'Sri Lanka': [7.87, 80.77],
  Nepal: [28.39, 84.12],
  Philippines: [12.88, 121.77],
  France: [46.23, 2.21],
  Italy: [41.87, 12.57],
  Greece: [39.07, 21.82],
  Spain: [40.46, -3.75],
  UAE: [23.42, 53.85],
  Morocco: [31.79, -7.09],
  USA: [37.09, -95.71],
  Mexico: [23.63, -102.55],
  Australia: [-25.27, 133.78],
  // Cities (approximate)
  Bali: [-8.34, 115.09],
  Bangkok: [13.75, 100.52],
  'Kuala Lumpur': [3.14, 101.69],
  Tokyo: [35.68, 139.69],
  Paris: [48.86, 2.35],
  Dubai: [25.2, 55.27],
  'New York City': [40.71, -74.01],
  London: [51.51, -0.13],
};

interface DestinationsMapProps {
  destinations?: string[];
  height?: string;
  className?: string;
}

export function DestinationsMap({ destinations = [], height = '280px', className = '' }: DestinationsMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Lazy-load Leaflet — installed at runtime, not available during type-check
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // @ts-ignore
    import('leaflet').then((L: any) => {
      // Fix default marker icon path for bundlers
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(mapRef.current!, {
        center: [20, 0],
        zoom: 2,
        zoomControl: true,
        scrollWheelZoom: false,
        attributionControl: true,
      });

      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      // Plot destination markers
      const coords = destinations
        .map((name) => ({ name, coord: COUNTRY_COORDS[name] }))
        .filter((d) => d.coord);

      coords.forEach(({ name, coord }) => {
        const marker = L.circleMarker(coord, {
          radius: 8,
          fillColor: '#E8342A',
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.85,
        }).addTo(map);
        marker.bindPopup(`<b>${name}</b>`);
      });

      if (coords.length > 0) {
        const bounds = L.latLngBounds(coords.map((d) => d.coord!));
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 6 });
      }
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers when destinations change
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // @ts-ignore
    import('leaflet').then((L: any) => {
      const map = mapInstanceRef.current;
      // Clear existing circle markers
      map.eachLayer((layer: any) => {
        if (layer instanceof L.CircleMarker) map.removeLayer(layer);
      });

      const coords = destinations
        .map((name) => ({ name, coord: COUNTRY_COORDS[name] }))
        .filter((d) => d.coord);

      coords.forEach(({ name, coord }) => {
        L.circleMarker(coord, {
          radius: 8,
          fillColor: '#E8342A',
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.85,
        })
          .addTo(map)
          .bindPopup(`<b>${name}</b>`);
      });
    });
  }, [destinations]);

  return (
    <div
      ref={mapRef}
      style={{ height }}
      className={`w-full rounded-xl overflow-hidden ${className}`}
    />
  );
}
