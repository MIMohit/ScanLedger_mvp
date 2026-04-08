import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { ShieldCheck, ShieldAlert, Clock, Database, Globe, Hash, Truck, User, Smartphone, MapPin, AlertCircle, Archive } from 'lucide-react';

const Verify = () => {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [enterprises, setEnterprises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  // Dynamic Backend Detection
  const [apiUrl] = useState(() => {
    const savedIp = localStorage.getItem('veri_real_network_ip');
    return savedIp ? `http://${savedIp}:5000` : '';
  });

  // Simulation State
  const [simMode, setSimMode] = useState('user'); // 'enterprise' or 'user'
  const [selectedEnt, setSelectedEnt] = useState('');
  const [selectedHub, setSelectedHub] = useState(''); // Consumer hub context
  const [selectedDevice, setSelectedDevice] = useState('HANDSET-GENERIC-01');
  const [simLocation, setSimLocation] = useState({ lat: -33.8688, lng: 151.2093, name: 'Sydney Central' });

  const fetchData = async () => {
    try {
      const pRes = await axios.get(`${apiUrl}/api/product/${productId}`);
      setProduct(pRes.data);
      const eRes = await axios.get(`${apiUrl}/api/enterprises`);
      setEnterprises(eRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [productId]);

  const handleSimulateScan = async () => {
    setSimulating(true);
    setScanResult(null);
    try {
      const payload = {
        productId,
        deviceId: selectedDevice,
        ipAddress: '192.168.1.50',
        gpsLat: simLocation.lat,
        gpsLng: simLocation.lng,
        timestamp: new Date().toISOString(),
        userAgent: simMode === 'enterprise' ? 'Medical-Hub-Scanner/2.0' : 'Mozilla/5.0 (iPhone)',
        scanType: simMode,
        enterpriseId: selectedEnt
      };

      const res = await axios.post(`${apiUrl}/api/scan`, payload);
      setScanResult(res.data);
      await fetchData(); // Refresh state
    } catch (err) {
      alert('Scan Simulation Failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setSimulating(false);
    }
  };

  const handleRepairAnchor = async () => {
    setSimulating(true);
    try {
      await axios.post(`${apiUrl}/api/product/sync/${product.productId}`);
      await fetchData();
      alert('Ledger Anchor Repaired Successfully!');
    } catch (err) {
      alert('Repair Failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setSimulating(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-96"><div className="w-8 h-8 border-t-2 border-primary rounded-full animate-spin" /></div>;
  if (!product) return <div className="p-8 glass rounded-3xl text-center"><ShieldAlert className="w-16 h-16 text-danger mx-auto mb-4" /> <h2 className="text-2xl font-bold text-white">Product Not Found</h2></div>;

  const getStatusInfo = (state) => {
    switch (state) {
      case 0: return { label: 'Minted (In Transit)', color: 'text-gray-400', icon: <Clock className="w-10 h-10" />, bg: 'bg-gray-400/20' };
      case 1: return { label: 'In Market (At Hub)', color: 'text-primary', icon: <Truck className="w-10 h-10" />, bg: 'bg-primary/20' };
      case 2: return { label: 'Verified Authentic', color: 'text-success', icon: <ShieldCheck className="w-10 h-10" />, bg: 'bg-success/20' };
      case 3: return { label: 'Counterfeit / Flagged', color: 'text-danger', icon: <ShieldAlert className="w-10 h-10" />, bg: 'bg-danger/20' };
      default: return { label: 'Unknown', color: 'text-white' };
    }
  };

  const status = getStatusInfo(product.chainData?.state || 0);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom duration-700">

      {product.chainData?.error && (
        <div className="p-5 rounded-[32px] bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top duration-500">
          <div className="flex items-center gap-4">
            <AlertCircle className="w-8 h-8 shrink-0 animate-pulse text-amber-500" />
            <div>
              <p className="text-xs font-black uppercase tracking-tight">Ledger Out-of-Sync</p>
              <p className="text-[10px] font-bold opacity-80 uppercase leading-tight mt-0.5">This batch is missing from the active Polygon L3 ledger (likely due to a session restart).</p>
            </div>
          </div>
          <button
            onClick={handleRepairAnchor}
            disabled={simulating}
            className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-black uppercase text-[10px] rounded-2xl shadow-xl shadow-amber-500/20 transition-all disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
          >
            {simulating ? 'Syncing...' : 'Repair Ledger Connection'}
          </button>
        </div>
      )}

      {/* Audit/Purchase Terminals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Enterprise Scan Terminal */}
        <section className="glass p-8 rounded-[40px] border border-primary/20 shadow-2xl relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 p-4 font-mono text-[8px] opacity-30 text-white uppercase tracking-widest">Type: Enterprise_Audit</div>

          <div className="space-y-6 pt-4 flex-1">
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">Enterprise Scan</h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Simulate logistics node audit (Device + Location)</p>
            </div>

            <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-500 uppercase flex items-center gap-1"><MapPin className="w-3 h-3"/> Logistics Location</label>
                        <select 
                            value={simMode === 'enterprise' ? selectedEnt : ''} 
                            onChange={(e) => {
                                const ent = enterprises.find(ent => ent.id === e.target.value);
                                setSimMode('enterprise');
                                setSelectedEnt(e.target.value);
                                if (ent) {
                                    setSimLocation({ lat: ent.lat, lng: ent.lng, name: ent.locationName });
                                    setSelectedDevice(ent.trustedDeviceId); // Auto-select trusted device
                                }
                            }}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-primary transition-all font-medium"
                        >
                            <option value="">Select Audit Point...</option>
                            {enterprises.filter(e => e.type === 'hub').map(ent => (
                                <option key={ent.id} value={ent.id} className="bg-background">{ent.name} ({ent.locationName})</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-500 uppercase flex items-center gap-1"><Smartphone className="w-3 h-3" /> Authorized Device</label>
                        <select
                            value={selectedDevice}
                            onChange={(e) => setSelectedDevice(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-primary transition-all overflow-hidden"
                        >
                            <option value="HANDSET-GENERIC-01" className="bg-background italic text-danger/50 text-[10px]">Generic Handset (UNAUTHORIZED)</option>
                            {selectedEnt && enterprises.find(e => e.id === selectedEnt)?.type === 'hub' && (
                                <option value={enterprises.find(e => e.id === selectedEnt).trustedDeviceId} className="bg-background text-success font-black">
                                    {enterprises.find(e => e.id === selectedEnt).locationName} Scan-Pad (AUTHORIZED)
                                </option>
                            )}
                            <option value="DEV-HUB-SYD-001" className="bg-background text-[10px]">Manual Hub Device Override</option>
                        </select>
                    </div>
            </div>

            <button
              disabled={simulating || (simMode !== 'enterprise' && !selectedEnt)}
              onClick={() => { setSimMode('enterprise'); handleSimulateScan(); }}
              className="w-full py-4 bg-primary hover:bg-blue-600 disabled:opacity-50 text-white font-black uppercase text-xs rounded-2xl shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-2 mt-4"
            >
              {simulating && simMode === 'enterprise' ? 'Syncing Ledger...' : 'Audit Global Hub'}
            </button>
          </div>
        </section>

        {/* End-User Scan Terminal */}
        <section className="glass p-8 rounded-[40px] border border-success/20 shadow-2xl relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 p-4 font-mono text-[8px] opacity-30 text-white uppercase tracking-widest">Type: End_User_Scan</div>

          <div className="space-y-6 pt-4 flex-1">
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">End-User Scan</h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Simulate retail purchase check (Hub + Location)</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-500 uppercase flex items-center gap-1"><Truck className="w-3 h-3" /> Origin Hub</label>
                <select
                  value={selectedHub}
                  onChange={(e) => setSelectedHub(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-success transition-all"
                >
                  <option value="" className="bg-background">Select Verified Hub...</option>
                  {enterprises.filter(e => e.type === 'hub').map(ent => (
                    <option key={ent.id} value={ent.id} className="bg-background text-xs">{ent.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-500 uppercase flex items-center gap-1"><MapPin className="w-3 h-3" /> Current Location</label>
                <select
                  value={simMode === 'user' ? selectedEnt : ''}
                  onChange={(e) => {
                    const ent = enterprises.find(ent => ent.id === e.target.value);
                    setSimMode('user');
                    setSelectedDevice('HANDSET-GENERIC-01'); // Default for consumer
                    setSelectedEnt(e.target.value);
                    if (ent) setSimLocation({ lat: ent.lat, lng: ent.lng, name: ent.locationName });
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-success transition-all font-medium"
                >
                  <option value="">Select Pharmacy Outlet...</option>
                  {enterprises.filter(e => e.type === 'retail').map(ent => (
                    <option key={ent.id} value={ent.id} className="bg-background text-xs">{ent.name} ({ent.locationName})</option>
                  ))}
                  <option value="remote" className="bg-background font-italic text-xs">⚠️ Random Retail Location</option>
                </select>
              </div>
            </div>

            <button
              disabled={simulating || (simMode !== 'user' && !selectedEnt) || !selectedEnt}
              onClick={() => { setSimMode('user'); handleSimulateScan(); }}
              className="w-full py-4 bg-success hover:bg-success/80 disabled:opacity-50 text-white font-black uppercase text-xs rounded-2xl shadow-xl shadow-success/20 transition-all flex items-center justify-center gap-2 mt-4"
            >
              {simulating && simMode === 'user' ? 'Auth Verification...' : 'Perform End-User Scan'}
            </button>
          </div>
        </section>
      </div>

      {/* Shared Verification Result Alert */}
      {scanResult && (
        <div className={`p-6 rounded-[2.5rem] border flex items-center gap-6 animate-in slide-in-from-top zoom-in duration-500 ${scanResult.verdict === 'TRUSTED' ? 'bg-success/10 border-success/30 text-success' : 'bg-danger/10 border-danger/30 text-danger shadow-lg shadow-danger/5'}`}>
          <div className={`shrink-0 w-16 h-16 rounded-3xl flex items-center justify-center ${scanResult.verdict === 'TRUSTED' ? 'bg-success/20' : 'bg-danger/20'}`}>
            {scanResult.verdict === 'TRUSTED' ? <ShieldCheck className="w-10 h-10" /> : <AlertCircle className="w-10 h-10" />}
          </div>
          <div className="flex-1">
            <h4 className="font-black text-xl uppercase tracking-tighter">{scanResult.verdict} VERDICT</h4>
            <p className="text-sm font-bold opacity-90 leading-tight mt-1">{scanResult.reasons?.[0]}</p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-black uppercase opacity-50 mb-1">AI Risk Score</p>
            <p className="text-2xl font-black">{scanResult.riskScore}/100</p>
          </div>
        </div>
      )}


      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className={`glass p-10 rounded-[40px] border-2 shadow-2xl transition-all duration-500 ${product.chainData.state === 3 ? 'border-danger/30 shadow-danger/5' : 'border-success/30 shadow-success/5'}`}>
          <div className="flex justify-between items-start mb-8">
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-inner ${status.bg} ${status.color}`}>
              {status.icon}
            </div>
            <div className="text-right">
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">State Level</div>
              <div className={`text-2xl font-black uppercase ${status.color}`}>{status.label}</div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-5 rounded-3xl bg-white/5 border border-white/10">
              <p className="text-[10px] text-gray-500 uppercase font-black mb-2 opacity-50">Blockchain Trace</p>
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-primary" />
                <p className="text-sm font-bold text-white">Consensus Registry (Polygon Local)</p>
              </div>
            </div>

            {product.chainData.state === 3 && (
              <div className="p-6 rounded-3xl bg-danger/10 border border-danger/20 text-danger animate-pulse">
                <p className="text-xs font-black uppercase mb-2">Flag Trigger</p>
                <p className="text-sm font-bold italic leading-relaxed">"{product.chainData.flagReason || 'Automated behavioral anomaly flagged by AI risk motor. Cluster proximity conflict.'}"</p>
              </div>
            )}

            {product.chainData.state === 1 && (
              <div className="p-6 rounded-3xl bg-primary/10 border border-primary/20 text-primary">
                <p className="text-xs font-black uppercase mb-2">Transit Log</p>
                <p className="text-sm font-bold">Successfully arrived at {product.destination} Hub. Ready for consumer retail verification.</p>
              </div>
            )}
          </div>
        </div>

        <div className="glass p-10 rounded-[40px] border border-white/5 space-y-8 shadow-2xl">
          <h3 className="text-xl font-bold text-white uppercase tracking-tight flex items-center gap-3">
            <div className="w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_#1e90ff]" /> Product Attributes
          </h3>
          <div className="grid grid-cols-1 gap-6">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 text-primary"><Globe className="w-6 h-6" /></div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-black opacity-50">Origin / MFR</p>
                <p className="text-white font-bold text-lg">{product.manufacturer}</p>
              </div>
            </div>
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 text-primary"><Clock className="w-6 h-6" /></div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-black opacity-50">Transit Window</p>
                <p className="text-white font-bold text-lg">{product.chainData.timeToHub} Hours Max</p>
              </div>
            </div>
            <div className="flex items-center gap-5 pt-2">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 text-primary"><Hash className="w-6 h-6" /></div>
              <div className="flex-1 overflow-hidden">
                <p className="text-[10px] text-gray-500 uppercase font-black opacity-50">Ledger Hash (IPFS)</p>
                <p className="text-primary font-mono text-xs truncate max-w-full">{product.chainData.metadataHash}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="glass p-10 rounded-[40px] border border-white/5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 origin-top-right rotate-45 -translate-y-4 translate-x-4">
          <div className="bg-primary/20 p-2"><Archive className="text-primary/40 w-24 h-24" /></div>
        </div>
        <h3 className="text-xl font-bold text-white uppercase tracking-tight mb-8">Digital Evidence Trail</h3>
        <div className="space-y-4">
          {(product.scans?.length > 0) ? product.scans?.map((scan, i) => (
            <div key={i} className={`flex items-center justify-between p-5 rounded-3xl border transition-all duration-300 ${scan.verdict === 'TRUSTED' ? 'bg-white/5 border-white/10 hover:border-success/30' : 'bg-danger/5 border-danger/10 hover:border-danger/30'}`}>
              <div className="flex items-center gap-6">
                <div className={`p-3 rounded-2xl ${scan.verdict === 'TRUSTED' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                  {scan.verdict === 'TRUSTED' ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
                </div>
                <div>
                  <div className="font-black text-white uppercase tracking-widest text-xs">{scan.verdict} SCAN POINT</div>
                  <div className="text-[10px] text-gray-500 font-mono mt-1">NODE AUTH: {scan.deviceId}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-black text-white">{new Date(scan.timestamp).toLocaleString()}</div>
                <div className="text-[10px] text-primary font-mono mt-1 truncate max-w-[150px]">SIG: {scan.txHash}</div>
              </div>
            </div>
          )) : (
            <div className="p-12 text-center text-gray-500 italic font-medium">No scan logs available for this batch yet.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Verify;
