const { conectar, ejecutar, consultar } = require('../src/database/connection');

(async () => {
  await conectar();

  // Map VENEZOLANO/COLOMBIANO to Víveres
  ejecutar("UPDATE productos SET categoria = 'Víveres' WHERE categoria IN ('VENEZOLANO', 'COLOMBIANO')");

  // Find medicine products
  const meds = consultar(
    "SELECT id, nombre FROM productos WHERE LOWER(nombre) LIKE '%acetaminofen%' OR LOWER(nombre) LIKE '%amoxicilina%' OR LOWER(nombre) LIKE '%ibuprofeno%' OR LOWER(nombre) LIKE '%medicamento%'"
  );
  console.log('Medicamentos encontrados:');
  for (const m of meds) {
    ejecutar("UPDATE productos SET categoria = 'Medicamentos' WHERE id = ?", [m.id]);
    console.log('  ' + m.nombre);
  }

  // Summary
  const cats = consultar('SELECT DISTINCT categoria, COUNT(*) as cnt FROM productos GROUP BY categoria ORDER BY cnt DESC');
  console.log('\nCategorias actualizadas:');
  cats.forEach(c => console.log('  ' + c.categoria + ': ' + c.cnt + ' productos'));
})();
