const express = require('express');
const axios = require('axios');
const { listFlavors, addFlavor } = require('./db/queries');
const { pool } = require('./db/connection');

const app = express();
const PORT = process.env.PORT || 3000;

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

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

    if (req.accepts('html', 'json') === 'json') {
      return res.json(flavors);
    }

    const flavorCards = flavors.map(f => `
      <div class="card">
        <h2>${escapeHtml(f.name)}</h2>
        <p>${f.description ? escapeHtml(f.description) : '<em>No description</em>'}</p>
      </div>`).join('');

    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Our Flavors – Ice Cream Parlor</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      background: linear-gradient(135deg, #fdf2f8 0%, #ede9fe 50%, #dbeafe 100%);
      min-height: 100vh;
      color: #1e293b;
    }
    header {
      text-align: center;
      padding: 3rem 1rem 1.5rem;
    }
    header h1 {
      font-size: 2.5rem;
      font-weight: 800;
      background: linear-gradient(90deg, #ec4899, #8b5cf6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    header p { color: #64748b; margin-top: .5rem; font-size: 1.1rem; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
      max-width: 960px;
      margin: 0 auto;
      padding: 1rem 1.5rem 4rem;
    }
    .card {
      background: #fff;
      border-radius: 1rem;
      padding: 1.75rem;
      box-shadow: 0 4px 24px rgba(0,0,0,.06);
      transition: transform .15s ease, box-shadow .15s ease;
    }
    .card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 32px rgba(0,0,0,.1);
    }
    .card h2 {
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: .5rem;
      color: #7c3aed;
    }
    .card p { color: #475569; line-height: 1.5; }
    .back { display: inline-block; margin: 0 0 0 1.5rem; color: #8b5cf6; text-decoration: none; font-weight: 600; }
    .back:hover { text-decoration: underline; }
    .empty { text-align: center; padding: 4rem 1rem; color: #94a3b8; font-size: 1.2rem; }
  </style>
</head>
<body>
  <header>
    <a class="back" href="/">&larr; Home</a>
    <h1>Our Flavors</h1>
    <p>${flavors.length} flavor${flavors.length !== 1 ? 's' : ''} available</p>
  </header>
  ${flavors.length ? `<div class="grid">${flavorCards}</div>` : '<div class="empty">No flavors yet — add one from the home page!</div>'}
</body>
</html>`);
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
    if (req.is('application/x-www-form-urlencoded')) {
      return res.redirect('/flavors');
    }
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
