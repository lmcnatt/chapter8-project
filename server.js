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
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ice Cream Parlor</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      background: linear-gradient(135deg, #fdf2f8 0%, #ede9fe 50%, #dbeafe 100%);
      min-height: 100vh;
      color: #1e293b;
    }
    nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: 960px;
      margin: 0 auto;
      padding: 1.25rem 1.5rem;
    }
    nav .logo {
      font-size: 1.25rem;
      font-weight: 800;
      color: #7c3aed;
      text-decoration: none;
    }
    nav a.nav-link {
      color: #6d28d9;
      text-decoration: none;
      font-weight: 600;
      padding: .5rem 1.25rem;
      border-radius: .5rem;
      transition: background .15s ease;
    }
    nav a.nav-link:hover { background: rgba(124,58,237,.08); }
    .hero {
      text-align: center;
      padding: 4rem 1.5rem 2.5rem;
      max-width: 700px;
      margin: 0 auto;
    }
    .hero h1 {
      font-size: 3rem;
      font-weight: 800;
      line-height: 1.15;
      background: linear-gradient(90deg, #ec4899, #8b5cf6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .hero p {
      margin-top: 1rem;
      font-size: 1.2rem;
      color: #64748b;
      line-height: 1.6;
    }
    .hero .cta {
      display: inline-block;
      margin-top: 2rem;
      padding: .85rem 2rem;
      background: linear-gradient(135deg, #8b5cf6, #ec4899);
      color: #fff;
      font-size: 1.05rem;
      font-weight: 700;
      border-radius: .75rem;
      text-decoration: none;
      transition: transform .15s ease, box-shadow .15s ease;
    }
    .hero .cta:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(139,92,246,.35);
    }
    .form-section {
      max-width: 520px;
      margin: 2rem auto 4rem;
      background: #fff;
      border-radius: 1rem;
      padding: 2.5rem;
      box-shadow: 0 4px 24px rgba(0,0,0,.06);
    }
    .form-section h2 {
      font-size: 1.4rem;
      font-weight: 700;
      color: #7c3aed;
      margin-bottom: 1.5rem;
      text-align: center;
    }
    .form-section label {
      display: block;
      font-weight: 600;
      font-size: .9rem;
      color: #475569;
      margin-bottom: .35rem;
    }
    .form-section input {
      width: 100%;
      padding: .7rem .9rem;
      border: 1.5px solid #e2e8f0;
      border-radius: .5rem;
      font-size: 1rem;
      margin-bottom: 1.25rem;
      transition: border-color .15s ease;
      outline: none;
    }
    .form-section input:focus { border-color: #8b5cf6; }
    .form-section button {
      width: 100%;
      padding: .8rem;
      border: none;
      border-radius: .5rem;
      background: linear-gradient(135deg, #8b5cf6, #ec4899);
      color: #fff;
      font-size: 1.05rem;
      font-weight: 700;
      cursor: pointer;
      transition: transform .15s ease, box-shadow .15s ease;
    }
    .form-section button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(139,92,246,.35);
    }
    footer {
      text-align: center;
      padding: 2rem 1rem;
      color: #94a3b8;
      font-size: .85rem;
    }
  </style>
</head>
<body>
  <nav>
    <a class="logo" href="/">Ice Cream Parlor</a>
    <a class="nav-link" href="/flavors">View Flavors</a>
  </nav>
  <div class="hero">
    <h1>Welcome to the Ice Cream Parlor</h1>
    <p>Discover our hand-crafted flavors, made fresh with the finest ingredients. From timeless classics to bold new creations — there's a scoop for everyone.</p>
    <a class="cta" href="/flavors">Browse All Flavors</a>
  </div>
  <div class="form-section">
    <h2>Suggest a New Flavor</h2>
    <form action="/flavors" method="post">
      <label for="name">Flavor Name</label>
      <input id="name" name="name" placeholder="e.g. Mango Sorbet" required />
      <label for="description">Description</label>
      <input id="description" name="description" placeholder="e.g. Tropical mango with a hint of lime" />
      <button type="submit">Add Flavor</button>
    </form>
  </div>
  <footer>&copy; 2026 Ice Cream Parlor</footer>
</body>
</html>`);
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Ice cream parlor listening on port ${PORT}`);
  });
}

module.exports = app;
