const { conectar, consultar } = require('../src/database/connection');

(async () => {
  await conectar();
  const conBC = consultar(
    'SELECT id, nombre, codigo_barras FROM productos WHERE codigo_barras IS NOT NULL AND codigo_barras != "" AND codigo_barras != "SIN CODIGO"'
  );
  console.log('Productos con codigo de barras valido:', conBC.length);
  conBC.forEach(p => console.log(p.id + ': ' + p.nombre + ' -> ' + p.codigo_barras));
})();
