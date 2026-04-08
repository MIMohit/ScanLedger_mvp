/**
 * AI Risk Engine for Double-Scan
 * Implements refined Impossible Travel and Trust Triage algorithms based on specific risk scoring.
 */

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

export function calculateRisk(currentScan, lastScan, productScans = [], enterpriseData = null, productData = null) {
  let riskScore = 0;
  const reasons = [];
  const scanType = currentScan.scanType || 'user';

  // --- Multi-Stage Logic ---

  if (scanType === 'enterprise') {
    // 1. Device Check
    if (currentScan.deviceId === enterpriseData.trustedDeviceId) {
        riskScore -= 50;
        reasons.push('AUTHORIZED DEVICE: Hub-specific trusted hardware identified.');
    } else {
        riskScore += 80;
        reasons.push('UNAUTHORIZED DEVICE: Enterprise scan must come from a registered hub device.');
    }

    // 2. Geofencing Check
    const hasHubGPS = enterpriseData?.lat && enterpriseData?.lng;
    const hasDeviceGPS = currentScan.gpsLat !== 0 && currentScan.gpsLng !== 0;

    if (hasHubGPS && hasDeviceGPS) {
        const dist = getDistance(currentScan.gpsLat, currentScan.gpsLng, enterpriseData.lat, enterpriseData.lng);
        if (dist <= 50) { // More lenient 50km for demo
            riskScore -= 30;
            reasons.push('GEO-FENCE VERIFIED: Device location matches enterprise hub region.');
        } else {
            riskScore += 70;
            reasons.push(`GEO-FENCE VIOLATION: Device is ${Math.round(dist)}km away from the registered hub.`);
        }
    } else {
        reasons.push('GEO-FENCE UNAVAILABLE: Skipping location check due to missing GPS signal.');
    }

    // 3. Route Integrity Check (The "Double-Scan" Core)
    if (productData && enterpriseData) {
        const destMatch = productData.destination === enterpriseData.locationName || productData.destination === enterpriseData.name;
        if (destMatch) {
            riskScore -= 20;
            reasons.push('ROUTE VERIFIED: Product is at its intended legal destination.');
        } else {
            riskScore += 100;
            reasons.push(`DESTINATION MISMATCH: Product belongs to [${productData.destination}] but was intercepted at [${enterpriseData.name}]. Unauthorized route node detected.`);
        }
    }

    // 4. Timeline Check
    if (productData) {
        const mfrDate = new Date(productData.manufactureDate);
        const scanDate = new Date(currentScan.timestamp);
        const hoursDiff = (scanDate - mfrDate) / (1000 * 60 * 60);
        
        if (hoursDiff <= productData.timeToHub) {
            riskScore -= 10;
            reasons.push('TIMELINE VERIFIED: Product reached hub within manufacturer window.');
        } else {
            riskScore += 50;
            reasons.push(`TIMELINE EXCEEDED: Product took ${Math.round(hoursDiff)}h to reach hub (Limit: ${productData.timeToHub}h).`);
        }
    }
  } else {
    // End-User Scan Logic
    
    // 1. Double Scan Detection (Counterfeit)
    const previousUserScans = productScans.filter(s => {
        try {
            const parsed = JSON.parse(s.reasons || '[]');
            return parsed.some(r => r.includes('USER VERIFICATION'));
        } catch (e) { return false; }
    });

    if (previousUserScans.length > 0) {
        riskScore = 100;
        reasons.push('DOUBLE SCAN DETECTED: This unique product has already been verified by a consumer. RED-FLAGGED.');
    }

    // 2. Location Check (Should match enterprise region)
    if (enterpriseData) {
        const dist = getDistance(currentScan.gpsLat, currentScan.gpsLng, enterpriseData.lat, enterpriseData.lng);
        if (dist <= 50) { // Users scan near the store/area
            riskScore -= 20;
            reasons.push(`LOCAL PURCHASE: Verified within reasonable distance of ${enterpriseData.name}.`);
        } else {
            riskScore += 40;
            reasons.push(`DISTANCE ANOMALY: Scanned ${Math.round(dist)}km away from the selected point of purchase.`);
        }
    }

    // 3. Mark as User Verification for future double-scan checks
    reasons.push('USER VERIFICATION EVENT');
  }

  // --- Legacy Algorithms (Improved) ---

  // Impossible Travel
  if (lastScan) {
    const distance = getDistance(lastScan.gpsLat, lastScan.gpsLng, currentScan.gpsLat, currentScan.gpsLng);
    const timeDeltaHours = (new Date(currentScan.timestamp) - new Date(lastScan.timestamp)) / (1000 * 60 * 60);
    if (timeDeltaHours > 0) {
      const velocity = distance / timeDeltaHours;
      if (velocity > 900 && timeDeltaHours < 3) {
        riskScore += 60;
        reasons.push(`IMPOSSIBLE TRAVEL: ${Math.round(velocity)} km/h detected.`);
      }
    }
  }

  // Normalization
  riskScore = Math.max(0, Math.min(100, riskScore));

  // Verdicts
  let verdict = 'TRUSTED';
  if (riskScore >= 70) verdict = 'COUNTERFEIT';
  else if (riskScore > 30) verdict = 'SUSPICIOUS';

  return { riskScore, verdict, reasons };
}
