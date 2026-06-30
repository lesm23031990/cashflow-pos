const { conectar, consultar, ejecutar } = require('../src/database/connection');
const XLSX = require('xlsx');

(async () => {
  await conectar();

  // 1. Clear wrong "Leche" barcodes (matched to chocolate bars)
  const badBarcodes = [];
  const leche = consultar(
    "SELECT id, nombre, codigo_barras FROM productos WHERE nombre = 'Leche' AND codigo_barras != ''"
  );
  for (const p of leche) {
    badBarcodes.push(p.codigo_barras);
    console.log('LIMPIANDO: ' + p.nombre + ' (id=' + p.id + ') -> barcode ' + p.codigo_barras);
    ejecutar('UPDATE productos SET codigo_barras = ? WHERE id = ?', ['', p.id]);
  }

  // 2. Find the Excel products with these barcodes and insert them
  const wb = XLSX.readFile('C:\\Users\\Administrador\\Downloads\\Maestro de Inventario Bare Bare.xlsx');
  const raw = XLSX.utils.sheet_to_json(wb.Sheets['Inventario'], { header: 1 });

  let inserted = 0;
  for (let i = 1; i < raw.length; i++) {
    const row = raw[i];
    if (!row || row.length < 2) continue;
    const codigo = String(row[0]).trim();
    const desc = String(row[1]).trim();
    if (!codigo || !desc || codigo === 'SIN CODIGO') continue;
    
    if (badBarcodes.includes(codigo)) {
      const marca = row[2] ? String(row[2]).trim() : '';
      const cat = row[3] ? String(row[3]).trim() : 'Otra';
      
      // Check if already exists in DB
      const exist = consultar('SELECT id FROM productos WHERE codigo_barras = ?', [codigo]);
      if (exist.length === 0) {
        ejecutar(
          'INSERT INTO productos (nombre, codigo_barras, precio_cop, marca, categoria) VALUES (?, ?, 0, ?, ?)',
          [desc, codigo, marca, cat]
        );
        console.log('INSERTADO: ' + desc + ' | ' + codigo);
        inserted++;
      }
    }
  }

  console.log('\nInsertados nuevos desde Excel: ' + inserted);

  // Final summary
  const conCodigo = consultar(
    "SELECT COUNT(*) as c FROM productos WHERE codigo_barras IS NOT NULL AND codigo_barras != ''"
  );
  const sinCodigo = consultar(
    "SELECT COUNT(*) as c FROM productos WHERE codigo_barras IS NULL OR codigo_barras = ''"
  );
  console.log('\nTotal: ' + (conCodigo[0].c + sinCodigo[0].c));
  console.log('Con codigo: ' + conCodigo[0].c);
  console.log('Sin codigo: ' + sinCodigo[0].c);
})();
