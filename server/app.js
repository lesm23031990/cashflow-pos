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
const cierresCajaRouter = require('./routes/cierres_caja');
const configRouter = require('./routes/config');
const ocrRouter = require('./routes/ocr');

const app = express();

app.use(express.json({ limit: '10mb' }));

// Archivos estáticos públicos (busqueda.html, etc.)
app.use(express.static(path.join(__dirname, '..')));

// Rutas públicas (sin token)
app.use('/api/auth', authRouter);
app.use('/api/config', configRouter);

// API routes protegidas
app.use('/api/productos', verificarToken, productosRouter);
app.use('/api/tasas', verificarToken, tasasRouter);
app.use('/api/clientes', verificarToken, clientesRouter);
app.use('/api/facturas', verificarToken, facturasRouter);
app.use('/api/metodos-pago', verificarToken, metodosPagoRouter);
app.use('/api/cierres-caja', verificarToken, cierresCajaRouter);
app.use('/api/ocr', verificarToken, ocrRouter);

// SPA - Admin (React build en public/admin/)
app.use('/admin', express.static(path.join(__dirname, '..', 'public', 'admin')));
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'admin', 'index.html'));
});

// Ruta raíz redirige al admin
app.get('/', (req, res) => {
  res.redirect('/admin');
});


// Inicializar base de datos
async function inicializar() {
  await conectar();
  sembrar();
}

module.exports = { app, inicializar };
