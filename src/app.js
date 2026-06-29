const express = require('express');
const path = require('path');
const { conectar } = require('./database/connection');
const { sembrar } = require('./database/seed');
const { verificarToken } = require('./middleware/auth');
const productosRouter = require('./routes/productos');
const tasasRouter = require('./routes/tasas');
const authRouter = require('./routes/auth');
const clientesRouter = require('./routes/clientes');
const facturasRouter = require('./routes/facturas');
const metodosPagoRouter = require('./routes/metodos_pago');

const app = express();

app.use(express.json({ limit: '10mb' }));

// Archivos estáticos públicos (busqueda.html, etc.)
app.use(express.static(path.join(__dirname, '..')));

// Auth routes (sin token)
app.use('/api/auth', authRouter);

// API routes protegidas
app.use('/api/productos', verificarToken, productosRouter);
app.use('/api/tasas', verificarToken, tasasRouter);
app.use('/api/clientes', verificarToken, clientesRouter);
app.use('/api/facturas', verificarToken, facturasRouter);
app.use('/api/metodos-pago', verificarToken, metodosPagoRouter);

// SPA - Admin (React build en public/admin/)
app.use('/admin', express.static(path.join(__dirname, '..', 'public', 'admin')));
app.get('/admin/*', (req, res) => {
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
