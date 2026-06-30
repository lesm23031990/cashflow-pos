const { conectar, consultar } = require('../src/database/connection');

(async () => {
  await conectar();

  // Check Leche products
  const leche = consultar(
    "SELECT id, nombre, codigo_barras, precio_cop FROM productos WHERE nombre LIKE '%Leche%' AND codigo_barras != '' ORDER BY id"
  );
  console.log('=== PRODUCTOS LECHE CON CODIGO ===');
  for (const p of leche) {
    const other = consultar(
      "SELECT id, nombre, precio_cop FROM productos WHERE codigo_barras = ? AND id != ?",
      [p.codigo_barras, p.id]
    );
    console.log(p.id + ': "' + p.nombre + '" -> ' + p.codigo_barras + ' | $' + p.precio_cop);
    if (other.length > 0) {
      console.log('  Comparte codigo con:');
      other.forEach(o => console.log('    ' + o.id + ': "' + o.nombre + '" $' + o.precio_cop));
    }
  }
})();
