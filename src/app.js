const express = require('express');
const path = require('path');
const { conectar } = require('./database/connection');
const { sembrar } = require('./database/seed');
const { verificarToken } = require('./middleware/auth');
const productosRouter = require('./routes/productos');
const tasasRouter = require('./routes/tasas');
const authRouter = require('./routes/auth');

const app = express();

app.use(express.json({ limit: '10mb' }));

// Archivos estáticos públicos (busqueda.html, etc.)
app.use(express.static(path.join(__dirname, '..')));

// Auth routes (sin token)
app.use('/api/auth', authRouter);

// API routes protegidas
app.use('/api/productos', verificarToken, productosRouter);
app.use('/api/tasas', verificarToken, tasasRouter);

// SPA - Admin (React build en public/admin/)
app.use('/admin', express.static(path.join(__dirname, '..', 'public', 'admin')));
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'admin', 'index.html'));
});

// Inicializar base de datos
async function inicializar() {
  await conectar();
  sembrar();
}

module.exports = { app, inicializar };
