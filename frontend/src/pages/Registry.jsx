import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Archive, ExternalLink, ShieldCheck, AlertTriangle, QrCode, Calendar, MapPin, Hash, Clock, Smartphone, X } from 'lucide-react';

import { QRCodeSVG } from 'qrcode.react';

const Registry = () => {
  const [products, setProducts] = useState([]);
  const [enterprises, setEnterprises] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [zoomProduct, setZoomProduct] = useState(null);
  const [showSync, setShowSync] = useState(false);
  const [networkIp, setNetworkIp] = useState(() => localStorage.getItem('veri_real_network_ip') || 'localhost');
  const [isEditingIp, setIsEditingIp] = useState(false);
  const [tempIp, setTempIp] = useState(() => localStorage.getItem('veri_real_network_ip') || '');

  useEffect(() => {
    fetchProducts();
    fetchEnterprises();
    
    // Recovery: Check if we have a sticky IP from a previous manual correction
    const stickyIp = localStorage.getItem('veri_real_network_ip');
    if (stickyIp) {
        setNetworkIp(stickyIp);
        setTempIp(stickyIp);
    } else {
        fetchNetworkIp();
    }
  }, []);

  const fetchNetworkIp = async () => {
    try {
        const res = await axios.get('/api/network-ip');
        // Only auto-update if we don't have a sticky override
        if (!localStorage.getItem('veri_real_network_ip')) {
            setNetworkIp(res.data.ip);
            setTempIp(res.data.ip);
        }
    } catch (err) {
        console.error("Network discovery failed:", err);
    }
  };

  const currentHost = window.location.hostname;
  const isNetlify = currentHost.includes('netlify.app');
  const localIp = (currentHost === 'localhost' || currentHost === '127.0.0.1') ? networkIp : currentHost; 
  
  // On Netlify, we don't use port 5173 for the frontend URL
  const displayHost = isNetlify ? currentHost : `${localIp}:5173`;
  const protocol = window.location.protocol; 
  
  // Construct the API URL for the mobile device to talk to
  const backendApiUrl = `http://${networkIp}:5000`;
  const mobileUrl = `${protocol}//${displayHost}/mobile?api=${encodeURIComponent(backendApiUrl)}`;

  const [newProduct, setNewProduct] = useState({ 
    productId: '', 
    name: '', 
    manufacturer: '', 
    serialNumber: '',
    manufactureDate: new Date().toISOString().split('T')[0],
    timeToHub: '24',
    destination: '',
    metadataHash: 'QmDefault' 
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/products');
      setProducts(res.data);
    } catch (err) {
      console.error('Failed to fetch batches:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEnterprises = async () => {
    try {
      const res = await axios.get('/api/enterprises');
      setEnterprises(res.data);
    } catch (err) {
      console.error('Failed to fetch locations:', err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchEnterprises();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('/api/product/register', newProduct);
      if (res.data.success) {
        await fetchProducts();
        setShowModal(false);
      }
    } catch (err) {
      alert('Registration failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (state) => {
    switch(state) {
      case 1: return <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded uppercase border border-primary/20 flex items-center gap-1"><Archive className="w-3 h-3"/> In Hub</span>;
      case 2: return <span className="px-2 py-1 bg-success/10 text-success text-[10px] font-bold rounded uppercase border border-success/20 flex items-center gap-1"><ShieldCheck className="w-3 h-3"/> Verified</span>;
      case 3: return <span className="px-2 py-1 bg-danger/10 text-danger text-[10px] font-bold rounded uppercase border border-danger/20 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Flagged</span>;
      default: return <span className="px-2 py-1 bg-gray-500/10 text-gray-500 text-[10px] font-bold rounded uppercase border border-gray-500/20">Minted</span>;
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom duration-700">
      <div className="flex items-center justify-between gap-8 mb-12">
        <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-primary/20 rounded-[30px] flex items-center justify-center border border-primary/20">
                <Archive className="w-8 h-8 text-primary shadow-2xl" />
            </div>
            <div>
                <h1 className="text-5xl font-black text-white uppercase tracking-tighter italic">Batch Registry</h1>
                <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest mt-1 italic">Veri-Real L3 Ledger Operations</p>
            </div>
        </div>
        
        <div className="flex items-center gap-4">
            <div className="hidden lg:flex flex-col items-end px-6 py-3 rounded-2xl bg-white/5 border border-white/10 group cursor-pointer hover:bg-white/10 transition-all"
                 onClick={() => { setIsEditingIp(true); setTempIp(networkIp); }}>
                <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${networkIp.startsWith('192.168.56') ? 'bg-orange-500 animate-pulse' : 'bg-success'}`}></div>
                    <p className="text-[8px] font-black text-primary uppercase tracking-[0.2em]">{networkIp.startsWith('192.168.56') ? 'Ghost IP Detected' : 'Network Active'}</p>
                </div>
                {isEditingIp ? (
                    <input 
                        className="bg-transparent text-white font-black italic text-[10px] text-right border-none outline-none focus:ring-0 w-32"
                        value={tempIp}
                        autoFocus
                        onChange={(e) => setTempIp(e.target.value)}
                        onKeyDown={(e) => {
                                if (tempIp.trim()) {
                                    setNetworkIp(tempIp.trim());
                                    localStorage.setItem('veri_real_network_ip', tempIp.trim());
                                    setIsEditingIp(false);
                                }
                        }}
                        onBlur={() => setIsEditingIp(false)}
                    />
                ) : (
                    <div className="flex items-center gap-2">
                        <p className="text-[10px] text-white font-black italic">{protocol}//{localIp}:5173</p>
                        <Search className="w-2 h-2 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                )}
            </div>
            <button 
                onClick={() => setShowSync(true)}
                className="flex items-center gap-3 px-8 py-4 rounded-3xl bg-white text-background font-black uppercase text-xs hover:bg-primary hover:text-white transition-all shadow-xl shadow-primary/20"
            >
                <Smartphone className="w-4 h-4" />
                Connect Device
            </button>
            <button 
                onClick={() => setShowModal(true)}
                className="flex items-center gap-3 px-8 py-4 rounded-3xl bg-primary text-white font-black uppercase text-xs hover:bg-primary/80 transition-all shadow-xl shadow-primary/40"
            >
                <Plus className="w-4 h-4" />
                Mint Batch
            </button>
        </div>
      </div>

      {/* Grid of Products */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {products.map((p, i) => (
          <div key={i} className="glass rounded-[40px] border border-white/10 overflow-hidden text-white flex flex-col group hover:border-primary/30 transition-all duration-500">
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-black text-white leading-tight tracking-tight">{p.name}</h3>
                  <p className="text-[10px] text-gray-500 font-black uppercase mt-1 tracking-widest">{p.productId}</p>
                </div>
                {getStatusBadge(p.chainData?.state || 0)}
              </div>
              
              <div className="space-y-3 text-sm text-gray-400 font-medium">
                <div className="flex items-center gap-3">
                  <Hash className="w-4 h-4 text-primary" />
                  <span>S/N: <strong className="text-white">{p.serialNumber}</strong></span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>Dest: <strong className="text-white line-clamp-1">{p.destination}</strong></span>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5">
                <div 
                    onClick={() => setZoomProduct(p)}
                    className="p-6 rounded-3xl bg-white/5 border border-white/10 flex flex-col items-center gap-4 cursor-zoom-in hover:bg-white/10 transition-all group/barcode"
                >
                  <img 
                    src={`/public/barcodes/${p.productId}.png`} 
                    alt="Barcode" 
                    className="w-full max-w-[180px] h-auto rounded-xl" 
                  />
                  <div className="flex items-center gap-2 opacity-30 group-hover/barcode:opacity-100 transition-all">
                    <Search className="w-3 h-3 text-primary" />
                    <span className="text-[8px] text-gray-400 uppercase font-black tracking-widest">Click to Zoom for Mobile Scan</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-auto px-8 py-5 bg-white/5 flex gap-3">
                <a href={`/verify/${p.productId}`} className="flex-1 px-4 py-3 rounded-2xl bg-primary/20 text-primary text-[10px] font-black uppercase text-center hover:bg-primary transition-all hover:text-white tracking-widest">Details View</a>
                <button className="px-4 py-3 rounded-2xl bg-white/5 text-gray-500 text-xs font-bold uppercase hover:bg-white/10 transition-all"><ExternalLink className="w-4 h-4"/></button>
            </div>
          </div>
        ))}
        {loading && <div className="p-12 text-center text-gray-500 italic font-black uppercase tracking-widest animate-pulse">Synchronizing with L3 Node...</div>}
      </div>

      {/* Sync Phone Modal */}
      {showSync && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-background/90 backdrop-blur-xl" onClick={() => setShowSync(false)}>
             <div className="glass w-full max-w-4xl rounded-[60px] border border-white/20 p-12 text-center space-y-10 animate-in zoom-in duration-300 relative" onClick={e => e.stopPropagation()}>
                {/* Fixed Close Button */}
                <button 
                    onClick={() => setShowSync(false)}
                    className="absolute top-8 right-8 p-4 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
                >
                    <X className="w-6 h-6 text-gray-500 group-hover:text-white" />
                </button>

                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-primary/20 rounded-3xl flex items-center justify-center">
                        <Smartphone className="w-8 h-8 text-primary" />
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Authorized Link</h2>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest italic">Connect Mobile Node to Veri-Real Ledger</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[480px] overflow-auto px-4 custom-scrollbar">
                    {/* Render Only Demo-Specific Hubs */}
                    {enterprises.length > 0 ? (
                        enterprises
                        .filter(ent => ent.name.includes('Dhaka') || ent.name.includes('Sydney'))
                        .map((ent, idx) => {
                            const baseURL = `${protocol}//${displayHost}/mobile`;
                            const syncUrl = `${baseURL}?api=${encodeURIComponent(backendApiUrl)}&eid=${ent.id}&mode=${ent.type === 'hub' ? 'enterprise' : 'user'}`;
                            const isHub = ent.type === 'hub';
                            
                            return (
                                <div key={ent.id || idx} className={`p-6 rounded-[40px] border transition-all flex flex-col items-center gap-6 group hover:scale-[1.05] ${isHub ? 'bg-primary/5 border-primary/20 hover:border-primary' : 'bg-success/5 border-success/20 hover:border-success'}`}>
                                    <div className="text-center space-y-1">
                                        <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isHub ? 'text-primary' : 'text-success'}`}>{isHub ? 'Authorized Hub' : 'Retailer Node'}</p>
                                        <p className="text-sm text-white font-black uppercase tracking-tighter truncate w-full px-2 pt-2" title={ent.name}>{ent.name}</p>
                                    </div>
                                    <div className="p-4 bg-white rounded-[32px] shadow-2xl shadow-black/40">
                                        <QRCodeSVG value={syncUrl} size={140} />
                                    </div>
                                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 opacity-50">
                                        <ShieldCheck className={`w-3 h-3 ${isHub ? 'text-primary' : 'text-success'}`} />
                                        <span className="text-[8px] font-black text-white uppercase tracking-widest">L3 Secure Node</span>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="col-span-3 py-12 text-gray-500 italic font-black uppercase tracking-widest opacity-50 animate-pulse text-center w-full">Synchronizing Ledger Entities...</div>
                    )}
                    
                    {/* Fallback Generic Sync - Explicit HTTPS */}
                    <div className="p-6 rounded-[40px] bg-white/5 border border-white/10 flex flex-col items-center gap-6 group hover:border-white/30 transition-all opacity-60 grayscale hover:grayscale-0">
                        <div className="text-center space-y-1">
                            <p className="text-gray-500 font-black uppercase text-[10px] tracking-widest">Generic</p>
                            <p className="text-white text-sm font-bold italic italic tracking-tighter italic">Retail View</p>
                        </div>
                        <div className="p-4 bg-white rounded-[32px] shadow-2xl">
                            <QRCodeSVG value={`${protocol}//${localIp}:5173/mobile`} size={140} />
                        </div>
                         <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                            <Smartphone className="w-3 h-3 text-gray-500" />
                            <span className="text-[8px] font-black text-white uppercase tracking-widest">Standard Handset</span>
                        </div>
                    </div>
                </div>

                <div className="pt-4 px-4 pb-4 space-y-4">
                    {/* Mobile Connection Helper Guide */}
                    <div className="p-6 rounded-[30px] bg-primary/10 border border-primary/20 text-left space-y-3 animate-in slide-in-from-bottom duration-500">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-[10px] font-black italic">!</div>
                            <p className="text-[10px] font-black text-white uppercase tracking-widest">iPhone / Safari Fix</p>
                        </div>
                        <p className="text-[10px] text-gray-400 font-bold leading-relaxed">If your phone says <strong className="text-primary italic">"Connection Not Private"</strong>, don't worry! Tap <strong className="text-white">"Show Details"</strong> (or Advanced) then tap <strong className="text-white underline">"Visit this Website"</strong> to authorize the secure camera link.</p>
                    </div>

                    <button onClick={() => setShowSync(false)} className="w-full py-5 bg-white/5 border border-white/10 rounded-[30px] font-black uppercase text-xs hover:bg-white/10 transition-all tracking-widest leading-relaxed italic text-gray-400">Back to Dashboard Controls</button>
                </div>
             </div>
          </div>
      )}

      {/* Barcode Zoom Modal */}
      {zoomProduct && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-background/90 backdrop-blur-xl" onClick={() => setZoomProduct(null)}>
             <div className="glass w-full max-w-xl rounded-[60px] border border-white/20 p-16 text-center space-y-10 animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
                <div className="space-y-2">
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">{zoomProduct.name}</h2>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">GS1 DataMatrix Identity</p>
                </div>
                <div className="p-12 bg-white rounded-[50px] shadow-2xl shadow-primary/10">
                    <img src={`/public/barcodes/${zoomProduct.productId}.png`} alt="Barcode" className="w-full h-auto" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-3xl bg-white/5 border border-white/10 text-left">
                        <p className="text-[10px] text-gray-500 font-black uppercase mb-1">Batch ID</p>
                        <p className="text-white font-bold">{zoomProduct.productId}</p>
                    </div>
                    <div className="p-4 rounded-3xl bg-white/5 border border-white/10 text-left">
                        <p className="text-[10px] text-gray-500 font-black uppercase mb-1">Serial No</p>
                        <p className="text-white font-bold">{zoomProduct.serialNumber}</p>
                    </div>
                </div>
                <button onClick={() => setZoomProduct(null)} className="w-full py-5 bg-primary text-white rounded-[30px] font-black uppercase text-sm shadow-xl shadow-primary/20">Back to Registry</button>
             </div>
          </div>
      )}

      {/* Modal Re-implementation for Minting (Shortened for brevity) */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <div className="glass w-full max-w-lg rounded-3xl border border-white/20 p-10 animate-in zoom-in duration-300">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <QrCode className="text-primary w-8 h-8" /> Mint On-Chain Batch
            </h2>
            <form onSubmit={handleRegister} className="grid grid-cols-2 gap-4">
              <input required placeholder="Product ID" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white" onChange={(e) => setNewProduct({ ...newProduct, productId: e.target.value })}/>
              <input required placeholder="Serial" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white" onChange={(e) => setNewProduct({ ...newProduct, serialNumber: e.target.value })}/>
              <input required placeholder="Batch Name" className="col-span-2 w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white" onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}/>
              <input required placeholder="Manufacturer" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white" onChange={(e) => setNewProduct({ ...newProduct, manufacturer: e.target.value })}/>
              <input type="date" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white" onChange={(e) => setNewProduct({ ...newProduct, manufactureDate: e.target.value })}/>
              <input type="number" placeholder="Arrival Window" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white" onChange={(e) => setNewProduct({ ...newProduct, timeToHub: e.target.value })}/>
              <input required placeholder="Destination" className="col-span-1 w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white" onChange={(e) => setNewProduct({ ...newProduct, destination: e.target.value })}/>
              <div className="col-span-2 flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 rounded-xl border border-white/10 text-gray-500 font-bold uppercase transition-all">Cancel</button>
                <button type="submit" className="flex-1 py-4 rounded-xl bg-primary hover:bg-blue-600 font-bold text-white uppercase tracking-widest transition-all">Anchor Batch</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Registry;
