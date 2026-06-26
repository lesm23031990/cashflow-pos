const express = require('express');
const path = require('path');
const { conectar } = require('./database/connection');
const { sembrar } = require('./database/seed');
const productosRouter = require('./routes/productos');
const tasasRouter = require('./routes/tasas');

const app = express();

app.use(express.json({ limit: '10mb' }));

// Archivos estáticos
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.static(path.join(__dirname, '..'))); // para busqueda.html desde raíz
app.use('/admin', express.static(path.join(__dirname, '..', 'public', 'admin')));

// API routes
app.use('/api/productos', productosRouter);
app.use('/api/tasas', tasasRouter);

// Redirigir /admin a /admin/index.html
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'admin', 'index.html'));
});

// Inicializar base de datos
async function inicializar() {
  await conectar();
  sembrar();
}

module.exports = { app, inicializar };
