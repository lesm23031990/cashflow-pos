const { conectar, consultar, ejecutar } = require('../src/database/connection');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const STOP_WORDS = new Set([
  'de', 'la', 'el', 'los', 'las', 'del', 'con', 'sin', 'y', 'e', 'o', 'a', 'en', 'por', 'para',
  'un', 'una', 'su', 'que', 'es', 'se', 'no', 'lo', 'le', 'al', 'x',
]);

function normalize(s) {
  return s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getWords(s) {
  return normalize(s).split(/\s+/).filter(w => w.length > 1 && !STOP_WORDS.has(w));
}

function parsePrice(val, espec) {
  if (val === undefined || val === null || val === '') return null;
  const str = String(val).trim().replace(/[^0-9.,]/g, '');
  if (str === '') return null;
  const isUsd = espec && /usd/i.test(espec);
  const num = parseFloat(str.replace(/,/g, ''));
  return isNaN(num) ? null : { value: num, isUsd };
}

// Extract size info from product name, returns normalized size in ml or grams
function extractSize(s) {
  const lower = s.toLowerCase();
  // Fraction patterns first to avoid "2 LT" capturing in "1/2 LT"
  const fracMatch = lower.match(/(\d+)\s*\/\s*(\d+)\s*(?:l\b|lt\b|litro|litros)/);
  if (fracMatch) {
    return Math.round(parseFloat(fracMatch[1]) / parseFloat(fracMatch[2]) * 1000);
  }

  // Non-fraction patterns - use the LAST (usually most specific) match
  const patterns = [
    { re: /(\d+)\s*(?:ml|mls|mililitros)\b/, mul: 1, unit: 'ml' },
    { re: /(\d+)\s*(?:cc|cm3|cm)\b/, mul: 1, unit: 'ml' },
    { re: /(\d+(?:[.,]\d+)?)\s*(?:l\b|lt\b|lts\b|litro|litros)/, mul: 1000, unit: 'ml' },
    { re: /(\d+)\s*(?:kg|kgs|kilo|kilos)\b/, mul: 1000, unit: 'g' },
    { re: /(\d+)\s*(?:gr|grs|g\b|gramos)\b/, mul: 1, unit: 'g' },
    { re: /(\d+)\s*(?:onz|oz)\b/, mul: 28.35, unit: 'g' },
  ];

  let lastVal = null;
  for (const p of patterns) {
    const m = lower.match(p.re);
    if (m) {
      lastVal = Math.round(parseFloat(m[1].replace(',', '.')) * p.mul);
    }
  }

  return lastVal;
}

function sizesAreCompatible(sizeA, sizeB, unitA, unitB) {
  if (sizeA === null || sizeB === null) return true; // no size info = can't verify
  const ratio = Math.min(sizeA, sizeB) / Math.max(sizeA, sizeB);
  return ratio >= 0.8; // allow 20% tolerance for rounding
}

async function main() {
  await conectar();

  const dbPath = path.join(__dirname, '..', 'data', 'precios.db');
  const backupPath = path.join(__dirname, '..', 'data', 'precios.db.backup');
  fs.copyFileSync(dbPath, backupPath);
  console.log('Backup creado: data/precios.db.backup\n');

  // Read Excel
  const excelDir = 'C:\\Users\\Administrador\\Downloads';
  const excelFiles = require('fs').readdirSync(excelDir).filter(f => /Lista.*Precios.*Consolidada/i.test(f));
  if (excelFiles.length === 0) { console.error('No se encontro el archivo Excel en Downloads'); process.exit(1); }
  const excelPath = require('path').join(excelDir, excelFiles[0]);
  const wb = XLSX.readFile(excelPath);
  const raw = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });

  const excelItems = [];
  for (let i = 1; i < raw.length; i++) {
    const row = raw[i];
    if (!row) continue;
    const desc = String(row[1] || '').trim();
    if (!desc) continue;
    const espec = row[3] !== undefined ? String(row[3]).trim() : '';
    excelItems.push({
      codigo: row[0] !== undefined ? String(row[0]).trim() : '',
      desc,
      espec,
      precio: parsePrice(row[2], row[3] !== undefined ? String(row[3]).trim() : ''),
      norm: normalize(desc),
      words: getWords(desc),
      size: extractSize(desc),
    });
  }
  console.log('Productos en Excel: ' + excelItems.length + '\n');

  // Load DB products
  const dbProductos = consultar(
    'SELECT id, nombre, codigo_barras, precio_cop FROM productos'
  ).map(p => ({
    ...p,
    norm: normalize(p.nombre),
    words: getWords(p.nombre),
    size: extractSize(p.nombre),
  }));

  const matchMap = new Map();
  const usedDbIds = new Set();
  const usedExcelIdx = new Set();

  // STEP 1: Barcode match
  console.log('=== PASO 1: CODIGO DE BARRAS ===');
  for (let ei = 0; ei < excelItems.length; ei++) {
    const ex = excelItems[ei];
    const codeClean = ex.codigo.replace(/[^0-9]/g, '');
    if (codeClean.length < 12) continue;
    const found = dbProductos.find(p => p.codigo_barras === codeClean && !usedDbIds.has(p.id));
    if (found) {
      usedDbIds.add(found.id);
      usedExcelIdx.add(ei);
      matchMap.set(ei, { db: found, type: 'BARCODE' });
      console.log('  ' + ex.desc + ' -> ' + found.nombre);
    }
  }
  console.log('  Total: ' + matchMap.size + '\n');

  // STEP 2: Internal code match
  console.log('=== PASO 2: CODIGO INTERNO ===');
  let step2 = 0;
  for (let ei = 0; ei < excelItems.length; ei++) {
    if (usedExcelIdx.has(ei)) continue;
    const ex = excelItems[ei];
    if (ex.codigo === '' || ex.codigo === '-') continue;
    const cc = ex.codigo.replace(/[^0-9]/g, '');
    if (cc.length >= 12) continue;
    const found = dbProductos.find(p => p.codigo_barras === ex.codigo && !usedDbIds.has(p.id));
    if (found) {
      usedDbIds.add(found.id);
      usedExcelIdx.add(ei);
      matchMap.set(ei, { db: found, type: 'CODE' });
      step2++;
      console.log('  ' + ex.desc + ' (' + ex.codigo + ') -> ' + found.nombre);
    }
  }
  console.log('  Total: ' + step2 + '\n');

  // STEP 3: Exact name match (normalized)
  console.log('=== PASO 3: NOMBRE EXACTO ===');
  let step3 = 0;
  for (let ei = 0; ei < excelItems.length; ei++) {
    if (usedExcelIdx.has(ei)) continue;
    const ex = excelItems[ei];
    const found = dbProductos.find(p => p.norm === ex.norm && !usedDbIds.has(p.id));
    if (found) {
      usedDbIds.add(found.id);
      usedExcelIdx.add(ei);
      matchMap.set(ei, { db: found, type: 'EXACT_NAME' });
      step3++;
      console.log('  ' + ex.desc + ' -> ' + found.nombre);
    }
  }
  console.log('  Total: ' + step3 + '\n');

  // STEP 4: Fuzzy match with SIZE verification
  console.log('=== PASO 4: COINCIDENCIA POR SIMILITUD + TAMAÑO ===');
  let step4 = 0;

  for (let ei = 0; ei < excelItems.length; ei++) {
    if (usedExcelIdx.has(ei)) continue;
    const ex = excelItems[ei];
    if (ex.words.length < 2) continue;

    let best = null;
    let bestScore = 0;

    for (const p of dbProductos) {
      if (usedDbIds.has(p.id)) continue;
      if (p.words.length < 2) continue;

      const setA = new Set(ex.words);
      const setB = new Set(p.words);
      let common = 0;
      for (const w of setA) if (setB.has(w)) common++;
      const lenA = setA.size, lenB = setB.size;
      const union = new Set([...setA, ...setB]);
      const dice = 2 * common / (lenA + lenB);
      const jaccard = common / union.size;
      const ratioA = common / lenA;
      const ratioB = common / lenB;

      if (dice < 0.5 || common < 2) continue;

      // Size compatibility: if both have size info, it MUST match
      if (ex.size !== null && p.size !== null) {
        const sizeRatio = Math.min(ex.size, p.size) / Math.max(ex.size, p.size);
        if (sizeRatio < 0.8) continue;
      }

      // If only one has size info, require higher word overlap
      const sizeMiss = (ex.size !== null) !== (p.size !== null);
      const minDice = sizeMiss ? 0.7 : 0.55;
      const minJaccard = sizeMiss ? 0.55 : 0.4;
      const minCommon = sizeMiss ? 3 : 2;
      const minRatio = sizeMiss ? 0.6 : 0.4;

      if (dice >= minDice && jaccard >= minJaccard && common >= minCommon && ratioA >= minRatio && ratioB >= minRatio) {
        const score = dice + (ex.size !== null && p.size !== null && Math.min(ex.size,p.size)/Math.max(ex.size,p.size) > 0.95 ? 0.1 : 0);
        if (score > bestScore) {
          bestScore = score;
          best = { db: p, dice, jaccard, common };
        }
      }
    }

    if (best) {
      usedDbIds.add(best.db.id);
      usedExcelIdx.add(ei);
      matchMap.set(ei, { db: best.db, type: 'FUZZY' });
      step4++;
      const szInfo = (ex.size !== null ? ex.size : '?') + ' vs ' + (best.db.size !== null ? best.db.size : '?');
      console.log('  ' + ex.desc + ' -> ' + best.db.nombre + ' [dice=' + best.dice.toFixed(2) + ', size=' + szInfo + ']');
    }
  }
  console.log('  Total: ' + step4 + '\n');

  // SUMMARY
  console.log('=== RESUMEN DE COINCIDENCIAS ===');
  console.log('BARCODE: ' + (matchMap.size - step2 - step3 - step4));
  console.log('CODE: ' + step2);
  console.log('EXACT_NAME: ' + step3);
  console.log('FUZZY (con verificación de tamaño): ' + step4);
  console.log('Total a actualizar: ' + matchMap.size);
  console.log('Nuevos a insertar: ' + (excelItems.length - usedExcelIdx.size) + '\n');

  // UPDATE
  console.log('=== ACTUALIZANDO PRECIOS ===');
  let updated = 0;
  let skippedNoPrice = 0;
  for (const [ei, m] of matchMap) {
    const ex = excelItems[ei];
    if (ex.precio !== null) {
      const newPrice = ex.precio.isUsd ? Math.round(ex.precio.value * 4500) : Math.round(ex.precio.value);
      ejecutar('UPDATE productos SET precio_cop = ? WHERE id = ?', [newPrice, m.db.id]);
      updated++;
      const diff = newPrice !== m.db.precio_cop ? ' (' + m.db.precio_cop + ' -> ' + newPrice + ')' : ' (sin cambios)';
      console.log('  [' + m.type + '] ' + ex.desc + diff);
    } else {
      skippedNoPrice++;
      console.log('  [SIN PRECIO] ' + ex.desc);
    }
  }
  console.log('  Actualizados: ' + updated + ', Sin precio: ' + skippedNoPrice + '\n');

  // INSERT NEW
  console.log('=== NUEVOS PRODUCTOS ===');
  let inserted = 0;
  for (let ei = 0; ei < excelItems.length; ei++) {
    if (usedExcelIdx.has(ei)) continue;
    const ex = excelItems[ei];
    const newPrice = ex.precio ? (ex.precio.isUsd ? Math.round(ex.precio.value * 4500) : Math.round(ex.precio.value)) : 0;
    ejecutar(
      'INSERT INTO productos (nombre, codigo_barras, precio_cop, marca, categoria, stock, estado) VALUES (?, ?, ?, ?, ?, 0, ?)',
      [ex.desc, ex.codigo, newPrice, '', 'Otra', 'disponible']
    );
    inserted++;
    const pStr = ex.precio ? (ex.precio.isUsd ? 'USD ' + ex.precio.value + '=' + newPrice : '' + newPrice) : 'SIN PRECIO';
    console.log('  ' + ex.desc + ' | ' + ex.codigo + ' | ' + pStr);
  }
  console.log('  Insertados: ' + inserted + '\n');

  // FINAL
  const total = consultar('SELECT COUNT(*) as c FROM productos');
  console.log('Total productos en BD ahora: ' + total[0].c);
  console.log('Script completado. Backup: data/precios.db.backup');
}

main().catch(console.error);
