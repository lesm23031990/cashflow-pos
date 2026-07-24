const { app, inicializar } = require('./server/app');

const PORT = process.env.PORT || 3000;

inicializar().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n  Servidor corriendo en http://localhost:${PORT}`);
    console.log(`  App:       http://localhost:${PORT}/admin`);
    console.log('  Presiona Ctrl+C para detener.\n');
  });
}).catch(err => {
  console.error('Error al iniciar:', err);
  process.exit(1);
});
