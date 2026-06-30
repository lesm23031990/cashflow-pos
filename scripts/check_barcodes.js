const { conectar, consultar, ejecutar } = require('../src/database/connection');
const XLSX = require('xlsx');
const path = require('path');

async function main() {
  await conectar();

  // 1. Read Excel
  const wb = XLSX.readFile('C:\\Users\\Administrador\\Downloads\\Maestro de Inventario Bare Bare.xlsx');
  const data = XLSX.utils.sheet_to_json(wb.Sheets['Inventario'], { header: 1 });

  // Build map from description -> barcode
  const excelMap = new Map();
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 2) continue;
    const codigo = String(row[0]).trim();
    const descripcion = String(row[1]).trim().toLowerCase();
    if (codigo && descripcion) {
      excelMap.set(descripcion, { codigo, marca: row[2] ? String(row[2]).trim() : '', categoria: row[3] ? String(row[3]).trim() : '' });
    }
  }
  console.log('Productos en Excel con código:', excelMap.size);

  // 2. Get DB products
  const dbProductos = consultar('SELECT id, nombre, codigo_barras, marca, categoria FROM productos ORDER BY nombre');
  console.log('Productos en BD:', dbProductos.length);

  let matched = 0;
  let barcodeAdded = 0;
  let newProducts = 0;

  // 3. Try to match each DB product by name to Excel
  for (const p of dbProductos) {
    const nombre = p.nombre.trim().toLowerCase();
    const excelMatch = excelMap.get(nombre);
    if (excelMatch) {
      matched++;
      const needsBarcode = !p.codigo_barras || !p.codigo_barras.trim();
      if (needsBarcode) {
        ejecutar('UPDATE productos SET codigo_barras = ? WHERE id = ?', [excelMatch.codigo, p.id]);
        barcodeAdded++;
        console.log('  BARCODE ADDED: ' + p.nombre + ' -> ' + excelMatch.codigo);
      }
      excelMap.delete(nombre); // remove matched
    }
  }

  // 4. Try fuzzy matching for remaining DB products without barcode
  const noBarcode = dbProductos.filter(p => !p.codigo_barras || !p.codigo_barras.trim());
  for (const p of noBarcode) {
    if (matched >= dbProductos.length) break;
    const nombre = p.nombre.trim().toLowerCase();
    // Try to find a partial match in remaining excel entries
    let bestMatch = null;
    let bestScore = 0;
    for (const [desc, info] of excelMap) {
      if (nombre.includes(desc) || desc.includes(nombre)) {
        const score = Math.max(nombre.length, desc.length);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = { desc, info };
        }
      }
    }
    if (bestMatch) {
      matched++;
      ejecutar('UPDATE productos SET codigo_barras = ? WHERE id = ?', [bestMatch.info.codigo, p.id]);
      barcodeAdded++;
      console.log('  FUZZY MATCH: ' + p.nombre + ' <-> ' + bestMatch.desc + ' -> ' + bestMatch.info.codigo);
      excelMap.delete(bestMatch.desc);
    }
  }

  // 5. Remaining Excel entries -> insert as new products (with empty price)
  console.log('\nProductos del Excel no encontrados en BD:', excelMap.size);
  let count = 0;
  for (const [desc, info] of excelMap) {
    if (count >= 20) {
      console.log('  ... y ' + (excelMap.size - 20) + ' más');
      break;
    }
    console.log('  NUEVO: ' + desc + ' | codigo: ' + info.codigo + ' | marca: ' + info.marca + ' | cat: ' + info.categoria);
    count++;
  }

  console.log('\n--- RESUMEN ---');
  console.log('Match exacto/parcial en BD:', matched);
  console.log('Códigos de barras asignados:', barcodeAdded);
  console.log('Nuevos productos a insertar:', excelMap.size);

  // Ask for confirmation before inserting
  console.log('\nPara insertar los nuevos productos, ejecute este script con: node scripts/insert_new_products.js');
}

main().catch(console.error);
