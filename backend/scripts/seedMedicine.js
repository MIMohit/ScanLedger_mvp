async function seedMedicine() {
  const baseUrl = 'http://127.0.0.1:5000';
  
  const medicines = [
    { 
        productId: 'MED-ASP-001', 
        name: 'Aspirin 500mg - Batch #88', 
        manufacturer: 'Global Pharma', 
        serialNumber: 'SN-ASP-8822',
        manufactureDate: '2024-03-01',
        destination: 'Sydney Pharmacy Cluster',
        metadataHash: 'QmAspirin88'
    },
    { 
        productId: 'MED-PARA-002', 
        name: 'Paracetamol 650mg - Batch #12', 
        manufacturer: 'HealthyLife Corp', 
        serialNumber: 'SN-PARA-1209',
        manufactureDate: '2024-04-10',
        destination: 'Dhaka Export Hub',
        metadataHash: 'QmParacetamol12'
    },
    { 
        productId: 'MED-AMOX-003', 
        name: 'Amoxicillin 250mg - Batch #05', 
        manufacturer: 'BioMed Labs', 
        serialNumber: 'SN-AMOX-0505',
        manufactureDate: '2024-05-15',
        destination: 'New York Medical Center',
        metadataHash: 'QmAmoxicillin05'
    }
  ];

  try {
    console.log('--- Phase 2: Seeding Medicine Products & Generating Barcodes ---');
    
    for (const med of medicines) {
      console.log(`Registering ${med.productId}...`);
      const res = await fetch(`${baseUrl}/api/product/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(med)
      });
      const data = await res.json();
      console.log(`Result: ${data.success ? 'SUCCESS' : 'FAILED'} | TX: ${data.txHash}`);
    }

    // SCENARIO: Trusted Scan (Aspirin in Sydney)
    console.log('\nSeeding Trusted Scan (Aspirin in Sydney)...');
    await fetch(`${baseUrl}/api/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            productId: 'MED-ASP-001',
            deviceId: 'scanner-syd-01',
            ipAddress: '1.2.3.4',
            gpsLat: -33.8688,
            gpsLng: 151.2093,
            timestamp: new Date().toISOString(),
            userAgent: 'PharmaScan-v2/Sydney'
        })
    });

    console.log('\nSeed Medicine Completed!');
  } catch (err) {
    console.error('Seed failed. Is the server running? Error:', err.message);
  }
}

seedMedicine();
