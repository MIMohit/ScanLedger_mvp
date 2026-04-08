import db from '../db/sqlite.js';
import { setCache, getCache } from '../db/memoryCache.js';
import { v4 as uuidv4 } from 'uuid';
import { calculateRisk } from '../ai/riskEngine.js';
import { processOracleUpdate } from '../oracle/oracleService.js';

export async function processScan(request, reply) {
  const { productId, deviceId, gpsLat, gpsLng, scanType, enterpriseId } = request.body;
  const ipAddress = request.body.ipAddress || request.ip || '127.0.0.1';
  const timestamp = request.body.timestamp || Date.now();
  const userAgent = request.body.userAgent || request.headers['user-agent'];

  if (!productId || !deviceId || gpsLat === undefined || gpsLng === undefined) {
    return reply.status(400).send({ error: 'Missing required telemetry fields (Product ID, Device ID, GPS)' });
  }

  try {
    const scanId = uuidv4();
    
    // 1. Fetch Contextual Data for AI
    const productData = db.prepare('SELECT * FROM products WHERE productId = ?').get(productId);
    if (!productData) return reply.status(404).send({ error: 'Product not found in registry.' });

    let enterpriseData = null;
    if (enterpriseId) {
        enterpriseData = db.prepare('SELECT * FROM enterprises WHERE id = ?').get(enterpriseId);
    }

    // 2. Get last scan and history
    const lastScan = getCache(productId);
    const productScans = db.prepare('SELECT * FROM scans WHERE productId = ? ORDER BY timestamp DESC LIMIT 20').all(productId);
    
    // 3. AI Risk Engine (Device, Time, Geofencing, Behavior)
    const currentScan = { productId, deviceId, ipAddress, gpsLat, gpsLng, timestamp, userAgent, scanType };
    const { riskScore, verdict, reasons } = calculateRisk(currentScan, lastScan, productScans, enterpriseData, productData);

    // 4. State Machine Transition & Oracle Update
    let txHash = null;
    if (verdict === 'TRUSTED') {
        let newState = null;
        if (scanType === 'enterprise' && productData.chainState === 0) {
            newState = 1; // Minted -> InMarket
        } else if (scanType === 'user' && productData.chainState === 1) {
            newState = 2; // InMarket -> Active (Sold)
        }

        if (newState !== null) {
            try {
                // Pass 'TRUSTED' to trigger the existing Oracle logic for activation
                const oracleResult = await processOracleUpdate(productId, scanId, 'TRUSTED', { state: newState });
                txHash = oracleResult.txHash;
                // Note: processOracleUpdate already updates SQLite if txHash is present
            } catch (err) { console.error('Oracle State sync failed:', err.message); }
        }
    } else if (verdict === 'COUNTERFEIT') {
        // Auto-flag on chain
        try {
            const oracleResult = await processOracleUpdate(productId, scanId, 'COUNTERFEIT', reasons);
            txHash = oracleResult.txHash;
        } catch (err) { console.error('Oracle Flagging failed:', err.message); }
    }

    // 5. Store Scan Record
    const finalIp = ipAddress || request.ip || '127.0.0.1';
    const stmt = db.prepare('INSERT INTO scans (scan_id, productId, deviceId, ipAddress, gpsLat, gpsLng, timestamp, userAgent, riskScore, verdict, reasons, txHash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    stmt.run(scanId, productId, deviceId, finalIp, gpsLat, gpsLng, timestamp, userAgent, riskScore, verdict, JSON.stringify(reasons), txHash);

    // 6. Update Cache
    setCache(productId, { deviceId, ipAddress, gpsLat, gpsLng, timestamp });

    return { success: true, scanId, riskScore, verdict, reasons, txHash };
  } catch (error) {
    console.error('Scan processing failed:', error.message);
    return reply.status(500).send({ error: error.message });
  }
}
