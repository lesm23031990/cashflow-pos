require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const { conectar } = require('./database/connection');
const { sembrar } = require('./database/seed');
const { sembrarDemo } = require('./database/seed-demo');
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

// Headers de seguridad (X-Frame-Options, HSTS, etc.) y CORS con lista blanca
app.use(helmet());
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
app.use(cors({ origin: allowedOrigins.length ? allowedOrigins : true }));

// Archivos estáticos públicos (SOLO la carpeta public/, nunca la raíz del repo)
app.use(express.static(path.join(__dirname, '..', 'public')));

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
  // Si SEED_DEMO está activado, cargar datos demo automáticamente (solo si DB vacía)
  // Demo seed only outside production to avoid polluting real business data
  if (process.env.SEED_DEMO === 'true' && process.env.NODE_ENV !== 'production') {
    sembrarDemo();
  }
}

module.exports = { app, inicializar };
