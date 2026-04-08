async function testAI() {
  const baseUrl = 'http://127.0.0.1:5000';
  const productId = 'PROD-SYD-DHK';

  try {
    console.log('--- Phase 3: AI Risk Engine Test ---');
    
    // 1. Register Product
    await fetch(`${baseUrl}/api/product/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId,
        name: 'Luxury Watch LW-0099',
        manufacturer: 'Swiss Timepieces',
        metadataHash: 'QmLuxuryWatchHash'
      })
    });

    // 2. Scan #1 from Sydney (T+0)
    console.log('\nScan #1: Sydney (T+0)');
    const scan1 = await fetch(`${baseUrl}/api/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId,
        deviceId: 'device-sydney',
        ipAddress: '1.1.1.1',
        gpsLat: -33.8688,
        gpsLng: 151.2093,
        timestamp: new Date().toISOString()
      })
    });
    console.log('Result #1:', await scan1.json());

    // 3. Scan #2 from Dhaka (T+2 hours) - IMPOSSIBLE TRAVEL
    console.log('\nScan #2: Dhaka (T+2 hours) - Expected: COUNTERFEIT');
    const twoHoursLater = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    const scan2 = await fetch(`${baseUrl}/api/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId,
        deviceId: 'device-dhaka' || 'device-sydney', // same or different device doesn't matter for travel
        ipAddress: '2.2.2.2',
        gpsLat: 23.8103,
        gpsLng: 90.4125,
        timestamp: twoHoursLater
      })
    });
    const result2 = await scan2.json();
    console.log('Result #2:', result2);

    if (result2.verdict === 'COUNTERFEIT' || result2.riskScore >= 60) {
      console.log('\nSUCCESS: Impossible Travel detected!');
    } else {
      console.error('\nFAILURE: AI engine did not flag impossible travel');
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testAI();
