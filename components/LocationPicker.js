'use client';
import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';

const DEFAULT = [-0.721, 37.1526]; // Murang'a town

// Click the map (or use GPS) to drop a pin; address is looked up via OpenStreetMap Nominatim.
export default function LocationPicker({ onPick }) {
  const el = useRef(null);
  const state = useRef({});
  const [busy, setBusy] = useState(false);

  const place = async (lat, lng) => {
    const { L, map } = state.current;
    if (state.current.marker) state.current.marker.setLatLng([lat, lng]);
    else state.current.marker = L.circleMarker([lat, lng], { radius: 9, color: '#2f5bea', fillOpacity: 0.7 }).addTo(map);
    map.setView([lat, lng], Math.max(map.getZoom(), 15));
    let address = '';
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      address = (await r.json()).display_name || '';
    } catch { /* address is optional */ }
    onPick({ lat, lng, address });
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelled || !el.current) return;
      const map = L.map(el.current).setView(DEFAULT, 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map);
      map.on('click', (e) => place(e.latlng.lat, e.latlng.lng));
      state.current = { L, map };
    })();
    return () => { cancelled = true; state.current.map?.remove(); state.current = {}; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const gps = () => {
    if (!navigator.geolocation) return;
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (p) => { setBusy(false); place(p.coords.latitude, p.coords.longitude); },
      () => setBusy(false)
    );
  };

  return (
    <div className="picker">
      <div ref={el} className="map" />
      <button type="button" className="btn ghost small" onClick={gps} disabled={busy}>
        {busy ? 'Locating…' : '📍 Use my current location'}
      </button>
      <p className="muted small">Or click the map to drop a pin.</p>
    </div>
  );
}
