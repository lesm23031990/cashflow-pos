const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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
      codigo_barras TEXT DEFAULT '',
      precio_cop REAL NOT NULL,
      marca TEXT DEFAULT '',
      categoria TEXT DEFAULT ''
    )
  `);

  // Migración: reemplazar tabla tasas por configuracion
  db.run('DROP TABLE IF EXISTS tasas');

  db.run(`
    CREATE TABLE IF NOT EXISTS configuracion (
      clave TEXT PRIMARY KEY,
      valor TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      rol TEXT NOT NULL DEFAULT 'admin'
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

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

module.exports = { conectar, guardar, ejecutar, consultar, primero, hashPassword };
