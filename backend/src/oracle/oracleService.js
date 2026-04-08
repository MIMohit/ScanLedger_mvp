import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import db from '../db/sqlite.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const artifactPath = path.resolve(__dirname, '../../artifacts_lite/ProductRegistry.json');
const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

export async function processOracleUpdate(productId, scanId, verdict, reasons) {
  console.log(`Oracle: Processing verdict '${verdict}' for product ${productId}...`);
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const oracleWallet = new ethers.Wallet(process.env.ORACLE_PRIVATE_KEY, provider);
  const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, artifact.abi, oracleWallet);

  let newState = -1;
  let txHash = null;

  try {
    if (verdict === 'TRUSTED') {
      console.log(`Oracle: Activating product ${productId}...`);
      const tx = await contract.updateState(productId, 1); // 1 = Active
      await tx.wait();
      txHash = tx.hash;
      newState = 1;
    } else if (verdict === 'COUNTERFEIT') {
      console.log(`Oracle: Flagging product ${productId} as counterfeit...`);
      const reasonStr = JSON.stringify(reasons);
      const tx = await contract.flagProduct(productId, reasonStr);
      await tx.wait();
      txHash = tx.hash;
      newState = 2; // 2 = Flagged
    } else {
      console.log(`Oracle: No on-chain update for verdict: ${verdict}`);
      return { success: true, onChain: false };
    }

    if (txHash) {
      // Update SQLite with the on-chain state and transaction hash
      if (newState !== -1) {
        db.prepare('UPDATE products SET chainState = ?, flagReason = ? WHERE productId = ?').run(newState, verdict === 'COUNTERFEIT' ? JSON.stringify(reasons) : null, productId);
      }
      db.prepare('UPDATE scans SET txHash = ? WHERE scan_id = ?').run(txHash, scanId);
      
      console.log(`Oracle Update success: ${txHash}`);
    }

    return { success: true, onChain: true, txHash };
  } catch (error) {
    console.error('Oracle processing failed:', error.message);
    return { success: false, error: error.message };
  }
}
