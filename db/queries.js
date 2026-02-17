const { pool } = require('./connection');

async function listFlavors() {
  const [rows] = await pool.query(
    'SELECT id, name, description, created_at FROM ice_cream_flavors ORDER BY created_at DESC'
  );
  return rows;
}

async function addFlavor(name, description) {
  await pool.query(
    'INSERT INTO ice_cream_flavors (name, description) VALUES (?, ?)',
    [name, description || null]
  );
  const [rows] = await pool.query(
    'SELECT id, name, description, created_at FROM ice_cream_flavors WHERE id = LAST_INSERT_ID()'
  );
  return rows[0];
}

async function getFlavorById(id) {
  const [rows] = await pool.query(
    'SELECT id, name, description, created_at FROM ice_cream_flavors WHERE id = ?',
    [id]
  );
  return rows[0] || null;
}

module.exports = { listFlavors, addFlavor, getFlavorById };
