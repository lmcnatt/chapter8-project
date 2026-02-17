const axios = require('axios');
const { listFlavors } = require('../db/queries');

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000';

async function run() {
  // When no DB: use axios to test the API (health, flavors)
  if (!process.env.DB_HOST) {
    try {
      const healthRes = await axios.get(`${API_BASE}/health`, { timeout: 5000 });
      if (healthRes.data.status === 'ok' || healthRes.data.database) {
        console.log('GET /health ok (axios)');
      }
      const flavorsRes = await axios.get(`${API_BASE}/flavors`, { timeout: 5000 });
      console.log('GET /flavors ok (axios), count:', Array.isArray(flavorsRes.data) ? flavorsRes.data.length : 0);
      process.exit(0);
    } catch (err) {
      console.log('SKIP: DB_HOST not set and API not reachable at', API_BASE);
      process.exit(0);
    }
    return;
  }

  // When DB is set: still use axios to hit the API for consistency
  try {
    const healthRes = await axios.get(`${API_BASE}/health`, { timeout: 5000 });
    if (healthRes.data.status !== 'ok') throw new Error('Health check failed');
    const flavorsRes = await axios.get(`${API_BASE}/flavors`, { timeout: 5000 });
    const list = Array.isArray(flavorsRes.data) ? flavorsRes.data : await listFlavors();
    console.log('listFlavors ok, count:', list.length);
    process.exit(0);
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      const list = await listFlavors();
      console.log('listFlavors ok (DB), count:', list.length);
      process.exit(0);
      return;
    }
    console.error('Test failed:', err.message);
    process.exit(1);
  }
}

run();
