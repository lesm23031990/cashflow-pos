const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const { primero, ejecutar, hashPassword, verifyPassword } = require('../database/connection');
const { generarToken, verificarToken } = require('../middleware/auth');

const router = Router();

// Bruteforce guard: max 10 login attempts / 15 min / IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos.' },
});

router.post('/login', loginLimiter, (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  }

  const user = primero(
    'SELECT id, username, rol, password_hash FROM usuarios WHERE username = ?',
    [username]
  );

  if (!user) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const { ok, needsRehash } = verifyPassword(password, user.password_hash);
  if (!ok) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  if (needsRehash) {
    ejecutar('UPDATE usuarios SET password_hash = ? WHERE id = ?', [hashPassword(password), user.id]);
  }

  const token = generarToken({ id: user.id, username: user.username, rol: user.rol });
  res.json({ token, usuario: { username: user.username, rol: user.rol } });
});

router.get('/verificar', verificarToken, (req, res) => {
  res.json({ valido: true, usuario: req.usuario });
});

module.exports = router;
