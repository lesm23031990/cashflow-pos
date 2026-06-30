const { conectar, consultar, ejecutar } = require('../src/database/connection');
const XLSX = require('xlsx');

async function main() {
  await conectar();

  // 1. Read Excel
  const wb = XLSX.readFile('C:\\Users\\Administrador\\Downloads\\Maestro de Inventario Bare Bare.xlsx');
  const raw = XLSX.utils.sheet_to_json(wb.Sheets['Inventario'], { header: 1 });

  // Normalize Excel: lowercase, remove extra spaces, build search index
  const excelItems = [];
  for (let i = 1; i < raw.length; i++) {
    const row = raw[i];
    if (!row || row.length < 2) continue;
    const codigo = String(row[0]).trim();
    const desc = String(row[1]).trim();
    if (!codigo || !desc) continue;
    const marca = row[2] ? String(row[2]).trim() : '';
    const categoria = row[3] ? String(row[3]).trim() : '';
    const norm = desc.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ');
    excelItems.push({ codigo, desc, marca, categoria, norm, words: new Set(norm.split(/\s+/).filter(w => w.length > 1)) });
  }
  console.log('Excel items:', excelItems.length);

  // 2. Get all DB products
  const dbProductos = consultar('SELECT id, nombre, codigo_barras, marca, categoria FROM productos ORDER BY nombre');

  let barcodeAssigned = 0;
  let newProducts = [];
  const usedBarcodes = new Set();

  // 3. Match: for each DB product, find the best Excel match
  for (const p of dbProductos) {
    // Skip if already has a valid barcode
    if (p.codigo_barras && p.codigo_barras.trim() && p.codigo_barras !== 'SIN CODIGO') {
      usedBarcodes.add(p.codigo_barras.trim());
      continue;
    }

    // Normalize DB name
    const dbName = p.nombre
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\([^)]*\)/g, '') // remove parenthetical notes
      .replace(/\s+/g, ' ')
      .trim();

    if (!dbName || dbName.length < 2) continue;

    const dbWords = new Set(dbName.split(/\s+/).filter(w => w.length > 1));
    if (dbWords.size === 0) continue;

    let bestMatch = null;
    let bestScore = 0;

    for (const ex of excelItems) {
      if (usedBarcodes.has(ex.codigo)) continue;

      // Count how many DB words appear in the Excel description
      let matchCount = 0;
      for (const w of dbWords) {
        if (ex.norm.includes(w)) matchCount++;
      }

      // Score: ratio of matched words vs total DB words
      const score = matchCount / dbWords.size;

      // Bonus if ALL DB words match
      const allMatch = matchCount === dbWords.size;

      if (allMatch && score > bestScore) {
        bestScore = score;
        bestMatch = ex;
      } else if (score >= 0.6 && matchCount >= 2 && score > bestScore) {
        bestScore = score;
        bestMatch = ex;
      }
    }

    if (bestMatch) {
      ejecutar('UPDATE productos SET codigo_barras = ? WHERE id = ?', [bestMatch.codigo, p.id]);
      usedBarcodes.add(bestMatch.codigo);
      barcodeAssigned++;
      console.log('MATCH: "' + p.nombre + '" <-> "' + bestMatch.desc + '" -> ' + bestMatch.codigo);
    } else {
      console.log('NO MATCH: "' + p.nombre + '"');
    }
  }

  // 4. Excel items not matched -> propose as new products
  const matchedBarcodes = new Set(
    consultar('SELECT codigo_barras FROM productos WHERE codigo_barras IS NOT NULL AND codigo_barras != "" AND codigo_barras != "SIN CODIGO"')
      .map(r => r.codigo_barras.trim())
  );

  for (const ex of excelItems) {
    if (!matchedBarcodes.has(ex.codigo)) {
      newProducts.push(ex);
    }
  }

  console.log('\n=== RESUMEN ===');
  console.log('Codigos asignados a productos existentes:', barcodeAssigned);
  console.log('Nuevos productos a insertar desde Excel:', newProducts.length);

  // Show first 30 new products
  console.log('\nPrimeros 30 nuevos productos:');
  newProducts.slice(0, 30).forEach((ex, i) => {
    console.log('  ' + (i+1) + '. ' + ex.desc + ' | ' + ex.codigo + ' | ' + ex.marca + ' | ' + ex.categoria);
  });

  if (newProducts.length > 30) {
    console.log('  ... y ' + (newProducts.length - 30) + ' mas');
  }

  console.log('\nPara insertar los nuevos productos ejecute:');
  console.log('  node scripts/insert_new_products.js');
}

main().catch(console.error);
