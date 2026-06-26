const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', '..', 'data', 'precios.db');

let db = null;

async function conectar() {
  if (db) return db;

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA foreign_keys = ON');

  db.run(`
    CREATE TABLE IF NOT EXISTS productos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      precio_cop REAL NOT NULL,
      marca TEXT DEFAULT '',
      categoria TEXT DEFAULT ''
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS tasas (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      usd REAL NOT NULL DEFAULT 0.00024,
      ves REAL NOT NULL DEFAULT 4.50
    )
  `);

  return db;
}

function guardar() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function ejecutar(sql, params) {
  if (params) {
    db.run(sql, params);
  } else {
    db.run(sql);
  }
  guardar();
}

function consultar(sql, params) {
  const stmt = db.prepare(sql);
  if (params) stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function primero(sql, params) {
  const rows = consultar(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

module.exports = { conectar, guardar, ejecutar, consultar, primero };
