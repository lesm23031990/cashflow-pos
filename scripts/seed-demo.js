const { conectar, consultar, ejecutar, primero } = require('../server/database/connection');

const PRODUCTOS = [
  ["Lata Grande", 3500, "Gen\u00e9rico", "Cervezas y Bebidas"],
  ["Bandeja de 24 unidades (lata grande)", 77000, "Gen\u00e9rico", "Cervezas y Bebidas"],
  ["Lata Peque\u00f1a", 2800, "Gen\u00e9rico", "Cervezas y Bebidas"],
  ["La bandeja lata peque\u00f1a", 64000, "Gen\u00e9rico", "Cervezas y Bebidas"],
  ["Soda Pl\u00e1stica", 4000, "Gen\u00e9rico", "Cervezas y Bebidas"],
  ["Soda Lata", 4800, "Gen\u00e9rico", "Cervezas y Bebidas"],
  ["Agua Saborizada", 4500, "Gen\u00e9rico", "Cervezas y Bebidas"],
  ["Malta Chiquita (Retornable)", 2500, "Gen\u00e9rico", "Cervezas y Bebidas"],
  ["Cerveza negra, blanca, azul", 2500, "Gen\u00e9rico", "Cervezas y Bebidas"],
  ["Cerveza Verde", 3000, "Gen\u00e9rico", "Cervezas y Bebidas"],
  ["Caja de Negra, light", 70000, "Gen\u00e9rico", "Cervezas y Bebidas"],
  ["Caja de Solera Azul", 70000, "Solera", "Cervezas y Bebidas"],
  ["Caja de Solera Verde", 78000, "Solera", "Cervezas y Bebidas"],
  ["Tobo de Cerveza (Negra, Azul, Light)", 20000, "Gen\u00e9rico", "Cervezas y Bebidas"],
  ["Malta 1 1/2 Litro", 6500, "Gen\u00e9rico", "Cervezas y Bebidas"],
  ["Yogurth Peque\u00f1o", 5500, "Gen\u00e9rico", "L\u00e1cteos y Bebidas"],
  ["Yogurth Grande", 14000, "Gen\u00e9rico", "L\u00e1cteos y Bebidas"],
  ["Leche Almendras", 14000, "Gen\u00e9rico", "L\u00e1cteos y Bebidas"],
  ["Leche", 9500, "Natulac", "L\u00e1cteos y Bebidas"],
  ["Leche", 9600, "Pur\u00edsima", "L\u00e1cteos y Bebidas"],
  ["Leche", 10000, "Carabobo", "L\u00e1cteos y Bebidas"],
  ["Jugos Sabores 250 mL", 3500, "Natulac", "L\u00e1cteos y Bebidas"],
  ["Jugos Sabores 350 mL", 4300, "Natulac", "L\u00e1cteos y Bebidas"],
  ["Jugos Naranja 350 mL", 4700, "Natulac", "L\u00e1cteos y Bebidas"],
  ["Jugos 1 litro", 7800, "Natulac", "L\u00e1cteos y Bebidas"],
  ["Jugo Naranja 1 Litro", 10000, "Natulac", "L\u00e1cteos y Bebidas"],
  ["T\u00e9 1 Litro", 7500, "Tunal", "L\u00e1cteos y Bebidas"],
  ["T\u00e9 500 mL", 4500, "Tunal", "L\u00e1cteos y Bebidas"],
  ["Chicha", 13500, "Natulac", "L\u00e1cteos y Bebidas"],
  ["Leche", 10000, "San Sim\u00f3n", "L\u00e1cteos y Bebidas"],
  ["Chicha", 13000, "Parmalat", "L\u00e1cteos y Bebidas"],
  ["Leche", 9600, "Parmalat", "L\u00e1cteos y Bebidas"],
  ["Leche", 9800, "Campestre", "L\u00e1cteos y Bebidas"],
  ["Chichero", 12600, "Gen\u00e9rico", "L\u00e1cteos y Bebidas"],
  ["Jugo", 7200, "Frica", "L\u00e1cteos y Bebidas"],
  ["Chicha Chichero", 13000, "Chichero", "L\u00e1cteos y Bebidas"],
  ["T\u00e9 con Az\u00facar", 6000, "Parmalat", "L\u00e1cteos y Bebidas"],
  ["T\u00e9 sin Az\u00facar", 5000, "Parmalat", "L\u00e1cteos y Bebidas"],
  ["Yogurth Vaso Peque\u00f1o", 5500, "Gen\u00e9rico", "L\u00e1cteos y Bebidas"],
  ["T\u00e9 1 1/2 Litro", 15500, "Lipton", "L\u00e1cteos y Bebidas"],
  ["T\u00e9 personal", 5500, "Lipton", "L\u00e1cteos y Bebidas"],
  ["Latti Normal", 5000, "Latti", "L\u00e1cteos y Bebidas"],
  ["Latti Deslactosada", 5500, "Latti", "L\u00e1cteos y Bebidas"],
  ["Leche de la Cuesta", 5000, "De la Cuesta", "L\u00e1cteos y Bebidas"],
  ["Milka", 11000, "Milka", "Chocolates y Dulces"],
  ["CriCri 60gr", 9500, "Savoy", "Chocolates y Dulces"],
  ["Savoy 60gr", 9500, "Savoy", "Chocolates y Dulces"],
  ["Riquiti 30gr", 4800, "Savoy", "Chocolates y Dulces"],
  ["Galak 30gr", 4800, "Savoy", "Chocolates y Dulces"],
  ["Savoy 30gr", 4800, "Savoy", "Chocolates y Dulces"],
  ["Delight 30gr", 5600, "Delight", "Chocolates y Dulces"],
  ["CriCri 30gr", 4800, "Savoy", "Chocolates y Dulces"],
  ["Samba 32gr", 3500, "Savoy", "Chocolates y Dulces"],
  ["Samba 16gr", 2000, "Savoy", "Chocolates y Dulces"],
  ["Riquiti 130gr", 15500, "Savoy", "Chocolates y Dulces"],
  ["Carre 100gr", 5000, "Savoy", "Chocolates y Dulces"],
  ["ChocoTrio", 9500, "Nestl\u00e9", "Chocolates y Dulces"],
  ["Kit Kat", 6000, "Kit Kat", "Chocolates y Dulces"],
  ["Chocolate MM", 8500, "M&M", "Chocolates y Dulces"],
  ["Palitos", 2000, "Gen\u00e9rico", "Chocolates y Dulces"],
  ["Pirulin Peque\u00f1o", 2000, "Nucita", "Chocolates y Dulces"],
  ["Cocosete Ven", 3500, "Nestl\u00e9", "Chocolates y Dulces"],
  ["Cocosete Col", 2500, "Nestl\u00e9", "Chocolates y Dulces"],
  ["Max Pirulin", 4000, "Nucita", "Chocolates y Dulces"],
  ["Galak tubito", 1500, "Savoy", "Chocolates y Dulces"],
  ["Trident Grande", 5800, "Trident", "Chocolates y Dulces"],
  ["Trident Peque\u00f1o", 2500, "Trident", "Chocolates y Dulces"],
  ["Halls", 2500, "Halls", "Chocolates y Dulces"],
  ["Masmelos", 6500, "Gen\u00e9rico", "Chocolates y Dulces"],
  ["Gomitas trululu", 2500, "Trululu", "Chocolates y Dulces"],
  ["Savoy 130gr", 14500, "Savoy", "Chocolates y Dulces"],
  ["TronKolate", 3500, "Savoy", "Chocolates y Dulces"],
  ["Carore\u00f1a 1,75 L", 25000, "Carore\u00f1a", "Sangr\u00eda y Licores"],
  ["Carore\u00f1a Lata", 5000, "Carore\u00f1a", "Sangr\u00eda y Licores"],
  ["Mojito", 5500, "Gen\u00e9rico", "Sangr\u00eda y Licores"],
  ["Que Manda", 19000, "Que Manda", "Sangr\u00eda y Licores"],
  ["Que Manda Lata", 3800, "Que Manda", "Sangr\u00eda y Licores"],
  ["Coca Cola 2 Litros", 6000, "Coca Cola", "Refrescos y Aguas"],
  ["Coca Cola 1 Litro", 4500, "Coca Cola", "Refrescos y Aguas"],
  ["Coca Cola 1,5 Litro", 5500, "Coca Cola", "Refrescos y Aguas"],
  ["Coca Cola PlastiChick", 3500, "Coca Cola", "Refrescos y Aguas"],
  ["Agua Nevada 600 mL", 3500, "Nevada", "Refrescos y Aguas"],
  ["Agua Nevada 355 mL", 2500, "Nevada", "Refrescos y Aguas"],
  ["Agua Nevada 1,5 Litro", 6000, "Nevada", "Refrescos y Aguas"],
  ["Agua Palmera 5 Litro", 9500, "Palmera", "Refrescos y Aguas"],
  ["Agua Palmera 1,5 Litro", 5500, "Palmera", "Refrescos y Aguas"],
  ["Agua Palmera peque\u00f1a", 2500, "Palmera", "Refrescos y Aguas"],
  ["Gatore Manzana", 6700, "Gatorade", "Refrescos y Aguas"],
  ["Coca Cola Lata", 4000, "Coca Cola", "Refrescos y Aguas"],
  ["Alfajores", 4500, "Gen\u00e9rico", "Snacks y Varios"],
  ["Pistacho", 3200, "Gen\u00e9rico", "Snacks y Varios"],
  ["Almendra", 3200, "Gen\u00e9rico", "Snacks y Varios"],
  ["1 Carton Huevos", 19000, "Gen\u00e9rico", "Snacks y Varios"],
  ["1/2 Carton Huevos", 9500, "Gen\u00e9rico", "Snacks y Varios"],
  ["Sal Cristal Marina", 2000, "Gen\u00e9rico", "Snacks y Varios"],
  ["Taki", 4500, "Takis", "Snacks y Varios"],
  ["De Todito Grande", 9500, "Frito-Lay", "Snacks y Varios"],
  ["Botecitos Rellenos", 3000, "Gen\u00e9rico", "Snacks y Varios"],
  ["Galletas Newton", 3000, "Newtons", "Snacks y Varios"],
  ["Cronch Flakes", 11300, "Gen\u00e9rico", "Snacks y Varios"],
  ["Yesquero", 1000, "Gen\u00e9rico", "Snacks y Varios"],
  ["Pepito", 6000, "Pepito", "Snacks y Varios"],
  ["Galleta Mar\u00eda", 5500, "Gen\u00e9rico", "Snacks y Varios"],
  ["Dorito Grande", 12500, "Doritos", "Snacks y Varios"]
];

