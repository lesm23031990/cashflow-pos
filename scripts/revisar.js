const { conectar, consultar, ejecutar } = require('../src/database/connection');

(async () => {
  await conectar();

  console.log('=== LECHE ===');
  const leche = consultar(
    "SELECT id, nombre, codigo_barras, precio_cop FROM productos WHERE nombre LIKE '%Leche%' AND codigo_barras != ''"
  );
  leche.forEach(p => console.log(p.id + ': "' + p.nombre + '" -> ' + p.codigo_barras + ' | $' + p.precio_cop));

  console.log('\n=== CHICHA ===');
  const chicha = consultar(
    "SELECT id, nombre, codigo_barras FROM productos WHERE nombre LIKE '%Chicha%' OR nombre LIKE '%chicha%'"
  );
  chicha.forEach(p => console.log(p.id + ': "' + p.nombre + '" -> ' + p.codigo_barras));

  console.log('\n=== CHOCOLATE MM ===');
  const mm = consultar(
    "SELECT id, nombre, codigo_barras FROM productos WHERE nombre = 'Chocolate MM'"
  );
  mm.forEach(p => console.log(p.id + ': "' + p.nombre + '" -> ' + p.codigo_barras));

  console.log('\n=== TE ===');
  const te = consultar(
    "SELECT id, nombre, codigo_barras FROM productos WHERE nombre LIKE '%T%' AND (nombre LIKE '%Te%' OR nombre LIKE '%t%') AND codigo_barras != ''"
  );
  te.forEach(p => console.log(p.id + ': "' + p.nombre + '" -> ' + p.codigo_barras));

  console.log('\n=== HALLS ===');
  const halls = consultar(
    "SELECT id, nombre, codigo_barras FROM productos WHERE nombre = 'Halls'"
  );
  halls.forEach(p => console.log(p.id + ': "' + p.nombre + '" -> ' + p.codigo_barras));

  console.log('\n=== MALTA CHIQUITA ===');
  const malta = consultar(
    "SELECT id, nombre, codigo_barras FROM productos WHERE nombre LIKE '%Malta%'"
  );
  malta.forEach(p => console.log(p.id + ': "' + p.nombre + '" -> ' + p.codigo_barras));

  console.log('\n=== MOJITO ===');
  const mojito = consultar(
    "SELECT id, nombre, codigo_barras FROM productos WHERE nombre = 'Mojito'"
  );
  mojito.forEach(p => console.log(p.id + ': "' + p.nombre + '" -> ' + p.codigo_barras));

  // Show all products grouped by barcode duplicates
  console.log('\n=== DUPLICATE BARCODES ===');
  const dups = consultar(
    "SELECT codigo_barras, COUNT(*) as cnt FROM productos WHERE codigo_barras != '' GROUP BY codigo_barras HAVING cnt > 1"
  );
  for (const d of dups) {
    const prods = consultar(
      "SELECT id, nombre, precio_cop FROM productos WHERE codigo_barras = ?",
      [d.codigo_barras]
    );
    console.log(d.codigo_barras + ' (' + d.cnt + 'x):');
    for (const p of prods) {
      console.log('  id=' + p.id + ' "' + p.nombre + '" $' + p.precio_cop);
    }
  }

  // Products left without barcode
  console.log('\n=== SIN CODIGO DE BARRAS ===');
  const sin = consultar(
    "SELECT id, nombre, precio_cop FROM productos WHERE codigo_barras IS NULL OR codigo_barras = '' ORDER BY nombre"
  );
  console.log('Total: ' + sin.length);
  sin.forEach(p => console.log('  id=' + p.id + ': "' + p.nombre + '" | $' + p.precio_cop));
})();
