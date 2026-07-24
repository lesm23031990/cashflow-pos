const { Router } = require('express');
const Tesseract = require('tesseract.js');
const { consultar } = require('../database/connection');

const router = Router();

router.post('/', async (req, res) => {
  const { imagen } = req.body;
  if (!imagen) {
    return res.status(400).json({ error: 'Se requiere imagen en base64' });
  }

  try {
    const { data } = await Tesseract.recognize(imagen, 'spa+eng', {
      logger: () => {},
    });

    const lineas = data.text
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    const productos = consultar('SELECT id, nombre, marca, precio_cop, codigo_barras, categoria FROM productos');

    const items = [];
    for (const linea of lineas) {
      const match = linea.match(/^(.*?)\s+(\d[\d.,]*)$/);
      if (!match) continue;

      let nombreRaw = match[1].trim();
      const precioStr = match[2].replace(/[.,]/g, '').replace(/^0+/, '');
      const precio = parseInt(precioStr, 10);
      if (!nombreRaw || isNaN(precio)) continue;

      nombreRaw = nombreRaw.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '').trim();
      if (nombreRaw.length < 2) continue;

      const nombreLower = nombreRaw.toLowerCase();
      const sugerido = productos.find(p => {
        const pLower = p.nombre.toLowerCase();
        return pLower.includes(nombreLower) || nombreLower.includes(pLower);
      }) || productos.find(p => {
        const palabras = nombreLower.split(/\s+/);
        return palabras.some(pal => pal.length > 2 && p.nombre.toLowerCase().includes(pal));
      });

      items.push({
        nombre: nombreRaw,
        precio_cop: precio,
        sugerido: sugerido ? {
          id: sugerido.id,
          p: sugerido.nombre,
          m: sugerido.marca || '',
          v: sugerido.precio_cop,
          b: sugerido.codigo_barras || '',
          c: sugerido.categoria || '',
        } : null,
        texto_original: linea,
      });
    }

    res.json({ ok: true, items, texto_extraido: data.text });
  } catch (err) {
    console.error('Error OCR:', err);
    res.status(500).json({ error: 'Error al procesar la imagen' });
  }
});

module.exports = router;