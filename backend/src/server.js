// Fastify Server - Last Update: 2026-04-05T11:52:15Z
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { registerProduct, getProduct, getProducts, syncProduct } from './api/product.js';
import { processScan } from './api/scan.js';
import { getBlockchainStats } from './api/blockchain.js';
import { getEnterprises } from './api/enterprise.js';
import dotenv from 'dotenv';
import os from 'os';

dotenv.config();

import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({
  logger: true
});

// Configure Static Files
await fastify.register(fastifyStatic, {
  root: path.join(__dirname, '../public'),
  prefix: '/public/', // optional: default '/'
});

// Configure CORS
await fastify.register(cors, {
  origin: '*',
  methods: ['GET', 'POST', 'PUT']
});

// Routes
fastify.post('/api/product/register', registerProduct);
fastify.get('/api/product/:id', getProduct);
fastify.get('/api/products', getProducts);
fastify.post('/api/product/sync/:id', syncProduct);
fastify.post('/api/scan', processScan);
fastify.get('/api/blockchain/stats', getBlockchainStats);
fastify.get('/api/enterprises', getEnterprises);

// Global Error Handler
fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error(error);
    reply.status(500).send({ 
        error: 'Digital Twin Ledger Error', 
        message: error.message,
        timestamp: new Date().toISOString() 
    });
});

// Network Discovery Oracle - ULTIMATE FIX
fastify.get('/api/network-ip', async () => {
  try {
    const interfaces = os.networkInterfaces();
    let candidates = [];

    for (const name of Object.keys(interfaces)) {
      // Ignore known virtual hubs
      if (name.toLowerCase().includes('virtualbox') || name.toLowerCase().includes('vbox') || name.toLowerCase().includes('wsl')) continue;
      
      for (const net of interfaces[name]) {
        if (net.family === 'IPv4' && !net.internal) {
          // Score the IP based on likelihood of being 'Real Wi-Fi'
          let score = 10;
          
          // HARD BLACKLIST: Never allow VirtualBox subnets to be candidates
          if (net.address.startsWith('192.168.56.')) continue;
          
          if (net.address.startsWith('192.168.0.') || net.address.startsWith('192.168.1.')) score += 100;
          if (name.toLowerCase().includes('wi-fi') || name.toLowerCase().includes('wireless')) score += 50;
          if (net.address.startsWith('172.')) score -= 200; // Likely WSL
          
          candidates.push({ ip: net.address, score });
        }
      }
    }

    if (candidates.length > 0) {
      // Sort by score (highest first)
      candidates.sort((a, b) => b.score - a.score);
      return { ip: candidates[0].ip };
    }
  } catch (e) {
    console.error("Network discovery faulted:", e.message);
  }
  return { ip: 'localhost' };
});

// Health Check
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

const start = async () => {
  try {
    const port = process.env.PORT || 5000;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`Double-Scan Backend listening on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
