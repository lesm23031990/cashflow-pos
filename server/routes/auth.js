const { Router } = require('express');
const { primero, hashPassword } = require('../database/connection');
const { generarToken, verificarToken } = require('../middleware/auth');

const router = Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  }

  const user = primero(
    'SELECT id, username, rol FROM usuarios WHERE username = ? AND password_hash = ?',
    [username, hashPassword(password)]
  );

  if (!user) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const token = generarToken({ id: user.id, username: user.username, rol: user.rol });
  res.json({ token, usuario: { username: user.username, rol: user.rol } });
});

router.get('/verificar', verificarToken, (req, res) => {
  res.json({ valido: true, usuario: req.usuario });
});

module.exports = router;
