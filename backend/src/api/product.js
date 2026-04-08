import db from '../db/sqlite.js';
import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import bwipjs from 'bwip-js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load Contract ABI
const artifactPath = path.resolve(__dirname, "../../artifacts_lite/ProductRegistry.json");
const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

export async function registerProduct(request, reply) {
  const { productId, name, manufacturer, serialNumber, manufactureDate, timeToHub, destination, metadataHash } = request.body;

  if (!productId || !name || !manufacturer || !serialNumber || !manufactureDate || !destination || !timeToHub) {
    return reply.status(400).send({ error: 'Missing required manufacturer fields (including timeToHub)' });
  }

  try {
    // 1. Generate QR Code with Padding for better focus
    const barcodeBuffer = await bwipjs.toBuffer({
        bcid: 'qrcode',           
        text: `(01)${productId}(21)${serialNumber}(17)${manufactureDate}`, 
        scale: 4,                 // 4x is plenty for high-density QR
        includepadding: true,     // CRITICAL: Adds white quiet zone for focus
        paddingheight: 10,
        paddingwidth: 10,
    });

    const barcodeDir = path.resolve(__dirname, '../../public/barcodes');
    if (!fs.existsSync(barcodeDir)) fs.mkdirSync(barcodeDir, { recursive: true });
    fs.writeFileSync(path.join(barcodeDir, `${productId}.png`), barcodeBuffer);

    // 2. Save to SQLite
    const stmt = db.prepare('INSERT INTO products (productId, name, manufacturer, metadataHash, chainState, timeToHub, serialNumber, manufactureDate, destination) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    stmt.run(productId, name, manufacturer, metadataHash || 'QmDefault', 0, parseInt(timeToHub), serialNumber, manufactureDate, destination);

    // 3. Mint on Blockchain
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, artifact.abi, wallet);

    console.log(`Minting ${productId} [Serial: ${serialNumber}, Timeline: ${timeToHub}h] on Polygon...`);
    const tx = await contract.mintProduct(
        productId, 
        serialNumber, 
        Math.floor(new Date(manufactureDate).getTime() / 1000), 
        parseInt(timeToHub),
        destination, 
        metadataHash || 'QmDefault'
    );
    await tx.wait();
    console.log(`Minted. Tx: ${tx.hash}`);

    return { success: true, productId, txHash: tx.hash, barcodeUrl: `/public/barcodes/${productId}.png` };
  } catch (error) {
    console.error('Registration failed:', error.message);
    return reply.status(500).send({ error: error.message });
  }
}

export async function getProducts(request, reply) {
  try {
    const products = db.prepare('SELECT * FROM products ORDER BY createdAt DESC').all();
    
    let contract = null;
    try {
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, artifact.abi, provider);
    } catch (e) {
        console.warn('Blockchain provider not available, serving local data only.');
    }

    const fullProducts = await Promise.all(products.map(async (p) => {
        if (!contract) return { ...p, chainData: { state: 0, error: true, message: 'Ledger Offline' } };
        
        try {
            const chainData = await contract.getProduct(p.productId);
            return {
                ...p,
                chainData: {
                    productId: chainData[0],
                    serialNumber: chainData[1],
                    manufactureDate: Number(chainData[2]),
                    timeToHub: Number(chainData[3]),
                    destination: chainData[4],
                    metadataHash: chainData[5],
                    state: Number(chainData[6]),
                    flagReason: chainData[7],
                    updatedAt: Number(chainData[9])
                }
            };
        } catch (e) {
            console.error(`Failed to fetch chain data for ${p.productId}:`, e.message);
            return { ...p, chainData: { state: 0, error: true } };
        }
    }));

    return fullProducts;
  } catch (error) {
    console.error('Fetch all failed:', error.message);
    return reply.status(500).send({ error: error.message });
  }
}

export async function getProduct(request, reply) {
  const { id } = request.params;

  try {
    // 1. Dual-Lookup (ID or Serial)
    const product = db.prepare('SELECT * FROM products WHERE productId = ? OR serialNumber = ?').get(id, id);
    if (!product) return reply.status(404).send({ error: 'Product not found' });

    const productId = product.productId;
    const scans = db.prepare('SELECT * FROM scans WHERE productId = ? ORDER BY timestamp DESC LIMIT 10').all(productId);

    let chainData = { state: 0, error: true, message: 'Ledger Offline', timeToHub: product.timeToHub || 24 };

    try {
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, artifact.abi, provider);
        const rawChainData = await contract.getProduct(productId);
        chainData = {
          productId: rawChainData[0],
          serialNumber: rawChainData[1],
          manufactureDate: Number(rawChainData[2]),
          timeToHub: Number(rawChainData[3]),
          destination: rawChainData[4],
          metadataHash: rawChainData[5],
          state: Number(rawChainData[6]),
          flagReason: rawChainData[7],
          updatedAt: Number(rawChainData[9])
        };
    } catch (e) {
        console.warn(`Chain fetch failed for ${productId}:`, e.message);
    }

    return {
      ...product,
      scans,
      chainData
    };
  } catch (error) {
    console.error('Fetch failed:', error.message);
    return reply.status(500).send({ error: error.message });
  }
}

export async function syncProduct(request, reply) {
    const { id } = request.params;
    try {
        const product = db.prepare('SELECT * FROM products WHERE productId = ?').get(id);
        if (!product) return reply.status(404).send({ error: 'Batch not found in local DB' });

        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, artifact.abi, wallet);

        console.log(`Re-anchoring ${product.productId} to current ledger...`);
        const tx = await contract.mintProduct(
            product.productId, 
            product.serialNumber, 
            Math.floor(new Date(product.manufactureDate).getTime() / 1000), 
            parseInt(product.timeToHub || 24),
            product.destination, 
            product.metadataHash || 'QmDefault'
        );
        await tx.wait();
        
        return { success: true, txHash: tx.hash };
    } catch (error) {
        console.error('Sync failed:', error.message);
        return reply.status(500).send({ error: error.message });
    }
}

