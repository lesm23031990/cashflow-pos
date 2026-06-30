const { conectar, consultar, ejecutar } = require('../src/database/connection');

(async () => {
  await conectar();

  // 1. Fix "Leche" matched to chocolate products (clear wrong barcodes)
  const lecheMatches = consultar(
    "SELECT id, nombre, codigo_barras FROM productos WHERE nombre IN ('Leche', 'Leche (todas)') AND codigo_barras != ''"
  );
  console.log('=== LECHE (posiblemente mal) ===');
  for (const p of lecheMatches) {
    // Check if the barcode corresponds to a chocolate product
    const ex = consultar(
      "SELECT id, nombre FROM productos WHERE codigo_barras = ? AND nombre != ? AND nombre NOT LIKE '%Leche%'",
      [p.codigo_barras, p.nombre]
    );
    // Actually this approach is flawed. Instead, let me check what product names have this barcode
    const allWithBarcode = consultar(
      "SELECT id, nombre FROM productos WHERE codigo_barras = ? AND id != ?",
      [p.codigo_barras, p.id]
    );
    console.log('  ' + p.nombre + ' (id=' + p.id + ') -> ' + p.codigo_barras);
    if (allWithBarcode.length > 0) {
      console.log('    Otros productos con este mismo codigo:');
      for (const o of allWithBarcode) {
        console.log('      - id=' + o.id + ': ' + o.nombre);
      }
    }
  }

  // 2. Show all products that have duplicate barcodes
  console.log('\n=== CODIGOS DE BARRAS DUPLICADOS ===');
  const dups = consultar(
    "SELECT codigo_barras, COUNT(*) as cnt FROM productos WHERE codigo_barras != '' GROUP BY codigo_barras HAVING cnt > 1"
  );
  for (const d of dups) {
    const prods = consultar(
      "SELECT id, nombre, codigo_barras, precio_cop FROM productos WHERE codigo_barras = ?", [d.codigo_barras]
    );
    console.log('  Codigo ' + d.codigo_barras + ' (' + d.cnt + ' productos):');
    for (const p of prods) {
      console.log('    id=' + p.id + ': "' + p.nombre + '" precio=' + p.precio_cop);
    }
  }

  // 3. Show all products with their barcodes to review
  console.log('\n=== TODOS LOS PRODUCTOS CON CODIGO ===');
  const todos = consultar(
    "SELECT id, nombre, codigo_barras, precio_cop, marca, categoria FROM productos WHERE codigo_barras != '' ORDER BY nombre"
  );
  for (const p of todos) {
    console.log(p.id + ': ' + p.nombre + ' | BC: ' + p.codigo_barras + ' | $' + p.precio_cop);
  }

  // 4. Products WITHOUT barcode
  console.log('\n=== PRODUCTOS SIN CODIGO DE BARRAS ===');
  const sinCodigo = consultar(
    "SELECT id, nombre, precio_cop FROM productos WHERE codigo_barras IS NULL OR codigo_barras = '' ORDER BY nombre"
  );
  console.log('Total: ' + sinCodigo.length);
  for (const p of sinCodigo) {
    console.log('  id=' + p.id + ': ' + p.nombre + ' | $' + p.precio_cop);
  }
})();
