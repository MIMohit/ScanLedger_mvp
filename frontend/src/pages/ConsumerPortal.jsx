import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShieldCheck, ShieldAlert, Smartphone, Navigation, MapPin, Database, ArrowRight } from 'lucide-react';

const ConsumerPortal = () => {
  const [serial, setSerial] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleVerify = (e) => {
    e.preventDefault();
    if (serial) {
      navigate(`/verify/${serial}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in zoom-in duration-500">
      <header className="text-center space-y-4">
        <div className="w-16 h-16 bg-primary/20 rounded-2xl mx-auto flex items-center justify-center text-primary shadow-xl shadow-primary/10">
          <Smartphone className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold text-white">Mobile Scan Simulation</h1>
        <p className="text-gray-400">Step into the consumer's shoes. Enter a Product ID or Serial Number to verify authenticity using the AI behavioral motor.</p>
      </header>

      <div className="glass p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 p-4 opacity-10">
            <Smartphone className="w-24 h-24" />
        </div>

        <form onSubmit={handleVerify} className="space-y-6 relative z-10">
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <Smartphone className="w-3 h-3 text-primary" /> Product Identifier
            </label>
            <div className="flex gap-4">
                <input 
                    required
                    placeholder="Enter Code (e.g. MED-ASP-001)" 
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                    onChange={(e) => setSerial(e.target.value)}
                />
                <button 
                    type="submit" 
                    disabled={loading}
                    className="px-8 bg-primary hover:bg-blue-600 rounded-xl font-black text-xs uppercase tracking-tighter shadow-lg shadow-primary/20 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                    {loading ? 'Entering Lab...' : 'Verify'} <ArrowRight className="w-4 h-4" />
                </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConsumerPortal;
