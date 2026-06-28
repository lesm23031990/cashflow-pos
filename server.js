const { app, inicializar } = require('./src/app');

const PORT = process.env.PORT || 3000;

inicializar().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n  Servidor corriendo en http://localhost:${PORT}`);
    console.log(`  Admin:     http://localhost:${PORT}/admin`);
    console.log(`  Buscar:    http://localhost:${PORT}/busqueda.html`);
    console.log(`  Dashboard: http://localhost:${PORT}/admin/dashboard`);
    console.log(`  Facturar:  http://localhost:${PORT}/admin/facturacion`);
    console.log('  Presiona Ctrl+C para detener.\n');
  });
}).catch(err => {
  console.error('Error al iniciar:', err);
  process.exit(1);
});
