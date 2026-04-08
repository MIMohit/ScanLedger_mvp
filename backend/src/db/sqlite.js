import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../../db/double_scan.sqlite');
const schemaPath = path.resolve(__dirname, '../../db/schema.sql');

const db = new Database(dbPath);

// Initialize schema
const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='products'").get();
if (!tableCheck) {
  console.log('Initializing SQLite schema...');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);
}

// Migrate schema if columns are missing
try {
  const columns = db.prepare('PRAGMA table_info(products)').all();
  const columnNames = columns.map(c => c.name);
  
  if (!columnNames.includes('serialNumber')) {
    console.log('Migrating SQLite: Adding serialNumber, manufactureDate, destination...');
    db.prepare('ALTER TABLE products ADD COLUMN serialNumber TEXT').run();
    db.prepare('ALTER TABLE products ADD COLUMN manufactureDate TEXT').run();
    db.prepare('ALTER TABLE products ADD COLUMN destination TEXT').run();
  }
  
  if (!columnNames.includes('timeToHub')) {
    console.log('Migrating SQLite: Adding timeToHub...');
    db.prepare('ALTER TABLE products ADD COLUMN timeToHub INTEGER').run();
  }

  const entTableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='enterprises'").get();
  if (!entTableCheck) {
    console.log('Initializing enterprises table...');
    db.exec(`CREATE TABLE enterprises (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        locationName TEXT NOT NULL,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        trustedDeviceId TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'hub'
    )`);
  } else {
    const entColumns = db.prepare('PRAGMA table_info(enterprises)').all();
    const entColumnNames = entColumns.map(c => c.name);
    if (!entColumnNames.includes('type')) {
      console.log('Migrating SQLite: Adding type to enterprises...');
      db.prepare("ALTER TABLE enterprises ADD COLUMN type TEXT NOT NULL DEFAULT 'hub'").run();
    }
    if (!entColumnNames.includes('lat')) {
      console.log('Migrating SQLite: Adding GPS columns to enterprises...');
      db.prepare("ALTER TABLE enterprises ADD COLUMN lat REAL NOT NULL DEFAULT 0").run();
      db.prepare("ALTER TABLE enterprises ADD COLUMN lng REAL NOT NULL DEFAULT 0").run();
    }
  }
} catch (error) {
  console.error('Migration failed:', error.message);
}

export default db;
