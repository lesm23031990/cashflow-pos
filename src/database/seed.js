const { conectar, guardar, consultar, ejecutar } = require('./connection');

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
  ["Leche (todas)", 9500, "Natulac", "L\u00e1cteos y Bebidas"],
  ["Leche (todas)", 9600, "Pur\u00edsima", "L\u00e1cteos y Bebidas"],
  ["Leche (todas)", 10000, "Carabobo", "L\u00e1cteos y Bebidas"],
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
  ["Latti Normal (Leche)", 5000, "Latti", "L\u00e1cteos y Bebidas"],
  ["Latti Deslactosada (Leche)", 5500, "Latti", "L\u00e1cteos y Bebidas"],
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
  ["Carre Grande", 17000, "Savoy", "Chocolates y Dulces"],
  ["Kit Kat", 6000, "Kit Kat", "Chocolates y Dulces"],
  ["Chocolate MM", 8500, "M&M", "Chocolates y Dulces"],
  ["Ovomaltina", 5000, "Ovomaltina", "Chocolates y Dulces"],
  ["Palitos", 2000, "Gen\u00e9rico", "Chocolates y Dulces"],
  ["Pirulin Peque\u00f1o", 2000, "Nucita", "Chocolates y Dulces"],
  ["Cocosete Ven", 3500, "Nestl\u00e9", "Chocolates y Dulces"],
  ["Cocosete Col", 2500, "Nestl\u00e9", "Chocolates y Dulces"],
  ["Toronto", 2000, "Savoy", "Chocolates y Dulces"],
  ["Max Pirulin", 4000, "Nucita", "Chocolates y Dulces"],
  ["Nucita", 2000, "Nucita", "Chocolates y Dulces"],
  ["Galak tubito", 1500, "Savoy", "Chocolates y Dulces"],
  ["Loki\u00f1o mini", 1500, "Loki\u00f1o", "Chocolates y Dulces"],
  ["Trident Grande", 5800, "Trident", "Chocolates y Dulces"],
  ["Trident Peque\u00f1o", 2500, "Trident", "Chocolates y Dulces"],
  ["Halls", 2500, "Halls", "Chocolates y Dulces"],
  ["Huevos Sorpresa", 2500, "Gen\u00e9rico", "Chocolates y Dulces"],
  ["Masmelos", 6500, "Gen\u00e9rico", "Chocolates y Dulces"],
  ["Gomitas trululu", 2500, "Trululu", "Chocolates y Dulces"],
  ["Pirulin Dispensador", 8500, "Nucita", "Chocolates y Dulces"],
  ["Chao en l\u00ednea", 1000, "Chao", "Chocolates y Dulces"],
  ["Chao Pastillas", 1500, "Chao", "Chocolates y Dulces"],
  ["Savoy 130gr", 14500, "Savoy", "Chocolates y Dulces"],
  ["TronKolate", 3500, "Savoy", "Chocolates y Dulces"],
  ["Savoy Postres", 21500, "Savoy", "Chocolates y Dulces"],
  ["Dandy", 1800, "Savoy", "Chocolates y Dulces"],
  ["Carore\u00f1a 1,75 L", 25000, "Carore\u00f1a", "Sangr\u00eda y Licores"],
  ["Carore\u00f1a Lata", 5000, "Carore\u00f1a", "Sangr\u00eda y Licores"],
  ["Mojito", 5500, "Gen\u00e9rico", "Sangr\u00eda y Licores"],
  ["Que Manda", 19000, "Que Manda", "Sangr\u00eda y Licores"],
  ["Que Manda Lata", 3800, "Que Manda", "Sangr\u00eda y Licores"],
  ["Carive\u00f1a", 20000, "Carive\u00f1a", "Sangr\u00eda y Licores"],
  ["Malaque\u00f1a", 16500, "Malaque\u00f1a", "Sangr\u00eda y Licores"],
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
  ["Nestea (C/A -> 6500, S/A -> 4000)", 4000, "Nestea", "Refrescos y Aguas"],
  ["Coca Cola Lata", 4000, "Coca Cola", "Refrescos y Aguas"],
  ["Coca Cola PlastiChip", 3500, "Coca Cola", "Refrescos y Aguas"],
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

async function sembrar() {
  await conectar();
  const count = consultar('SELECT COUNT(*) AS count FROM productos');
  if (count[0].count > 0) return;

  for (const row of PRODUCTOS) {
    ejecutar(
      'INSERT INTO productos (nombre, precio_cop, marca, categoria) VALUES (?, ?, ?, ?)',
      row
    );
  }

  const tasaExiste = consultar('SELECT COUNT(*) AS count FROM tasas WHERE id = 1');
  if (tasaExiste[0].count === 0) {
    ejecutar('INSERT INTO tasas (id, usd, ves) VALUES (1, 3500, 4.70)');
  }

  const mostrador = consultar("SELECT id FROM clientes WHERE nombre = 'Mostrador'");
  if (mostrador.length === 0) {
    ejecutar("INSERT INTO clientes (nombre, documento, telefono, direccion) VALUES ('Mostrador', '', '', '')");
  }

  const metodos = consultar('SELECT COUNT(*) AS count FROM metodos_pago');
  if (metodos[0].count === 0) {
    var defaults = ['Efectivo', 'D\u00e9bito', 'Pago M\u00f3vil', 'Bancolombia'];
    for (var i = 0; i < defaults.length; i++) {
      ejecutar('INSERT INTO metodos_pago (nombre) VALUES (?)', [defaults[i]]);
    }
  }
}

module.exports = { sembrar };
