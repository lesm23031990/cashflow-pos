(function () {
  'use strict';

  var detalles = [];
  var productosCache = [];
  var clientesCache = [];

  var $ = function (id) { return document.getElementById(id); };
  var toast = $('toast');

  function api(path, opts) {
    return fetch(path, opts || {}).then(function (r) {
      if (!r.ok) return r.json().then(function (e) { throw new Error(e.error || r.statusText); });
      return r.json();
    });
  }

  function esc(s) {
    var d = document.createElement('div');
    d.appendChild(document.createTextNode(s));
    return d.innerHTML;
  }

  function mostrarToast(msg, error) {
    toast.textContent = msg;
    toast.className = 'toast mostrar' + (error ? ' error' : '');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function () { toast.classList.remove('mostrar'); }, 2000);
  }

  function abrirModal(id) { $(id).classList.add('abierto'); }
  function cerrarModal(id) { $(id).classList.remove('abierto'); }

  // Cerrar modales con click fuera
  document.querySelectorAll('.modal-overlay').forEach(function (el) {
    el.addEventListener('click', function (e) {
      if (e.target === el) el.classList.remove('abierto');
    });
  });

  window.cerrarModal = cerrarModal;

  // ─── Clientes ──────────────────────────────────────────

  function cargarClientes() {
    api('/api/clientes').then(function (data) {
      clientesCache = data;
      var sel = $('selCliente');
      sel.innerHTML = '<option value="">Seleccionar cliente...</option>';
      data.forEach(function (c) {
        var opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.nombre + (c.documento ? ' (' + c.documento + ')' : '');
        sel.appendChild(opt);
      });
    });
  }

  window.abrirClienteModal = function () {
    $('frmClienteNombre').value = '';
    $('frmClienteDoc').value = '';
    $('frmClienteTel').value = '';
    $('frmClienteDir').value = '';
    abrirModal('modalCliente');
  };

  window.guardarCliente = function () {
    var nombre = $('frmClienteNombre').value.trim();
    if (!nombre) { mostrarToast('Nombre obligatorio', true); return; }
    api('/api/clientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: nombre,
        documento: $('frmClienteDoc').value.trim(),
        telefono: $('frmClienteTel').value.trim(),
        direccion: $('frmClienteDir').value.trim()
      })
    }).then(function (c) {
      mostrarToast('Cliente creado');
      cerrarModal('modalCliente');
      cargarClientes();
      // Seleccionar el nuevo cliente
      setTimeout(function () { $('selCliente').value = c.id; }, 100);
    }).catch(function (err) { mostrarToast(err.message, true); });
  };

  // ─── Productos ──────────────────────────────────────────

  function cargarProductos() {
    api('/api/productos').then(function (data) {
      productosCache = data;
    });
  }

  var _timerBuscar;
  $('buscarProd').addEventListener('input', function () {
    clearTimeout(_timerBuscar);
    var q = this.value.trim().toLowerCase();
    var sugerencias = $('resultadosBusqueda');
    if (!q) { sugerencias.classList.remove('visible'); return; }
    _timerBuscar = setTimeout(function () {
      var filtrados = productosCache.filter(function (p) {
        return (p.p + ' ' + (p.m || '')).toLowerCase().indexOf(q) !== -1;
      }).slice(0, 10);
      if (filtrados.length === 0) { sugerencias.classList.remove('visible'); return; }
      sugerencias.innerHTML = '';
      filtrados.forEach(function (p) {
        var div = document.createElement('div');
        div.className = 'sugerencia-item';
        div.textContent = p.p + ' - $' + Number(p.v).toLocaleString('es-CO') + (p.m ? ' (' + p.m + ')' : '');
        div.addEventListener('click', function () {
          $('buscarProd').value = p.p;
          $('buscarProd')._prod = p;
          sugerencias.classList.remove('visible');
          setTimeout(function () { $('cantProd').focus(); }, 50);
        });
        sugerencias.appendChild(div);
      });
      sugerencias.classList.add('visible');
    }, 200);
  });

  $('buscarProd').addEventListener('blur', function () {
    setTimeout(function () { $('resultadosBusqueda').classList.remove('visible'); }, 200);
  });

  $('cantProd').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') window.agregarProducto();
  });

  window.agregarProducto = function () {
    var prod = $('buscarProd')._prod;
    if (!prod) {
      // Buscar por nombre exacto en cache
      var txt = $('buscarProd').value.trim().toLowerCase();
      prod = productosCache.find(function (p) { return p.p.toLowerCase() === txt; });
      if (!prod) { mostrarToast('Selecciona un producto de la lista', true); return; }
    }
    var cant = parseFloat($('cantProd').value) || 1;
    var existente = detalles.findIndex(function (d) { return d.producto_id === prod.id; });
    if (existente !== -1) {
      detalles[existente].cantidad += cant;
      detalles[existente].subtotal = detalles[existente].cantidad * detalles[existente].precio_unitario;
    } else {
      detalles.push({
        producto_id: prod.id,
        producto_nombre: prod.p,
        cantidad: cant,
        precio_unitario: prod.v,
        subtotal: cant * prod.v
      });
    }
    $('buscarProd').value = '';
    $('buscarProd')._prod = null;
    $('cantProd').value = 1;
    $('resultadosBusqueda').classList.remove('visible');
    renderDetalle();
    $('buscarProd').focus();
  };

  window.quitarDetalle = function (idx) {
    detalles.splice(idx, 1);
    renderDetalle();
  };

  function renderDetalle() {
    var tbody = $('detalleBody');
    if (detalles.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#64748b;padding:1rem">Sin productos</td></tr>';
      actualizarTotal();
      return;
    }
    tbody.innerHTML = '';
    for (var i = 0; i < detalles.length; i++) {
      var d = detalles[i];
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + esc(d.producto_nombre) + '</td>' +
        '<td class="num">' + d.cantidad + '</td>' +
        '<td class="num">$' + Number(d.precio_unitario).toLocaleString('es-CO') + '</td>' +
        '<td class="num">$' + Number(d.subtotal).toLocaleString('es-CO') + '</td>' +
        '<td><button class="btn-del" onclick="quitarDetalle(' + i + ')" title="Quitar">\u2716</button></td>';
      tbody.appendChild(tr);
    }
    actualizarTotal();
  }

  function actualizarTotal() {
    var moneda = $('selMoneda').value;
    var desc = parseFloat($('inputDescuento').value) || 0;
    var subtotal = detalles.reduce(function (sum, d) { return sum + d.subtotal; }, 0);
    var total = subtotal - desc;
    var simbolo = moneda === 'COP' ? '$' : moneda === 'USD' ? '$' : 'Bs ';
    $('totalValor').textContent = simbolo + Number(total).toLocaleString('es-CO');
  }

  $('selMoneda').addEventListener('change', actualizarTotal);
  $('inputDescuento').addEventListener('input', actualizarTotal);

  // ─── Generar factura ────────────────────────────────────

  window.generarFactura = function () {
    var clienteId = parseInt($('selCliente').value);
    if (!clienteId) { mostrarToast('Selecciona un cliente', true); return; }
    if (detalles.length === 0) { mostrarToast('Agrega al menos un producto', true); return; }

    var btn = document.activeElement;
    btn.disabled = true;
    btn.textContent = 'Generando...';

    api('/api/facturas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cliente_id: clienteId,
        moneda: $('selMoneda').value,
        descuento: parseFloat($('inputDescuento').value) || 0,
        detalles: detalles.map(function (d) { return { producto_id: d.producto_id, cantidad: d.cantidad, precio_unitario: d.precio_unitario }; })
      })
    }).then(function (factura) {
      mostrarToast('Factura #' + factura.id + ' generada');
      detalles = [];
      renderDetalle();
      $('inputDescuento').value = 0;
      cargarFacturas();
      verFactura(factura);
    }).catch(function (err) {
      mostrarToast(err.message || 'Error', true);
    }).finally(function () {
      btn.disabled = false;
      btn.textContent = 'Generar Factura';
    });
  };

  // ─── Ver factura ────────────────────────────────────────

  function verFactura(f) {
    $('facturaNum').textContent = f.id;
    var html = '<div class="factura-info">';
    html += '<p><strong>Cliente:</strong> ' + esc(f.cliente_nombre) + '</p>';
    html += '<p><strong>Fecha:</strong> ' + f.fecha + '</p>';
    html += '<p><strong>Moneda:</strong> ' + f.moneda + '</p>';
    html += '</div>';
    html += '<table><thead><tr><th>Producto</th><th class="num">Cant</th><th class="num">Precio</th><th class="num">Subtotal</th></tr></thead><tbody>';
    (f.detalles || []).forEach(function (d) {
      html += '<tr><td>' + esc(d.producto_nombre) + '</td><td class="num">' + d.cantidad + '</td><td class="num">$' + Number(d.precio_unitario).toLocaleString('es-CO') + '</td><td class="num">$' + Number(d.subtotal).toLocaleString('es-CO') + '</td></tr>';
    });
    html += '</tbody></table>';
    var sim = f.moneda === 'COP' ? '$' : f.moneda === 'USD' ? '$' : 'Bs ';
    html += '<div class="factura-totales">';
    html += '<p>Subtotal: ' + sim + Number(f.subtotal).toLocaleString('es-CO') + '</p>';
    if (f.descuento > 0) html += '<p>Descuento: -' + sim + Number(f.descuento).toLocaleString('es-CO') + '</p>';
    html += '<p class="grande">Total: ' + sim + Number(f.total).toLocaleString('es-CO') + '</p>';
    html += '</div>';
    $('facturaContenido').innerHTML = html;
    abrirModal('modalFactura');
  }

  function cargarFacturas() {
    api('/api/facturas').then(function (data) {
      var tbody = $('facturasBody');
      if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#64748b;padding:1rem">Sin facturas</td></tr>';
        return;
      }
      tbody.innerHTML = '';
      data.slice(0, 20).forEach(function (f) {
        var sim = f.moneda === 'COP' ? '$' : f.moneda === 'USD' ? '$' : 'Bs ';
        var tr = document.createElement('tr');
        tr.innerHTML =
          '<td>' + f.id + '</td>' +
          '<td>' + esc(f.cliente_nombre) + '</td>' +
          '<td>' + f.fecha.slice(0, 10) + '</td>' +
          '<td class="num">' + sim + Number(f.total).toLocaleString('es-CO') + '</td>' +
          '<td>' + f.moneda + '</td>' +
          '<td><button class="btn-edit" onclick="verFacturaDesdeApi(' + f.id + ')" style="background:none;border:none;color:#06b6d4;cursor:pointer">Ver</button></td>';
        tbody.appendChild(tr);
      });
    });
  }

  window.verFacturaDesdeApi = function (id) {
    api('/api/facturas/' + id).then(function (f) {
      verFactura(f);
    }).catch(function (err) { mostrarToast(err.message, true); });
  };

  // ─── Init ───────────────────────────────────────────────

  cargarClientes();
  cargarProductos();
  cargarFacturas();
  renderDetalle();
})();
