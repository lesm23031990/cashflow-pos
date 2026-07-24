const path = require('path');
const fs = require('fs');
const os = require('os');

function crearDbTemp() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'barebare-test-'));
  const dbPath = path.join(tempDir, 'test.db');
  process.env.TEST_DB_PATH = dbPath;
  return tempDir;
}

function limpiarDbTemp(tempDir) {
  delete process.env.TEST_DB_PATH;
  if (tempDir) fs.rmSync(tempDir, { recursive: true, force: true });
}

async function iniciarApp() {
  const { conectar } = require('../src/database/connection');
  const { sembrar } = require('../src/database/seed');
  await conectar();
  await sembrar();
  const { app } = require('../src/app');
  return app;
}

module.exports = { crearDbTemp, limpiarDbTemp, iniciarApp };
