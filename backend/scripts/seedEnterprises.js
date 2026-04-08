import db from '../src/db/sqlite.js';

const enterprises = [
    {
        id: 'ENT-SYD-001',
        name: 'Sydney Central Pharma Hub',
        locationName: 'Sydney Central',
        lat: -33.8688,
        lng: 151.2093,
        trustedDeviceId: 'DEV-HUB-SYD-001',
        type: 'hub'
    },
    {
        id: 'ENT-DHA-001',
        name: 'Dhaka Global Logistics Hub',
        locationName: 'Dhaka Airport Zone',
        lat: 23.8103,
        lng: 90.4125,
        trustedDeviceId: 'DEV-HUB-DHA-001',
        type: 'hub'
    },
    {
        id: 'ENT-NYC-001',
        name: 'New York JFK Logistics Hub',
        locationName: 'Queens, NYC',
        lat: 40.6413,
        lng: -73.7781,
        trustedDeviceId: 'DEV-HUB-NYC-001',
        type: 'hub'
    },
    {
        id: 'ENT-LDN-001',
        name: 'London Heathrow Pharma Hub',
        locationName: 'London Heathrow',
        lat: 51.4700,
        lng: -0.4543,
        trustedDeviceId: 'DEV-HUB-LDN-001',
        type: 'hub'
    },
    {
        id: 'RETAIL-DHA-001',
        name: 'Dhaka Central Square Pharmacy',
        locationName: 'Dhaka North',
        lat: 23.8041,
        lng: 90.4152,
        trustedDeviceId: 'HANDSET-GENERIC-01',
        type: 'retail'
    },
    {
        id: 'RETAIL-NYC-001',
        name: 'Manhattan Medical Express',
        locationName: 'Times Square, NYC',
        lat: 40.7580,
        lng: -73.9855,
        trustedDeviceId: 'HANDSET-GENERIC-01',
        type: 'retail'
    },
    {
        id: 'RETAIL-LDN-001',
        name: 'London City Health Plus',
        locationName: 'Westminster, LDN',
        lat: 51.4995,
        lng: -0.1248,
        trustedDeviceId: 'HANDSET-GENERIC-01',
        type: 'retail'
    },
    {
        id: 'RETAIL-SYD-001',
        name: 'Sydney Central Pharmacy',
        locationName: 'City South',
        lat: -33.8750,
        lng: 151.2050,
        trustedDeviceId: 'HANDSET-GENERIC-01',
        type: 'retail'
    }
];

async function seed() {
    console.log('Seeding Enterprises with Types...');
    const stmt = db.prepare('INSERT OR REPLACE INTO enterprises (id, name, locationName, lat, lng, trustedDeviceId, type) VALUES (?, ?, ?, ?, ?, ?, ?)');
    
    for (const ent of enterprises) {
        console.log(`Adding ${ent.type.toUpperCase()}: ${ent.name}...`);
        stmt.run(ent.id, ent.name, ent.locationName, ent.lat, ent.lng, ent.trustedDeviceId, ent.type);
    }
    console.log('Seed Completed!');
}

seed().catch(err => {
    console.error('Seed Failed:', err);
    process.exit(1);
});
