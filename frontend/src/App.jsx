import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Database, Map as MapIcon, ShieldCheck, Smartphone, Search } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Registry from './pages/Registry';
import Heatmap from './pages/Heatmap';
import Verify from './pages/Verify';
import PolygonAudit from './pages/PolygonAudit';
import ConsumerPortal from './pages/ConsumerPortal';
import MobileScan from './pages/MobileScan';

const Navbar = () => {
  const location = useLocation();
  const isSelected = (path) => location.pathname === path;

  // Hide Navbar for Mobile Scan view
  if (location.pathname === '/mobile') return null;

  return (
    <nav className="fixed left-0 top-0 h-full w-64 glass border-r border-white/10 p-6 flex flex-col gap-8 z-50">
      <div className="flex items-center gap-3 mb-4">
        <ShieldCheck className="w-8 h-8 text-primary shadow-lg shadow-primary/20" />
        <span className="text-xl font-bold tracking-tight text-white italic">Double-Scan</span>
      </div>
      
      <div className="flex flex-col gap-2">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 px-4 italic">Manufacturer</p>
        <Link to="/" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isSelected('/') ? 'bg-primary/20 text-primary border border-primary/30' : 'hover:bg-white/5 text-gray-400'}`}>
          <LayoutDashboard className="w-5 h-5" />
          <span className="font-medium">Dashboard</span>
        </Link>
        <Link to="/registry" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isSelected('/registry') ? 'bg-primary/20 text-primary border border-primary/30' : 'hover:bg-white/5 text-gray-400'}`}>
          <Database className="w-5 h-5" />
          <span className="font-medium">Registry</span>
        </Link>
        <Link to="/heatmap" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isSelected('/heatmap') ? 'bg-primary/20 text-primary border border-primary/30' : 'hover:bg-white/5 text-gray-400'}`}>
          <MapIcon className="w-5 h-5" />
          <span className="font-medium">Scan Map</span>
        </Link>
        <Link to="/audit" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isSelected('/audit') ? 'bg-primary/20 text-primary border border-primary/30' : 'hover:bg-white/5 text-gray-400'}`}>
          <Search className="w-5 h-5" />
          <span className="font-medium">Polygon Audit</span>
        </Link>

        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-6 mb-2 px-4 italic">Consumer</p>
        <Link to="/consumer" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isSelected('/consumer') ? 'bg-primary/20 text-primary border border-primary/30' : 'hover:bg-white/5 text-gray-400'}`}>
          <Smartphone className="w-5 h-5" />
          <span className="font-medium">Mobile Portal</span>
        </Link>
        <Link to="/mobile" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isSelected('/mobile') ? 'bg-primary/20 text-primary border border-primary/30' : 'hover:bg-white/5 text-gray-400'}`}>
          <Smartphone className="w-5 h-5" />
          <span className="font-medium italic">Direct Scanner</span>
        </Link>
      </div>

      <div className="mt-auto pt-6 border-t border-white/5">
        <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 shadow-lg">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2 font-black italic">Network Status</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-sm font-medium text-white tracking-widest italic">Polygon L3</span>
          </div>
        </div>
      </div>
    </nav>
  );
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background text-white flex">
        <Navbar />
        <Routes>
          <Route path="/mobile" element={<MobileScan />} />
          <Route path="*" element={
            <main className="ml-64 flex-1 p-8 overflow-auto">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/registry" element={<Registry />} />
                <Route path="/heatmap" element={<Heatmap />} />
                <Route path="/audit" element={<PolygonAudit />} />
                <Route path="/consumer" element={<ConsumerPortal />} />
                <Route path="/verify/:productId" element={<Verify />} />
              </Routes>
            </main>
          } />
        </Routes>
      </div>
    </Router>
  );
}


export default App;