const CLIENTES = [
  'Mostrador', 'Mar\u00eda L\u00f3pez', 'Jos\u00e9 Ram\u00edrez', 'Ana Torres',
  'Carlos P\u00e9rez', 'Luis Guti\u00e9rrez', 'Marta Jim\u00e9nez', 'Pedro Salazar'
];

const METODOS = ['Efectivo', 'D\u00e9bito', 'Pago M\u00f3vil', 'Bancolombia', 'Punto de Venta'];

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[rand(0, arr.length - 1)];
}

function fechaHace(minutes) {
  const d = new Date(Date.now() - minutes * 60 * 1000);
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

async function main() {
  await conectar();

  // 1. Repoblar productos (limpiar y cargar)
  console.log('Repoblando productos...');
  ejecutar('DELETE FROM factura_detalles');
  ejecutar('DELETE FROM facturas');
  ejecutar('DELETE FROM clientes');
  ejecutar('DELETE FROM productos');
  for (const [nombre, precio, marca, categoria] of PRODUCTOS) {
    ejecutar('INSERT INTO productos (nombre, precio_cop, marca, categoria) VALUES (?, ?, ?, ?)', [nombre, precio, marca, categoria]);
  }
  console.log(`Productos cargados: ${PRODUCTOS.length}`);

  // 2. Insertar clientes
  for (const nombre of CLIENTES) {
    ejecutar('INSERT INTO clientes (nombre, documento, telefono, direccion) VALUES (?, ?, ?, ?)', [nombre, '', '0' + rand(3000000000, 3999999999), '']);
  }
  const clientes = consultar('SELECT id, nombre FROM clientes');
  const mostrador = clientes.find(c => c.nombre === 'Mostrador');
  console.log(`Clientes cargados: ${clientes.length}`);

  // 3. Productos para facturas
  const productos = consultar('SELECT id, nombre, precio_cop FROM productos');
  console.log(`Productos disponibles: ${productos.length}`);

  // 4. Generar facturas distribuidas en las últimas 2 horas
  const numFacturas = rand(15, 25);
  console.log(`Generando ${numFacturas} facturas en las últimas 2 horas...`);

  // Intervalos de tiempo: facturas más frecuentes cada 3-10 min
  let minutosPasados = 0;
  for (let i = 0; i < numFacturas; i++) {
    // Espaciar entre 3 y 10 minutos
    minutosPasados += rand(3, 10);
    if (minutosPasados > 120) break;

    const fecha = fechaHace(minutosPasados);

    // Carrito: 1 a 8 productos
    const numItems = rand(1, 8);
    const items = [];
    for (let j = 0; j < numItems; j++) {
      const prod = pick(productos);
      const cant = rand(1, 4);
      items.push({ prod, cant });
    }

    const metodo = pick(METODOS);
    const status = Math.random() < 0.85 ? 'pagada' : 'en espera';
    const cliente = Math.random() < 0.8 ? mostrador : pick(clientes.filter(c => c.nombre !== 'Mostrador'));

    // Calcular subtotal y total
    let subtotal = 0;
    for (const it of items) subtotal += it.prod.precio_cop * it.cant;
    const descuento = 0;
    const total = subtotal - descuento;
    const moneda = 'COP';

    const tasas = primero('SELECT usd, ves FROM tasas WHERE id = 1') || { usd: 3500, ves: 4.70 };

    // Insertar factura (sin cierre_id -> turno actual visible)
    ejecutar(
      'INSERT INTO facturas (cliente_id, fecha, moneda, tasa_usd, tasa_ves, subtotal, descuento, total, status, metodo_pago, nombre_extra) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [cliente.id, fecha, moneda, tasas.usd, tasas.ves, subtotal, descuento, total, status, metodo, status === 'en espera' ? 'En espera' : '']
    );

    const facturaId = primero('SELECT MAX(id) AS id FROM facturas').id;

    // Insertar detalles
    for (const it of items) {
      const st = it.prod.precio_cop * it.cant;
      ejecutar(
        'INSERT INTO factura_detalles (factura_id, producto_id, producto_nombre, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?, ?)',
        [facturaId, it.prod.id, it.prod.nombre, it.cant, it.prod.precio_cop, st]
      );
    }

    console.log(`  Factura #${facturaId} | ${fecha} | ${numItems} items | $${total} | ${metodo} | ${status} | ${cliente.nombre}`);
  }

  console.log('\n¡Datos demo generados correctamente!');
  console.log('- Productos: 120');
  console.log('- Clientes:' + clientes.length);
  console.log(`- Facturas generadas en las últimas 2 horas`);

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
