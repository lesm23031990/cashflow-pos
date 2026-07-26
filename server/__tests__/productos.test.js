const { conectar, ejecutar, consultar, primero } = require('../database/connection');

describe('Productos API', () => {
  beforeAll(async () => {
    await conectar();
    ejecutar('DELETE FROM productos');
  });

  afterAll(() => {
    const fs = require('fs');
    const dbPath = require('../database/connection').DB_PATH;
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
  });

  it('should create a product with required fields', () => {
    ejecutar(
      "INSERT INTO productos (nombre, codigo_barras, precio_cop, marca, categoria) VALUES (?, ?, ?, ?, ?)",
      ['Coca Cola 2L', '7501055300378', 6500, 'Coca Cola', 'Bebidas']
    );
    const row = primero('SELECT * FROM productos WHERE nombre = ?', ['Coca Cola 2L']);
    expect(row).not.toBeNull();
    expect(row.precio_cop).toBe(6500);
    expect(row.marca).toBe('Coca Cola');
  });

  it('should find product by barcode', () => {
    const row = primero(
      'SELECT id, nombre, codigo_barras, precio_cop, marca, categoria FROM productos WHERE codigo_barras = ?',
      ['7501055300378']
    );
    expect(row).not.toBeNull();
    expect(row.nombre).toBe('Coca Cola 2L');
  });

  it('should search products by name, brand or category', () => {
    ejecutar(
      "INSERT INTO productos (nombre, codigo_barras, precio_cop, marca, categoria) VALUES (?, ?, ?, ?, ?)",
      ['Pepsi 1.5L', '', 4500, 'Pepsi', 'Bebidas']
    );
    const rows = consultar(
      "SELECT * FROM productos WHERE nombre LIKE ? OR marca LIKE ? OR categoria LIKE ? ORDER BY nombre",
      ['%Coca%', '%Coca%', '%Coca%']
    );
    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(rows[0].nombre).toContain('Coca');
  });

  it('should update product price', () => {
    const row = primero("SELECT id FROM productos WHERE nombre = ?", ['Coca Cola 2L']);
    ejecutar('UPDATE productos SET precio_cop = ? WHERE id = ?', [7000, row.id]);
    const updated = primero('SELECT precio_cop FROM productos WHERE id = ?', [row.id]);
    expect(updated.precio_cop).toBe(7000);
  });

  it('should delete a product', () => {
    const row = primero("SELECT id FROM productos WHERE nombre = ?", ['Pepsi 1.5L']);
    ejecutar('DELETE FROM productos WHERE id = ?', [row.id]);
    const deleted = primero('SELECT id FROM productos WHERE id = ?', [row.id]);
    expect(deleted).toBeNull();
  });
});
