const { conectar, ejecutar, consultar } = require('../src/database/connection');

(async () => {
  await conectar();
  ejecutar('UPDATE productos SET codigo_barras = ? WHERE 1=1', ['']);
  const restantes = consultar('SELECT COUNT(*) as c FROM productos WHERE codigo_barras IS NOT NULL AND codigo_barras != ?', ['']);
  console.log('Barcodes cleared. Remaining with barcode:', restantes[0].c);
})();
