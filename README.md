# Veri-Real: Triple-Scan Blockchain Anti-Counterfeit Platform

Veri-Real is a next-generation "Double-Scan" anti-counterfeiting platform that combines **Polygon zkEVM Blockchain**, **Behavioral AI Risk Scoring**, and **Mobile Geofencing** to secure global supply chains.

---

## 🚀 Quick Start Guide

To run the full Veri-Real ecosystem, you must launch three separate services:

### 1. The Ledger (Polygon L3 Simulation)
Start the local Ethereum/Polygon emulator to handle digital twin minting and immutable audit trails.
- **Terminal 1**: `cd backend`
- **Command**: `npx ganache --wallet.deterministic`
- **RPC Port**: 8545

### 2. The Bridge (AI & API Server)
Start the Fastify backend. This handles the **Triple-Scan Risk Engine**, barcode generation, and the product database.
- **Terminal 2**: `cd backend`
- **Command**: `npm run dev`
- **Port**: 5000

### 3. The Dashboard (Manufacturer Control)
Start the Vite React application to manage the inventory, view the global scan map, and access the Mobile Sync controls.
- **Terminal 3**: `cd frontend`
- **Command**: `npm run dev` (Ensure `https: true` is set for camera access)
- **URL**: [https://localhost:5173](https://localhost:5173)

---

## 📲 The Mobile Demo (Dhaka Central Path)

Veri-Real's power is best demonstrated using a real mobile device. Follow these steps for an interactive presentation:

### Phase 1: Mobile Sync
1. Ensure your computer and iPhone are on the **same Wi-Fi network**.
2. On your computer dashboard, click **"Connect Phone"**.
3. On your iPhone, open the browser and navigate to `https://<YOUR-IP>:5173/mobile`.
4. **Authorize as a Hub**: Scan the **"Dhaka Central Hub"** (Blue QR) from your computer screen. Your phone is now an authorized scanning node for Dhaka.

### Phase 2: Trusted Verification
1. On your computer (Registry), find the **"Dhaka Central Antiviral"** product.
2. Click its QR code to enlarge it.
3. Scan it with your iPhone.
4. **Result**: Your phone will reveal a **Bright Green "TRUSTED"** badge! ✅

### Phase 3: Counterfeit Detection (Route Integrity)
1. On your computer, find a product destined for **Sydney**.
2. Scan it with your **Dhaka-synced phone**.
3. **Result**: The AI will instantly detect a **"Destination Mismatch"** and reveal a **Bright Red "COUNTERFEIT"** alert! ❌

---

## 🛡️ Security Architecture: The Triple-Scan
Veri-Real doesn't just check if a product exists; it calculates a **Risk Score (0-100)** based on:
1. **Device Integrity**: Is the scanner an authorized hub handset?
2. **Geofencing**: Is the scan happening within 50km of the authorized hub?
3. **Route Integrity**: Does the product's ledger destination match the physical hub location?

Every scan generates a "Proof of Verification" that is silently recorded on the **Polygon Audit Trail**, creating a permanent record of the product's journey from factory to pharmaceutical hub.

---

## 🛠️ Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide icons.
- **Backend**: Fastify, SQLite (Persistence), bwip-js (QR Generation).
- **Blockchain**: Solidity (Ethers.js), Ganache (Polygon Simulator).
- **Scanner**: Html5-Qrcode (High-Performance Mobile Capture).

---

Developed by **MIMohit** for Veri-Real MVP.
