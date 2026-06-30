const { conectar, consultar, ejecutar } = require('../src/database/connection');

(async () => {
  await conectar();

  console.log('=== CORRIGIENDO COINCIDENCIAS INCORRECTAS ===\n');

  // 1. "Leche" was matched to chocolate bars (SAVOY CHOCOLATE CON LECHE, etc.)
  //    These are products whose name starts with "Leche" but barcode corresponds to chocolate
  const lecheProducts = consultar(
    "SELECT id, nombre, codigo_barras FROM productos WHERE nombre IN ('Leche', 'Leche (todas)') AND codigo_barras != ''"
  );
  for (const p of lecheProducts) {
    // Check what product this barcode belongs to in the Excel (newly inserted products)
    const barcodeProduct = consultar(
      "SELECT id, nombre FROM productos WHERE codigo_barras = ? AND id != ? AND precio_cop = 0",
      [p.codigo_barras, p.id]
    );
    if (barcodeProduct.length > 0) {
      // Check if the matched product contains chocolate/carre/savoy - not real milk
      const name = barcodeProduct[0].nombre.toLowerCase();
      if (name.includes('savoy') || name.includes('carre') || name.includes('chocolate') || name.includes('kron') || name.includes('cricri') || name.includes('flips')) {
        console.log('LIMPIANDO: ' + p.nombre + ' (id=' + p.id + ') -> barcode ' + p.codigo_barras + ' (matched to chocolate: "' + barcodeProduct[0].nombre + '")');
        ejecutar('UPDATE productos SET codigo_barras = ? WHERE id = ?', ['', p.id]);
      }
    }
  }

  // 2. "Chocolate MM" - likely wrong match
  const mm = consultar("SELECT id, nombre, codigo_barras FROM productos WHERE nombre = 'Chocolate MM' AND codigo_barras != ''");
  for (const p of mm) {
    console.log('LIMPIANDO: ' + p.nombre + ' (id=' + p.id + ') -> barcode ' + p.codigo_barras + ' (uncertain match)');
    ejecutar('UPDATE productos SET codigo_barras = ? WHERE id = ?', ['', p.id]);
  }

  // 3. "Pirulin Pequeño" should NOT get "PIRULIN CHOCOLATE Y AVELLANAS 60GR" barcode
  //    Let me check if it got wrongly assigned
  const pirulin = consultar(
    "SELECT id, nombre, codigo_barras FROM productos WHERE nombre LIKE '%Pirulin%' AND codigo_barras != ''"
  );
  console.log('\nPirulin products with barcodes:');
  for (const p of pirulin) {
    const other = consultar(
      "SELECT id, nombre FROM productos WHERE codigo_barras = ? AND id != ?",
      [p.codigo_barras, p.id]
    );
    console.log('  ' + p.nombre + ' -> ' + p.codigo_barras + (other.length > 0 ? ' (shared with: ' + other.map(o => o.nombre).join(', ') + ')' : ''));
  }

  // 4. Summary
  const conCodigo = consultar(
    "SELECT COUNT(*) as c FROM productos WHERE codigo_barras IS NOT NULL AND codigo_barras != ''"
  );
  const sinCodigo = consultar(
    "SELECT COUNT(*) as c FROM productos WHERE codigo_barras IS NULL OR codigo_barras = ''"
  );
  const total = consultar("SELECT COUNT(*) as c FROM productos");
  const oldProducts = consultar("SELECT COUNT(*) as c FROM productos WHERE precio_cop > 0");
  const newProducts = consultar("SELECT COUNT(*) as c FROM productos WHERE precio_cop = 0");

  console.log('\n=== ESTADO FINAL ===');
  console.log('Total productos: ' + total[0].c);
  console.log('Con codigo de barras: ' + conCodigo[0].c);
  console.log('Sin codigo de barras: ' + sinCodigo[0].c);
  console.log('Productos originales (con precio): ' + oldProducts[0].c);
  console.log('Nuevos del Excel (precio vacio): ' + newProducts[0].c);
})();
