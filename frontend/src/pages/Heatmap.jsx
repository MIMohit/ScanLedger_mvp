import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { ShieldAlert, MapPin, Zap } from 'lucide-react';

// Fix for default Leaflet icons in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const Heatmap = () => {
  const [scans, setScans] = useState([
    { id: 1, lat: -33.8688, lng: 151.2093, product: 'LW-0099', verdict: 'TRUSTED', time: '10m ago' },
    { id: 2, lat: 23.8103, lng: 90.4125, product: 'LW-0099', verdict: 'COUNTERFEIT', time: '2m ago' },
    { id: 3, lat: 40.7128, lng: -74.0060, product: 'PH-2024-X4', verdict: 'SUSPICIOUS', time: '1h ago' },
    { id: 4, lat: 51.5074, lng: -0.1278, product: 'PH-2024-X4', verdict: 'TRUSTED', time: '3h ago' },
  ]);

  const getColor = (verdict) => {
    switch(verdict) {
      case 'TRUSTED': return '#22c55e';
      case 'COUNTERFEIT': return '#ef4444';
      default: return '#f59e0b';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Global Scan Map</h1>
          <p className="text-gray-400">Visualizing authentication events and geographical anomalies.</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-success">
            <div className="w-2 h-2 rounded-full bg-success" /> Trusted
          </div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-warning">
            <div className="w-2 h-2 rounded-full bg-warning" /> Suspicious
          </div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-danger">
            <div className="w-2 h-2 rounded-full bg-danger" /> Counterfeit
          </div>
        </div>
      </header>

      <div className="glass p-2 rounded-3xl border border-white/10 overflow-hidden relative">
        <MapContainer center={[20, 0]} zoom={2} scrollWheelZoom={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {scans.map(scan => (
            <React.Fragment key={scan.id}>
              <Circle 
                center={[scan.lat, scan.lng]} 
                radius={200000} 
                pathOptions={{ color: getColor(scan.verdict), fillColor: getColor(scan.verdict), fillOpacity: 0.2, weight: 1 }} 
              />
              <Marker position={[scan.lat, scan.lng]}>
                <Popup className="custom-popup">
                  <div className="p-1 space-y-2">
                    <div className="font-bold text-gray-900">{scan.product}</div>
                    <div className={`text-[10px] font-black uppercase px-1 py-0.5 rounded ${scan.verdict === 'TRUSTED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {scan.verdict}
                    </div>
                    <div className="text-[10px] text-gray-500">{scan.time}</div>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          ))}
        </MapContainer>
        
        {/* Map Overlay Stats */}
        <div className="absolute bottom-8 right-8 z-10 glass p-6 rounded-2xl border border-white/20 max-w-xs space-y-4 shadow-2xl">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-warning" />
            <span className="text-sm font-bold text-white">Live Anomalies</span>
          </div>
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-danger/10 border border-danger/20">
              <p className="text-xs font-bold text-danger mb-1 uppercase tracking-tighter">Impossible Travel</p>
              <p className="text-[10px] text-gray-400">Sydney → Dhaka (9,000km) in 2.1h</p>
            </div>
            <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
              <p className="text-xs font-bold text-warning mb-1 uppercase tracking-tighter">Device Conflict</p>
              <p className="text-[10px] text-gray-400">3 unique IDs for LW-0099 in NYC</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Heatmap;
