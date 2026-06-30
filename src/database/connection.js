const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, '..', '..', 'data', 'precios.db');

let SQL = null;
let db = null;

async function conectar() {
  if (!SQL) SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA foreign_keys = ON');

  db.run(`
    CREATE TABLE IF NOT EXISTS metodos_pago (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE
    )
  `);

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

  db.run(`
    CREATE TABLE IF NOT EXISTS tasas (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      usd REAL NOT NULL DEFAULT 3500,
      ves REAL NOT NULL DEFAULT 4.70
    )
  `);

  db.run('INSERT OR IGNORE INTO tasas (id, usd, ves) VALUES (1, 3500, 4.70)');

  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      rol TEXT NOT NULL DEFAULT 'admin'
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      documento TEXT DEFAULT '',
      telefono TEXT DEFAULT '',
      direccion TEXT DEFAULT ''
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS facturas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_id INTEGER NOT NULL,
      fecha TEXT NOT NULL,
      moneda TEXT NOT NULL DEFAULT 'COP',
      tasa_usd REAL NOT NULL DEFAULT 3500,
      tasa_ves REAL NOT NULL DEFAULT 4.70,
      subtotal REAL NOT NULL DEFAULT 0,
      descuento REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      status TEXT DEFAULT 'en espera',
      metodo_pago TEXT DEFAULT '',
      FOREIGN KEY (cliente_id) REFERENCES clientes(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS factura_detalles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      factura_id INTEGER NOT NULL,
      producto_id INTEGER NOT NULL,
      producto_nombre TEXT NOT NULL,
      cantidad REAL NOT NULL DEFAULT 1,
      precio_unitario REAL NOT NULL,
      subtotal REAL NOT NULL,
      FOREIGN KEY (factura_id) REFERENCES facturas(id) ON DELETE CASCADE,
      FOREIGN KEY (producto_id) REFERENCES productos(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS metodos_pago (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS cierres_caja (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha_inicio TEXT NOT NULL,
      fecha_fin TEXT NOT NULL,
      total_ventas REAL NOT NULL DEFAULT 0,
      total_descuentos REAL NOT NULL DEFAULT 0,
      cantidad_facturas INTEGER NOT NULL DEFAULT 0,
      resumen_metodos_pago TEXT DEFAULT '{}',
      created_at TEXT NOT NULL
    )
  `);

  // Migraciones post-creación (para bases existentes)
  try { db.run("ALTER TABLE facturas ADD COLUMN status TEXT DEFAULT 'en espera'"); } catch(e) {}
  try { db.run("ALTER TABLE facturas ADD COLUMN metodo_pago TEXT DEFAULT ''"); } catch(e) {}
  try { db.run("ALTER TABLE facturas ADD COLUMN cierre_id INTEGER DEFAULT NULL"); } catch(e) {}
  try { db.run("ALTER TABLE facturas ADD COLUMN nombre_extra TEXT DEFAULT ''"); } catch(e) {}
  try { db.run("ALTER TABLE productos ADD COLUMN codigo_barras TEXT DEFAULT ''"); } catch(e) {}
  try { db.run("ALTER TABLE productos ADD COLUMN marca TEXT DEFAULT ''"); } catch(e) {}
  try { db.run("ALTER TABLE productos ADD COLUMN categoria TEXT DEFAULT ''"); } catch(e) {}

  guardar();
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
  if (!fs.existsSync(DB_PATH)) return [];
  const buffer = fs.readFileSync(DB_PATH);
  const tempDb = new SQL.Database(buffer);
  const stmt = tempDb.prepare(sql);
  if (params) stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  tempDb.close();
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
