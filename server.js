const express = require('express');
const axios = require('axios');
const { listFlavors, addFlavor } = require('./db/queries');
const { pool } = require('./db/connection');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'ok', database: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});

app.get('/flavors', async (req, res) => {
  try {
    const flavors = await listFlavors();
    res.json(flavors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to list flavors' });
  }
});

app.post('/flavors', async (req, res) => {
  const { name, description } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'name is required' });
  }
  try {
    const flavor = await addFlavor(name.trim(), description ? String(description).trim() : null);
    res.status(201).json(flavor);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add flavor' });
  }
});

app.get('/ping', async (req, res) => {
  try {
    const { data } = await axios.get('https://httpbin.org/get', { timeout: 5000 });
    res.json({ status: 'ok', echo: data.url || 'httpbin' });
  } catch (err) {
    res.status(502).json({ status: 'error', message: err.message });
  }
});

app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head><title>Ice Cream Parlor</title></head>
<body>
  <h1>Ice Cream Parlor</h1>
  <p>API: <a href="/flavors">GET /flavors</a> | <a href="/health">GET /health</a> | <a href="/ping">GET /ping</a> (axios)</p>
  <form action="/flavors" method="post">
    <label>Name: <input name="name" required /></label>
    <label>Description: <input name="description" /></label>
    <button type="submit">Add flavor</button>
  </form>
  <p>(Submit form as POST to /flavors; use Accept: application/json for JSON.)</p>
</body>
</html>
  `);
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Ice cream parlor listening on port ${PORT}`);
  });
}

module.exports = app;
