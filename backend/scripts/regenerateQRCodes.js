import db from '../src/db/sqlite.js';
import bwipjs from 'bwip-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function regenerate() {
    const products = db.prepare('SELECT * FROM products').all();
    const barcodeDir = path.resolve(__dirname, '../public/barcodes');
    
    if (!fs.existsSync(barcodeDir)) fs.mkdirSync(barcodeDir, { recursive: true });

    console.log(`Re-generating ${products.length} QR codes...`);

    for (const p of products) {
        try {
            const buffer = await bwipjs.toBuffer({
                bcid: 'qrcode',
                text: `(01)${p.productId}(21)${p.serialNumber}(17)${p.manufactureDate}`,
                scale: 4,
                includepadding: true,
                paddingheight: 10,
                paddingwidth: 10
            });

            fs.writeFileSync(path.join(barcodeDir, `${p.productId}.png`), buffer);
            console.log(`[OK] ${p.productId}`);
        } catch (err) {
            console.error(`[FAIL] ${p.productId}:`, err.message);
        }
    }

    console.log('Done! All labels are now QR Codes.');
    process.exit(0);
}

regenerate();
