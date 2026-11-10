import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Search, X, Loader2, Navigation } from 'lucide-react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Nominatim requires email or app identification for heavy usage
const NOMINATIM = 'https://nominatim.openstreetmap.org';

async function searchPlaces(query) {
  // Use email param instead of User-Agent (browser forbids setting UA header)
  const url = `${NOMINATIM}/search?format=json&q=${encodeURIComponent(query)}&limit=6&addressdetails=1&email=app@vibrameet.com`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'es' } });
  if (!res.ok) throw new Error('Search failed');
  return res.json();
}

async function reversePlace(lat, lng) {
  const url = `${NOMINATIM}/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&email=app@vibrameet.com`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'es' } });
  if (!res.ok) throw new Error('Reverse failed');
  return res.json();
}

function ClickHandler({ onClick }) {
  useMapEvents({ click(e) { onClick(e.latlng.lat, e.latlng.lng); } });
  return null;
}

function FlyTo({ lat, lng }) {
  const map = useMap();
  const prev = useRef(null);
  useEffect(() => {
    if (lat == null || lng == null) return;
    const key = `${lat},${lng}`;
    if (prev.current === key) return;
    prev.current = key;
    map.flyTo([lat, lng], 16, { duration: 0.8 });
  }, [lat, lng, map]);
  return null;
}

export default function LocationPicker({ location, latitude, longitude, onLocationChange }) {
  const [query, setQuery] = useState(location || '');
  const [results, setResults] = useState(null); // null = no search yet, [] = no results
  const [searching, setSearching] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [pos, setPos] = useState(
    latitude && longitude ? { lat: latitude, lng: longitude } : null
  );
  const timerRef = useRef(null);
  const boxRef = useRef(null);
  const searchIdRef = useRef(0); // prevents stale responses

  const DEFAULT = [4.711, -74.0721];

  // Sync external props
  useEffect(() => {
    if (latitude && longitude) setPos({ lat: latitude, lng: longitude });
  }, [latitude, longitude]);

  useEffect(() => {
    if (location && query === '') setQuery(location);
  }, [location]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setDropdownOpen(false);
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, []);

  async function runSearch(text) {
    if (!text || text.length < 3) {
      setResults(null);
      setDropdownOpen(false);
      return;
    }
    const id = ++searchIdRef.current;
    setSearching(true);
    setDropdownOpen(true);
    try {
      const data = await searchPlaces(text);
      if (searchIdRef.current !== id) return; // stale
      setResults(data);
      setDropdownOpen(true);
    } catch {
      if (searchIdRef.current !== id) return;
      setResults([]);
    } finally {
      if (searchIdRef.current === id) setSearching(false);
    }
  }

  function onType(e) {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(timerRef.current);
    if (val.length >= 3) {
      timerRef.current = setTimeout(() => runSearch(val), 600);
    } else {
      setResults(null);
      setDropdownOpen(false);
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      clearTimeout(timerRef.current);
      runSearch(query);
    }
  }

  function pick(item) {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    setPos({ lat, lng });
    setQuery(item.display_name);
    setResults(null);
    setDropdownOpen(false);
    onLocationChange(item.display_name, lat, lng);
  }

  async function onMapClick(lat, lng) {
    setPos({ lat, lng });
    setDropdownOpen(false);
    try {
      const data = await reversePlace(lat, lng);
      const addr = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setQuery(addr);
      onLocationChange(addr, lat, lng);
    } catch {
      const c = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setQuery(c);
      onLocationChange(c, lat, lng);
    }
  }

  const hasResults = Array.isArray(results) && results.length > 0;
  const noResults = Array.isArray(results) && results.length === 0 && !searching;

  return (
    <div className="space-y-3">
      <div ref={boxRef} className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={onType}
              onKeyDown={onKeyDown}
              onFocus={() => hasResults && setDropdownOpen(true)}
              placeholder="Escribe la direccion o lugar..."
              className="input-modern !pl-10 !pr-8"
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(''); setResults(null); setDropdownOpen(false); onLocationChange('', null, null); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => { clearTimeout(timerRef.current); runSearch(query); }}
            disabled={query.length < 3 || searching}
            className="btn-primary !px-4 !py-2 flex items-center gap-1.5 text-sm whitespace-nowrap disabled:opacity-50"
          >
            {searching ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
            Ubicar
          </button>
        </div>

        {/* Dropdown */}
        {dropdownOpen && (
          <div className="absolute z-[1000] w-full mt-1 bg-white rounded-xl shadow-lg border border-gray-200 max-h-52 overflow-y-auto">
            {searching && (
              <div className="p-4 text-sm text-gray-400 text-center flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" /> Buscando...
              </div>
            )}
            {!searching && hasResults && results.map((r, i) => (
              <button
                key={`${r.place_id || i}`}
                type="button"
                onClick={() => pick(r)}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-primary-50 border-b last:border-0 flex items-start gap-2 transition"
              >
                <MapPin size={14} className="text-primary-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700 line-clamp-2">{r.display_name}</span>
              </button>
            ))}
            {noResults && (
              <div className="p-4 text-sm text-gray-400 text-center">
                Sin resultados. Prueba otra direccion o haz clic en el mapa.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected location badge */}
      {pos && location && (
        <div className="flex items-start gap-2 text-sm text-gray-600 bg-primary-50 rounded-lg px-3 py-2 border border-primary-100">
          <MapPin size={14} className="text-primary-600 mt-0.5 flex-shrink-0" />
          <span className="line-clamp-2">{location}</span>
        </div>
      )}

      {/* Map */}
      <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: 300 }}>
        <MapContainer
          center={pos ? [pos.lat, pos.lng] : DEFAULT}
          zoom={pos ? 16 : 12}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onClick={onMapClick} />
          {pos && (
            <>
              <Marker position={[pos.lat, pos.lng]} />
              <FlyTo lat={pos.lat} lng={pos.lng} />
            </>
          )}
        </MapContainer>
      </div>
      <p className="text-xs text-gray-400">Escribe y presiona Ubicar (o Enter), o haz clic en el mapa</p>
    </div>
  );
}
