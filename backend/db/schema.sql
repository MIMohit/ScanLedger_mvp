CREATE TABLE IF NOT EXISTS products (
    productId TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    manufacturer TEXT NOT NULL,
    metadataHash TEXT NOT NULL,
    chainState INTEGER DEFAULT 0, -- 0=Minted, 1=InMarket, 2=Active, 3=Flagged
    timeToHub INTEGER, -- Estimated hours to reach hub
    serialNumber TEXT,
    manufactureDate TEXT,
    destination TEXT,
    flagReason TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS enterprises (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    locationName TEXT NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    trustedDeviceId TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'hub'
);

CREATE TABLE IF NOT EXISTS scans (
    scan_id TEXT PRIMARY KEY,
    productId TEXT NOT NULL,
    deviceId TEXT NOT NULL,
    ipAddress TEXT NOT NULL,
    gpsLat REAL NOT NULL,
    gpsLng REAL NOT NULL,
    timestamp DATETIME NOT NULL,
    userAgent TEXT,
    riskScore INTEGER DEFAULT 0,
    verdict TEXT DEFAULT 'UNKNOWN', -- TRUSTED, SUSPICIOUS, COUNTERFEIT
    reasons TEXT, -- JSON array of reasons
    txHash TEXT, -- On-chain transaction hash if applicable
    FOREIGN KEY(productId) REFERENCES products(productId)
);
