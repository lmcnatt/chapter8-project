const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

const mockRows = [
  { id: 1, name: 'Vanilla', description: 'Classic vanilla', created_at: new Date() },
  { id: 2, name: 'Chocolate', description: 'Rich chocolate', created_at: new Date() },
];

const mockPool = {
  query: async (sql, params) => {
    if (sql === 'SELECT 1') return [[{ 1: 1 }]];
    if (sql.startsWith('SELECT') && sql.includes('ORDER BY')) return [mockRows];
    if (sql.startsWith('INSERT')) return [{ insertId: 3 }];
    if (sql.includes('LAST_INSERT_ID'))
      return [[{ id: 3, name: params?.[0] ?? 'New', description: null, created_at: new Date() }]];
    if (sql.includes('WHERE id = ?'))
      return [mockRows.filter((r) => r.id === params[0])];
    return [[]];
  },
};

require.cache[require.resolve('../db/connection')] = {
  id: require.resolve('../db/connection'),
  filename: require.resolve('../db/connection'),
  loaded: true,
  exports: { pool: mockPool },
};

const app = require('../server');

let server;
let baseUrl;

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const req = http.request(url, {
      method: options.method || 'GET',
      headers: options.headers || {},
    }, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        try { res.body = JSON.parse(body); } catch { res.body = body; }
        resolve(res);
      });
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

before(() => {
  return new Promise((resolve) => {
    server = app.listen(0, () => {
      const { port } = server.address();
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

after(() => {
  return new Promise((resolve) => server.close(resolve));
});

describe('GET /health', () => {
  it('returns status ok', async () => {
    const res = await request('/health');
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.status, 'ok');
    assert.equal(res.body.database, 'connected');
  });
});

describe('GET /flavors', () => {
  it('returns a list of flavors', async () => {
    const res = await request('/flavors', {
      headers: { 'Accept': 'application/json' },
    });
    assert.equal(res.statusCode, 200);
    assert.ok(Array.isArray(res.body));
    assert.equal(res.body.length, 2);
    assert.equal(res.body[0].name, 'Vanilla');
  });
});

describe('POST /flavors', () => {
  it('creates a flavor with valid input', async () => {
    const res = await request('/flavors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Strawberry', description: 'Fresh strawberry' }),
    });
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.id, 3);
  });

  it('rejects empty name', async () => {
    const res = await request('/flavors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '' }),
    });
    assert.equal(res.statusCode, 400);
    assert.ok(res.body.error);
  });

  it('rejects missing name', async () => {
    const res = await request('/flavors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: 'No name given' }),
    });
    assert.equal(res.statusCode, 400);
  });
});

describe('GET /', () => {
  it('returns the HTML landing page', async () => {
    const res = await request('/');
    assert.equal(res.statusCode, 200);
    assert.ok(res.body.includes('Ice Cream Parlor'));
  });
});
