const { conectar, consultar, ejecutar } = require('../src/database/connection');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Common words to ignore in matching
const STOP_WORDS = new Set([
  'de', 'la', 'el', 'los', 'las', 'del', 'con', 'sin', 'y', 'e', 'o', 'a', 'en', 'por', 'para',
  'un', 'una', 'su', 'que', 'es', 'se', 'no', 'lo', 'le', 'al', 'x', 'gr', 'g', 'ml', 'l', 'kg',
  'cm', 'mm', 'mg', 'neto', 'aprox', 'aprox', 'unds', 'und', 'uds', 'ud', 'pcta', 'pct',
]);

// Products that already had correct barcodes before any auto-matching
const KNOWN_CORRECT = [
  { name: 'Aceite Coco 210 ml', barcode: '7700304927098' },
  { name: 'Agua Nevada 1,5 Litro', barcode: '7591127363503' },
  { name: 'Agua Nevada 355 mL', barcode: '7591127302540' },
  { name: 'Agua Nevada 600 mL', barcode: '7591127363800' },
  { name: 'Caroreña 1,75 L', barcode: '7591446001599' },
  { name: 'Chocolate savoy 15 gr', barcode: '7591016855690' },
  { name: 'dandy', barcode: '7702011040558' },
  { name: 'Festival Chocolate 50 gr', barcode: '7702025136759' },
  { name: 'Jugo El Valle 500 ml', barcode: '7591127501868' },
  { name: 'Milka', barcode: '7622210956163' },
  { name: 'Nucita', barcode: '7591675000370' },
  { name: 'Ovomaltina', barcode: '7591039000565' },
  { name: 'Palitos', barcode: '805579523116' },
  { name: 'Pepito', barcode: '7593251000774' },
  { name: 'Pirulin 155 gr', barcode: '7591675000424' },
  { name: 'Taki', barcode: '7500810027400' },
  { name: 'Toblerone 35g', barcode: '76145759' },
  { name: 'Toblerone 50g', barcode: '76145513' },
  { name: 'Toronto', barcode: '7591016161111' },
];

