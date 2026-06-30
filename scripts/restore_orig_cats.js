const { conectar, ejecutar, consultar } = require('../src/database/connection');

(async () => {
  await conectar();

  // Find products that were originally VENEZOLANO and are now Víveres
  // We need to look at the Excel source to know which ones were which
  // But actually, let's just provide an option: the user can assign these manually
  // For now, let me just show how many are under each category

  const cats = consultar(
    'SELECT categoria, COUNT(*) as cnt FROM productos GROUP BY categoria ORDER BY cnt DESC'
  );
  console.log('Categorias actuales:');
  cats.forEach(c => console.log('  ' + c.categoria + ': ' + c.cnt));
})();
