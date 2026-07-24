const { Router } = require('express');

const router = Router();

router.get('/', (req, res) => {
  res.json({
    nombre_app: process.env.APP_NAME || 'Barebare',
  });
});

module.exports = router;
