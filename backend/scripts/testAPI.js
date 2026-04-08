
async function test() {
  const baseUrl = 'http://127.0.0.1:5000';
  
  try {
    console.log('1. Testing Health Check...');
    const healthRes = await fetch(`${baseUrl}/health`);
    const health = await healthRes.json();
    console.log('Health:', health);

    console.log('\n2. Testing Product Registration...');
    const regPayload = {
      productId: 'PROD-001',
      name: 'Pharma Batch PH-2024-DEMO',
      manufacturer: 'Global Pharma Corp',
      metadataHash: 'QmXoypizj2WkeB...hash'
    };
    const regRes = await fetch(`${baseUrl}/api/product/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(regPayload)
    });
    const reg = await regRes.json();
    console.log('Registration Success:', reg);

    console.log('\n3. Testing Scan Ingestion...');
    const scanPayload = {
      productId: 'PROD-001',
      deviceId: 'device-abc-123',
      ipAddress: '192.168.1.1',
      gpsLat: -33.8688,
      gpsLng: 151.2093,
      timestamp: new Date().toISOString(),
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)'
    };
    const scanRes = await fetch(`${baseUrl}/api/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scanPayload)
    });
    const scan = await scanRes.json();
    console.log('Scan Success:', scan);

    console.log('\n4. Testing Product Query...');
    const queryRes = await fetch(`${baseUrl}/api/product/PROD-001`);
    const query = await queryRes.json();
    console.log('Product Data:', JSON.stringify(query, null, 2));

    console.log('\nAll Phase 2 tests passed!');
  } catch (error) {
    console.error('Test failed:', error.message);
    process.exit(1);
  }
}

test();