function normalize(s) {
  return s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getSignificantWords(s) {
  const norm = normalize(s);
  return norm.split(/\s+/).filter(w => w.length > 1 && !STOP_WORDS.has(w));
}

function wordOverlap(wordsA, wordsB) {
  const setA = new Set(wordsA);
  const setB = new Set(wordsB);
  let common = 0;
  for (const w of setA) {
    if (setB.has(w)) common++;
  }
  return {
    common,
    ratioA: setA.size > 0 ? common / setA.size : 0,
    ratioB: setB.size > 0 ? common / setB.size : 0,
    avg: setA.size > 0 && setB.size > 0 ? common / Math.max(setA.size, setB.size) : 0,
  };
}

async function main() {
  await conectar();

  // Backup DB
  const dbPath = path.join(__dirname, '..', 'data', 'precios.db');
  const backupPath = path.join(__dirname, '..', 'data', 'precios.db.backup');
  fs.copyFileSync(dbPath, backupPath);
  console.log('Backup creado: data/precios.db.backup');

  // Clear all barcodes first
  ejecutar('UPDATE productos SET codigo_barras = ?', ['']);
  console.log('Codigos de barras limpiados.\n');

  // Read Excel
  const wb = XLSX.readFile('C:\\Users\\Administrador\\Downloads\\Maestro de Inventario Bare Bare.xlsx');
  const raw = XLSX.utils.sheet_to_json(wb.Sheets['Inventario'], { header: 1 });

  const excelItems = [];
  for (let i = 1; i < raw.length; i++) {
    const row = raw[i];
    if (!row || row.length < 2) continue;
    const codigo = String(row[0]).trim();
    const desc = String(row[1]).trim();
    if (!codigo || !desc || codigo === 'SIN CODIGO') continue;
    const marca = row[2] ? String(row[2]).trim() : '';
    const cat = row[3] ? String(row[3]).trim() : '';
    excelItems.push({
      codigo, desc, marca, cat,
      words: getSignificantWords(desc),
      norm: normalize(desc),
    });
  }
  console.log('Productos en Excel con codigo valido:', excelItems.length);

  // Restore known correct barcodes
  console.log('\n=== RESTAURANDO CODIGOS CORRECTOS CONOCIDOS ===');
  for (const kc of KNOWN_CORRECT) {
    const rows = consultar('SELECT id FROM productos WHERE nombre = ?', [kc.name]);
    if (rows.length > 0) {
      ejecutar('UPDATE productos SET codigo_barras = ? WHERE id = ?', [kc.barcode, rows[0].id]);
      console.log('  OK: ' + kc.name + ' -> ' + kc.barcode);
    } else {
      console.log('  NO ENCONTRADO: ' + kc.name);
    }
  }

  // Match remaining DB products against Excel
  const dbProductos = consultar('SELECT id, nombre FROM productos WHERE codigo_barras IS NULL OR codigo_barras = ?', ['']);
  const usedBarcodes = new Set(KNOWN_CORRECT.map(k => k.barcode));
  let matched = 0;

  console.log('\n=== BUSCANDO COINCIDENCIAS EN EXCEL ===');
  for (const p of dbProductos) {
    const dbWords = getSignificantWords(p.nombre);
    if (dbWords.length === 0) continue;

    let bestMatch = null;
    let bestScore = 0;

    for (const ex of excelItems) {
      if (usedBarcodes.has(ex.codigo)) continue;
      const overlap = wordOverlap(dbWords, ex.words);
      // Must match at least 2 significant words OR all DB words
      const qualifies = (overlap.common >= 2 && overlap.ratioA >= 0.5) || overlap.ratioA >= 0.8;
      if (qualifies && overlap.avg > bestScore) {
        bestScore = overlap.avg;
        bestMatch = ex;
      }
    }

    if (bestMatch) {
      ejecutar('UPDATE productos SET codigo_barras = ? WHERE id = ?', [bestMatch.codigo, p.id]);
      usedBarcodes.add(bestMatch.codigo);
      matched++;
      console.log('  MATCH: "' + p.nombre + '" <-> "' + bestMatch.desc + '" (' + bestMatch.codigo + ')');
    }
  }

  // Unmatched Excel products -> insert as new
  const allDbBarcodes = new Set(
    consultar('SELECT codigo_barras FROM productos WHERE codigo_barras IS NOT NULL AND codigo_barras != ?', [''])
      .map(r => r.codigo_barras.trim())
  );

  const newProducts = excelItems.filter(ex => !allDbBarcodes.has(ex.codigo));

  console.log('\n=== NUEVOS PRODUCTOS A INSERTAR ===');
  let inserted = 0;
  for (const np of newProducts) {
    ejecutar(
      'INSERT INTO productos (nombre, codigo_barras, precio_cop, marca, categoria) VALUES (?, ?, 0, ?, ?)',
      [np.desc, np.codigo, np.marca, np.cat || 'Otra']
    );
    inserted++;
  }

  console.log('\n=== RESUMEN FINAL ===');
  console.log('Restaurados (conocidos): ' + KNOWN_CORRECT.length);
  console.log('Coincidencias nuevas: ' + matched);
  console.log('Nuevos productos insertados desde Excel: ' + inserted);

  const total = consultar('SELECT COUNT(*) as c FROM productos');
  const conCodigo = consultar("SELECT COUNT(*) as c FROM productos WHERE codigo_barras IS NOT NULL AND codigo_barras != ''");
  console.log('Total productos en BD ahora: ' + total[0].c);
  console.log('Con codigo de barras: ' + conCodigo[0].c);

  console.log('\nScript completado. Backup disponible en data/precios.db.backup');
}

main().catch(console.error);
