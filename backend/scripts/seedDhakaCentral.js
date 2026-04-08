import db from '../src/db/sqlite.js';
import axios from 'axios';

async function setup() {
    console.log('--- Setting up Dhaka Central Demo Path ---');

    // 1. Seed the Hub with REAL Dhaka GPS
    const hubId = 'ent-dc-hub-01';
    db.prepare('INSERT OR REPLACE INTO enterprises (id, name, type, locationName, trustedDeviceId, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(hubId, 'Dhaka Central Hub', 'hub', 'Dhaka Central Hub', 'HANDSET-MOBILE', 23.8103, 90.4125);
    
    console.log('[OK] Dhaka Central Hub added to authorized whitelist.');

    try {
        // 2. Mint the Medicine Batch
        const res = await axios.post('http://127.0.0.1:5000/api/product/register', {
            productId: 'MED-DC-001',
            name: 'Dhaka Central Antiviral',
            manufacturer: 'Veri-Real Pharma L3',
            serialNumber: 'SN-DC-900',
            manufactureDate: '2024-05-10',
            timeToHub: 12,
            destination: 'Dhaka Central Hub'
        });
        
        console.log('[OK] Minted Dhaka Central Batch on-chain:', res.data.txHash || 'Simulated Ledger');
    } catch (err) {
        console.error('[FAIL] Product registration failed:', err.response?.data?.error || err.message);
    }

    console.log('--- Done! Refresh Registry to see the new Trusted path ---');
    process.exit(0);
}

setup();
