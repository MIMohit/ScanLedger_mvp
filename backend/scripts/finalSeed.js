async function seed() {
  const baseUrl = 'http://127.0.0.1:5000';
  
  const products = [
    { id: 'PROD-SAFE-01', name: 'Pharma Batch PH-2024-X4', mfr: 'Global Pharma', hash: 'QmPH01' },
    { id: 'PROD-TRAVEL-02', name: 'Rolex Submariner RL-99', mfr: 'Rolex SA', hash: 'QmRX02' },
    { id: 'PROD-CONFLICT-03', name: 'Snapdragon 9 Gen 3', mfr: 'Qualcomm', hash: 'QmQC03' }
  ];

  try {
    for (const p of products) {
      console.log(`Registering ${p.id}...`);
      await fetch(`${baseUrl}/api/product/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: p.id, name: p.name, manufacturer: p.mfr, metadataHash: p.hash })
      });
    }

    // SCENARIO 1: Safe Product (NYC)
    console.log('Seeding Safe Scenario...');
    await fetch(`${baseUrl}/api/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: 'PROD-SAFE-01', deviceId: 'dev-1', ipAddress: '8.8.8.8', gpsLat: 40.7128, gpsLng: -74.0060, timestamp: new Date().toISOString(), userAgent: 'Medical-Scanner/1.0' })
    });

    // SCENARIO 2: Impossible Travel (Sydney -> Dhaka)
    console.log('Seeding Travel Scenario...');
    const t0 = new Date().toISOString();
    const tPlus2h = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    
    await fetch(`${baseUrl}/api/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: 'PROD-TRAVEL-02', deviceId: 'dev-syd', ipAddress: '1.2.3.4', gpsLat: -33.8688, gpsLng: 151.2093, timestamp: t0 })
    });
    await fetch(`${baseUrl}/api/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: 'PROD-TRAVEL-02', deviceId: 'dev-dhk', ipAddress: '5.6.7.8', gpsLat: 23.8103, gpsLng: 90.4125, timestamp: tPlus2h })
    });

    // SCENARIO 3: Device Conflict (NYC cluster)
    console.log('Seeding Conflict Scenario...');
    const devices = ['d-alpha', 'd-beta', 'd-gamma'];
    for (const d of devices) {
      await fetch(`${baseUrl}/api/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: 'PROD-CONFLICT-03', deviceId: d, ipAddress: '127.0.0.1', gpsLat: 40.7128, gpsLng: -74.0060, timestamp: new Date().toISOString() })
      });
    }

    console.log('Seed Completed Successfully!');
  } catch (err) {
    console.error('Seed failed:', err.message);
  }
}

seed();
