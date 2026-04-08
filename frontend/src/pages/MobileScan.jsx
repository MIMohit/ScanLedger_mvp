import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import axios from 'axios';
import { ShieldCheck, AlertCircle, Smartphone, MapPin, Truck, ChevronLeft, RefreshCcw, Camera, Activity, Zap } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const MobileScan = () => {
    const location = useLocation();
    const [scanResult, setScanResult] = useState(null);
    const [simMode, setSimMode] = useState('user'); 
    const [selectedEnt, setSelectedEnt] = useState('');
    const [enterprises, setEnterprises] = useState([]);
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState(null);
    const [gps, setGps] = useState(null);
    const [isScannerStarted, setIsScannerStarted] = useState(false);
    
    // Lifecycle and Race Condition Guards
    const scannerRef = useRef(null);
    const isBusy = useRef(false);
    const isMounted = useRef(true);

    // 1. Initial Data Fetch & URL Parsing
    useEffect(() => {
        isMounted.current = true;
        const query = new URLSearchParams(location.search);
        const mode = query.get('mode');
        const eid = query.get('eid');

        if (mode) setSimMode(mode);
        if (eid) setSelectedEnt(eid);

        fetchEnterprises();
        requestGps();

        return () => {
            isMounted.current = false;
        };
    }, []);

    const fetchEnterprises = async () => {
        try {
            const res = await axios.get('/api/enterprises');
            if (isMounted.current) setEnterprises(res.data);
        } catch (err) {
            console.error('Failed to fetch locations:', err);
        } finally {
            if (isMounted.current) setLoading(false);
        }
    };

    const requestGps = () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((position) => {
                if (isMounted.current) setGps({ lat: position.coords.latitude, lng: position.coords.longitude });
            }, (err) => {
                console.warn("GPS Access Denied:", err);
                // Non-blocking for demo
            });
        }
    };

    // 2. Scanner Lifecycle
    useEffect(() => {
        if (!loading && !scanResult && !error && !isScannerStarted) {
            startScanner();
        }
        // No auto-stop on every individual render to prevent removeChild crash
    }, [loading, scanResult, error, simMode, selectedEnt]);

    const startScanner = async () => {
        if (isBusy.current || isScannerStarted) return;
        isBusy.current = true;

        try {
            // Ensure any old instance is cleared
            if (scannerRef.current) {
                try { await scannerRef.current.stop(); } catch(e) {}
            }

            const scanner = new Html5Qrcode("reader");
            scannerRef.current = scanner;
            
            const config = { 
                fps: 25, 
                qrbox: { width: 300, height: 300 }, // Optimized box for iPhone Safari
                aspectRatio: 1.0, 
                formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ], // Explicitly force QR only for speed
                disableFlip: true // Helps with lens accuracy
            };

            await scanner.start({ facingMode: "environment" }, config, onScanSuccess);
            
            if (isMounted.current) setIsScannerStarted(true);
        } catch (err) {
            console.error("Scanner failed:", err);
            // Fallback for user gesture requirement or desktop
            try {
                if (scannerRef.current) {
                    await scannerRef.current.start({ facingMode: "user" }, { fps: 10 }, onScanSuccess);
                    if (isMounted.current) setIsScannerStarted(true);
                }
            } catch (err2) {
                if (isMounted.current) setError("Camera lens blocked: Please refresh your browser or check permissions.");
            }
        } finally {
            isBusy.current = false;
        }
    };

    const stopScanner = async () => {
        if (scannerRef.current && isScannerStarted && !isBusy.current) {
            isBusy.current = true;
            try {
                await scannerRef.current.stop();
                if (isMounted.current) setIsScannerStarted(false);
            } catch (err) {
                console.error("Stop scanner error:", err);
            } finally {
                isBusy.current = false;
            }
        }
    };

    const isScanningLocked = useRef(false);
    const onScanSuccess = async (decodedText) => {
        if (isScanningLocked.current) return;
        isScanningLocked.current = true;
        
        console.log("Scanned:", decodedText);
        if (navigator.vibrate) navigator.vibrate(100);
        
        await stopScanner();

        if (isMounted.current) {
            const productMatch = decodedText.match(/\(01\)(.*?)(?:\(21\)|$)/);
            const serialMatch = decodedText.match(/\(21\)(.*?)(?:\(17\)|$)/);
            
            if (productMatch && serialMatch) {
                handleVerify(productMatch[1], serialMatch[1]);
            } else if (decodedText.startsWith('MED-') || decodedText.startsWith('TEST-')) {
                handleVerify(decodedText, 'DEMO-SERIAL-1');
            } else {
                handleVerify(decodedText, 'UNKNOWN');
            }
        }
    };

    const handleVerify = async (productId, serialNumber) => {
        setVerifying(true);
        setScanResult({ productId, serialNumber });
        
        const payload = {
            productId,
            serialNumber,
            gpsLat: gps?.lat || 0,
            gpsLng: gps?.lng || 0,
            deviceId: simMode === 'enterprise' ? (enterprises.find(e => e.id === selectedEnt)?.trustedDeviceId || 'HANDSET-MOBILE') : 'HANDSET-MOBILE',
            scanType: simMode,
            enterpriseId: selectedEnt,
            timestamp: Date.now(),
            ipAddress: '0.0.0.0', // Backend will detect real IP
            userAgent: navigator.userAgent
        };

        try {
            const res = await axios.post('/api/scan', payload);
            if (isMounted.current) setScanResult(prev => ({ ...prev, ...res.data }));
        } catch (err) {
            console.error("Scan verification failed:", err);
            if (isMounted.current) setError(err.response?.data?.error || `Handshake Failed: ${err.message}`);
        } finally {
            if (isMounted.current) setVerifying(false);
        }
    };

    const reset = async () => {
        setScanResult(null);
        setError(null);
        isScanningLocked.current = false;
        if (isMounted.current) setIsScannerStarted(false);
    };

    if (loading) return (
        <div className="h-screen bg-background flex flex-col items-center justify-center text-white p-10 text-center gap-6">
            <Activity className="w-12 h-12 text-primary animate-pulse" />
            <div className="space-y-2">
                <p className="text-xl font-black uppercase italic tracking-tighter animate-pulse">Initializing Lens</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">Securing Data-Channel...</p>
            </div>
        </div>
    );

    const activeEnterprise = enterprises.find(e => e.id === selectedEnt);

    return (
        <div className="min-h-screen bg-background text-white font-sans flex flex-col p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <ShieldCheck className="w-8 h-8 text-primary shadow-lg shadow-primary/20" />
                    <h1 className="text-xl font-black italic uppercase tracking-tighter leading-tight">Double-Scan<br /><span className="text-primary">Mobile</span></h1>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                        <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Ledger L3 Active</span>
                    </div>
                </div>
            </div>

            {/* PERSISTENT SCANNER AREA (Prevents DOM Crashes) */}
            <div className={`flex-1 flex flex-col ${scanResult ? 'hidden' : 'block'}`}>
                {/* Auto-Connect Banner */}
                {activeEnterprise && (
                    <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-2xl flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                            <p className="text-[8px] font-black text-primary uppercase tracking-widest">Active Station</p>
                            <p className="text-xs font-bold text-white truncate">{activeEnterprise.name}</p>
                        </div>
                        <button onClick={() => setSelectedEnt('')} className="p-2 text-gray-500 hover:text-white"><RefreshCcw className="w-4 h-4" /></button>
                    </div>
                )}

                {!activeEnterprise && (
                    <>
                        <div className="grid grid-cols-2 gap-3 mb-6 p-1 bg-white/5 rounded-2xl border border-white/10">
                            <button onClick={() => setSimMode('enterprise')} className={`flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase ${simMode === 'enterprise' ? 'bg-primary text-white' : 'text-gray-500'}`}><Zap className="w-3 h-3" /> Hub</button>
                            <button onClick={() => setSimMode('user')} className={`flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase ${simMode === 'user' ? 'bg-success text-white' : 'text-gray-500'}`}><Smartphone className="w-3 h-3" /> Retail</button>
                        </div>
                        <div className="mb-6">
                            <select value={selectedEnt} onChange={(e) => setSelectedEnt(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white font-bold appearance-none">
                                <option value="">Identify Connection...</option>
                                {enterprises.filter(e => e.type === (simMode === 'enterprise' ? 'hub' : 'retail')).map(ent => (
                                    <option key={ent.id} value={ent.id} className="bg-background">{ent.name}</option>
                                ))}
                            </select>
                        </div>
                    </>
                )}

                <div className="flex-1 relative flex flex-col items-center justify-center">
                    <div className="w-full aspect-square mb-8 relative">
                        {/* The actual Scanner Node - React must NEVER touch children here */}
                        <div id="reader" className="w-full h-full rounded-[40px] overflow-hidden border-2 border-white/10 shadow-2xl bg-black/40" />
                        
                        {/* Scanning Overlay (Layered on top, not inside) */}
                        <div className="absolute inset-0 border-[40px] border-background/60 pointer-events-none rounded-[40px] z-10" />
                        
                        {!isScannerStarted && !error && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-20 bg-background/40 backdrop-blur-sm rounded-[40px]">
                                <div className="w-12 h-12 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
                                <p className="text-[10px] font-black text-white uppercase tracking-widest">Warming Lens...</p>
                            </div>
                        )}

                        {isScannerStarted && (
                           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-primary/50 rounded-3xl pointer-events-none z-10">
                               <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                               <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                               <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                               <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
                           </div>
                        )}
                    </div>
                    <div className="text-center space-y-3">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest leading-relaxed">
                            Align <span className="text-white">GS1 DataMatrix</span><br/>for ledger verification
                        </p>
                    </div>
                </div>
            </div>

            {/* SCAN RESULT AREA */}
            {scanResult && (
                <div className="flex-1 flex flex-col animate-in fade-in zoom-in duration-500">
                    {verifying ? (
                        <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                            <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                            <p className="text-lg font-black uppercase tracking-tighter italic animate-pulse tracking-widest">Verifying Hash...</p>
                        </div>
                    ) : error ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
                            <AlertCircle className="w-14 h-14 text-danger animate-bounce" />
                            <div>
                                <h3 className="text-2xl font-black uppercase text-white mb-2 tracking-tighter italic leading-none">Security Alert</h3>
                                <p className="text-gray-400 font-bold leading-relaxed text-sm">{error}</p>
                            </div>
                            <button onClick={reset} className="w-full py-5 bg-white/5 border border-white/10 rounded-3xl font-black uppercase text-xs hover:bg-white/10 tracking-[0.2em]">Reset Proxy</button>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col pt-4">
                            <div className={`p-10 rounded-[50px] border-2 shadow-2xl flex flex-col items-center text-center space-y-8 ${scanResult.verdict === 'TRUSTED' ? 'bg-success/10 border-success/30 shadow-success/10' : 'bg-danger/10 border-danger/30 shadow-danger/10'}`}>
                                <div className={`w-28 h-28 rounded-[48px] flex items-center justify-center ${scanResult.verdict === 'TRUSTED' ? 'bg-success/20 shadow-inner' : 'bg-danger/20 shadow-inner'}`}>
                                    {scanResult.verdict === 'TRUSTED' ? <ShieldCheck className="w-16 h-16 text-success" /> : <AlertCircle className="w-16 h-16 text-danger" />}
                                </div>
                                <div className="space-y-4">
                                    <h2 className={`text-5xl font-black uppercase italic tracking-tighter leading-none ${scanResult.verdict === 'TRUSTED' ? 'text-success' : 'text-danger'}`}>{scanResult.verdict}</h2>
                                    <div>
                                        <p className="text-white font-black text-xl tracking-tight leading-none uppercase">{scanResult.productId}</p>
                                        <p className="text-[10px] text-gray-500 font-black uppercase mt-2 tracking-widest">Serial: {scanResult.serialNumber}</p>
                                    </div>
                                </div>
                                <div className="w-full h-px bg-white/5" />
                                <p className="text-sm font-bold opacity-90 leading-relaxed italic text-white/80">"{scanResult.reasons?.[0]}"</p>
                            </div>

                            <button onClick={reset} className="mt-auto mb-4 w-full py-6 bg-primary text-white rounded-[32px] font-black uppercase text-sm shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-95 transition-all">
                                <RefreshCcw className="w-5 h-5" /> New Session
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Global Error */}
            {error && !scanResult && (
                <div className="fixed bottom-10 left-6 right-6 p-5 bg-danger text-white rounded-3xl flex items-center gap-4 shadow-2xl animate-in slide-in-from-bottom duration-500 border border-white/20 z-50">
                    <AlertCircle className="w-6 h-6" />
                    <span className="text-[10px] font-black uppercase tracking-widest flex-1 leading-tight">{error}</span>
                    <button onClick={reset} className="p-2 hover:bg-white/10 rounded-lg"><RefreshCcw className="w-4 h-4"/></button>
                </div>
            )}
        </div>
    );
};

export default MobileScan;
