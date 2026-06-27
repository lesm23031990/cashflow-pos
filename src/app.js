const express = require('express');
const path = require('path');
const { conectar } = require('./database/connection');
const { sembrar } = require('./database/seed');
const productosRouter = require('./routes/productos');
const tasasRouter = require('./routes/tasas');
const clientesRouter = require('./routes/clientes');
const facturasRouter = require('./routes/facturas');
const metodosPagoRouter = require('./routes/metodos_pago');

const app = express();

app.use(express.json({ limit: '10mb' }));

// Archivos estáticos
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.static(path.join(__dirname, '..'))); // para busqueda.html desde raíz
app.use('/admin', express.static(path.join(__dirname, '..', 'public', 'admin')));
app.use('/facturacion', express.static(path.join(__dirname, '..', 'public', 'facturacion')));
app.use('/dashboard', express.static(path.join(__dirname, '..', 'public', 'dashboard')));

// API routes
app.use('/api/productos', productosRouter);
app.use('/api/tasas', tasasRouter);
app.use('/api/clientes', clientesRouter);
app.use('/api/facturas', facturasRouter);
app.use('/api/metodos-pago', metodosPagoRouter);

// Redirigir rutas al index.html de cada secci&oacute;n
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'admin', 'index.html'));
});
app.get('/facturacion', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'facturacion', 'index.html'));
});
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'dashboard', 'index.html'));
});

// Inicializar base de datos
async function inicializar() {
  await conectar();
  sembrar();
}

module.exports = { app, inicializar };
