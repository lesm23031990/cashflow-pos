(function () {
  'use strict';

  /* ── State ─────────────────────────────────────── */
  var detalles = [];
  var productosCache = [];
  var clientesCache = [];
  var metodosCache = [];
  var selectedIdx = -1;
  var suggestIdx = -1;
  var facturaEditandoId = null;

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
    toast._timer = setTimeout(function () { toast.classList.remove('mostrar'); }, 2500);
  }

  function abrirModal(id) { $(id).classList.add('abierto'); }
  function cerrarModal(id) { $(id).classList.remove('abierto'); }

  function fmt(n, frac) {
    frac = frac !== undefined ? frac : 0;
    return Number(n).toLocaleString('es-CO', { minimumFractionDigits: frac, maximumFractionDigits: frac });
  }

  function badge(status) {
    var cls = status === 'pagada' ? 'badge-ok' : 'badge-warn';
    return '<span class="badge ' + cls + '">' + esc(status) + '</span>';
  }

  var METODOS = ['Efectivo', 'D\u00e9bito', 'Pago M\u00f3vil', 'Bancolombia'];

  /* ── Clientes ──────────────────────────────────── */
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
    setTimeout(function () { $('frmClienteNombre').focus(); }, 100);
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
      setTimeout(function () { $('selCliente').value = c.id; }, 100);
    }).catch(function (err) { mostrarToast(err.message, true); });
  };

  /* ── Productos ─────────────────────────────────── */
  function cargarProductos() {
    api('/api/productos').then(function (data) {
      productosCache = data;
    });
  }

  function mostrarSugerencias(lista) {
    var el = $('resultadosBusqueda');
    if (!lista || lista.length === 0) { el.classList.remove('visible'); return; }
    el.innerHTML = '';
    for (var i = 0; i < lista.length; i++) {
      var p = lista[i];
      var div = document.createElement('div');
      div.className = 'suggest-item' + (i === suggestIdx ? ' hover' : '');
      div.dataset.index = i;
      div.innerHTML = esc(p.p) +
        (p.m ? ' <span class="suggest-marca">' + esc(p.m) + '</span>' : '') +
        ' <span class="suggest-precio">$' + fmt(p.v) + '</span>';
      div.addEventListener('click', (function (prod) {
        return function () { seleccionarSugerencia(prod); };
      })(p));
      el.appendChild(div);
    }
    el.classList.add('visible');
  }

  function seleccionarSugerencia(prod) {
    $('buscarProd').value = prod.p;
    $('buscarProd')._prod = prod;
    $('resultadosBusqueda').classList.remove('visible');
    setTimeout(function () { $('cantProd').focus(); $('cantProd').select(); }, 50);
  }

  var _timerBuscar;
  $('buscarProd').addEventListener('input', function () {
    clearTimeout(_timerBuscar);
    var q = this.value.trim().toLowerCase();
    suggestIdx = -1;
    if (!q) { $('resultadosBusqueda').classList.remove('visible'); return; }
    _timerBuscar = setTimeout(function () {
      var filtrados = productosCache.filter(function (p) {
        return (p.p + ' ' + (p.m || '')).toLowerCase().indexOf(q) !== -1;
      }).slice(0, 10);
      mostrarSugerencias(filtrados);
    }, 180);
  });

  $('buscarProd').addEventListener('blur', function () {
    setTimeout(function () { $('resultadosBusqueda').classList.remove('visible'); }, 200);
  });

  window.ajustarCant = function (delta) {
    var inp = $('cantProd');
    var v = parseInt(inp.value) || 1;
    v = Math.max(1, v + delta);
    inp.value = v;
  };

  window.agregarProducto = function () {
    var prod = $('buscarProd')._prod;
    if (!prod) {
      var txt = $('buscarProd').value.trim().toLowerCase();
      prod = productosCache.find(function (p) { return p.p.toLowerCase() === txt; });
      if (!prod) { mostrarToast('Selecciona un producto de la lista', true); return; }
    }
    var cant = parseInt($('cantProd').value) || 1;
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
    if (selectedIdx >= detalles.length) selectedIdx = detalles.length - 1;
    renderDetalle();
  };

  function renderDetalle() {
    var tbody = $('detalleBody');
    if (detalles.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#475569;padding:1rem;font-size:.8125rem">Sin productos &mdash; busca y agrega con <kbd>Enter</kbd></td></tr>';
      selectedIdx = -1;
      actualizarTotal();
      return;
    }
    tbody.innerHTML = '';
    for (var i = 0; i < detalles.length; i++) {
      var d = detalles[i];
      var tr = document.createElement('tr');
      tr.className = i === selectedIdx ? 'sel' : '';
      tr.dataset.index = i;
      tr.innerHTML =
        '<td>' + esc(d.producto_nombre) + '</td>' +
        '<td class="col-qty edi-qty" data-idx="' + i + '">' + d.cantidad + '</td>' +
        '<td class="col-price">$' + fmt(d.precio_unitario) + '</td>' +
        '<td class="col-price">$' + fmt(d.subtotal) + '</td>' +
        '<td class="col-del"><button class="btn-del" data-idx="' + i + '" title="Quitar">\u2716</button></td>';
      tr.addEventListener('click', function () {
        var idx = parseInt(this.dataset.index);
        selectedIdx = idx;
        renderDetalle();
      });
      tbody.appendChild(tr);
    }
    tbody.addEventListener('click', function (e) {
      var btn = e.target.closest('.btn-del');
      if (btn) { quitarDetalle(parseInt(btn.dataset.idx)); }
    });
    actualizarTotal();
  }

  // Inline qty editing: dblclick on qty cell
  $('detalleBody').addEventListener('dblclick', function (e) {
    var cell = e.target.closest('.edi-qty');
    if (!cell) return;
    var idx = parseInt(cell.dataset.idx);
    var oldVal = detalles[idx].cantidad;
    var inp = document.createElement('input');
    inp.type = 'number';
    inp.className = 'qty-inline';
    inp.value = oldVal;
    inp.min = 1;
    cell.textContent = '';
    cell.appendChild(inp);
    inp.focus();
    inp.select();
    function commit() {
      var v = parseInt(inp.value);
      if (isNaN(v) || v < 1) v = oldVal;
      detalles[idx].cantidad = v;
      detalles[idx].subtotal = v * detalles[idx].precio_unitario;
      renderDetalle();
    }
    inp.addEventListener('blur', commit);
    inp.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') { ev.preventDefault(); inp.blur(); }
      if (ev.key === 'Escape') { ev.preventDefault(); cell.textContent = oldVal; }
    });
  });

  function actualizarTotal() {
    var moneda = $('selMoneda').value;
    var desc = parseFloat($('inputDescuento').value) || 0;
    var subtotal = detalles.reduce(function (sum, d) { return sum + d.subtotal; }, 0);
    var total = Math.max(0, subtotal - desc);
    var simbolo = moneda === 'COP' ? '$' : moneda === 'USD' ? '$' : 'Bs ';
    $('totalValor').textContent = simbolo + fmt(total);
  }

  $('selMoneda').addEventListener('change', actualizarTotal);
  $('inputDescuento').addEventListener('input', actualizarTotal);

  function cargarMetodosPago() {
    api('/api/metodos-pago').then(function (data) {
      metodosCache = data;
      var sel = $('selMetodoPago');
      sel.innerHTML = '<option value="">Seleccionar...</option>';
      data.forEach(function (m) {
        var opt = document.createElement('option');
        opt.value = m.nombre;
        opt.textContent = m.nombre;
        sel.appendChild(opt);
      });
    });
  }

  // Mostrar nombre/telefono solo si Pago Móvil o Bancolombia
  $('selMetodoPago').addEventListener('change', function () {
    var v = this.value;
    var show = v === 'Pago M\u00f3vil' || v === 'Bancolombia';
    $('datosCliente').style.display = show ? '' : 'none';
    $('datosTelefono').style.display = show ? '' : 'none';
  });

  $('buscarProd').addEventListener('keydown', function (e) {
    var suggest = $('resultadosBusqueda');
    var items = suggest.querySelectorAll('.suggest-item');
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!suggest.classList.contains('visible') || items.length === 0) return;
      suggestIdx = Math.min(suggestIdx + 1, items.length - 1);
      items.forEach(function (el, i) { el.classList.toggle('hover', i === suggestIdx); });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!suggest.classList.contains('visible') || items.length === 0) return;
      suggestIdx = Math.max(suggestIdx - 1, -1);
      items.forEach(function (el, i) { el.classList.toggle('hover', i === suggestIdx); });
    } else if (e.key === 'Enter') {
      if (suggest.classList.contains('visible') && suggestIdx >= 0 && items[suggestIdx]) {
        e.preventDefault();
        items[suggestIdx].click();
      } else if (this._prod || this.value.trim()) {
        e.preventDefault();
        window.agregarProducto();
      }
    } else if (e.key === 'Escape') {
      suggest.classList.remove('visible');
      this.value = '';
      this._prod = null;
    }
  });

  window.generarFactura = function () {
    if (detalles.length === 0) { mostrarToast('Agrega al menos un producto', true); $('buscarProd').focus(); return; }

    var metodo = $('selMetodoPago').value;
    if (!metodo) { mostrarToast('Selecciona un m\u00e9todo de pago', true); $('selMetodoPago').focus(); return; }

    var nombre = $('inputNombreCliente').value.trim();
    var telefono = $('inputTelefonoCliente').value.trim();

    if (metodo === 'Pago M\u00f3vil' || metodo === 'Bancolombia') {
      if (!nombre) { mostrarToast('Nombre del cliente obligatorio', true); $('inputNombreCliente').focus(); return; }
      if (!telefono) { mostrarToast('Tel\u00e9fono del cliente obligatorio', true); $('inputTelefonoCliente').focus(); return; }
    }

    var btn = $('btnGenerar');
    btn.disabled = true;
    btn.innerHTML = 'Generando...';

    var body = {
      moneda: $('selMoneda').value,
      descuento: parseFloat($('inputDescuento').value) || 0,
      metodo_pago: metodo,
      detalles: detalles.map(function (d) { return { producto_id: d.producto_id, cantidad: d.cantidad, precio_unitario: d.precio_unitario }; })
    };

    if (nombre) { body.cliente_nombre = nombre; body.cliente_telefono = telefono; }

    api('/api/facturas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(function (factura) {
      mostrarToast('Factura #' + factura.id + ' generada');
      detalles = [];
      selectedIdx = -1;
      renderDetalle();
      $('inputDescuento').value = 0;
      $('selMetodoPago').value = '';
      cargarFacturas();
      verFactura(factura);
    }).catch(function (err) {
      mostrarToast(err.message || 'Error', true);
    }).finally(function () {
      btn.disabled = false;
      btn.innerHTML = '<span class="btn-label">Generar Factura</span><kbd class="chip-sm chip-invert">Ctrl+Enter</kbd>';
    });
  };

  window.nuevaFactura = function () {
    if (detalles.length > 0 && !confirm('Limpiar factura actual?')) return;
    detalles = [];
    selectedIdx = -1;
    facturaEditandoId = null;
    renderDetalle();
    $('inputDescuento').value = 0;
    $('selMetodoPago').value = '';
    $('selCliente').value = '';
    $('selMoneda').value = 'COP';
    $('buscarProd').value = '';
    $('buscarProd')._prod = null;
    $('buscarProd').focus();
    mostrarToast('Factura limpiada');
  };

  function poblarSelect(sel, opciones, valor) {
    sel.innerHTML = '';
    opciones.forEach(function (o) {
      var opt = document.createElement('option');
      opt.value = o;
      opt.textContent = o;
      sel.appendChild(opt);
    });
    if (valor) sel.value = valor;
  }

  function verFactura(f) {
    facturaEditandoId = f.id;
    $('facturaNum').textContent = f.id;

    // Meta: status + pago
    var meta = '<div class="factura-meta-row">';
    meta += '<span class="meta-item"><strong>Cliente:</strong> ' + esc(f.cliente_nombre) + '</span>';
    meta += '<span class="meta-item"><strong>Fecha:</strong> ' + f.fecha + '</span>';
    meta += '<span class="meta-item"><strong>Moneda:</strong> ' + f.moneda + '</span>';
    meta += '<span class="meta-item"><strong>Status:</strong> ' + badge(f.status || 'en espera') + '</span>';
    meta += '<span class="meta-item"><strong>Pago:</strong> ' + esc(f.metodo_pago || '—') + '</span>';
    meta += '</div>';
    $('facturaInfo').innerHTML = meta;

    // Detalles
    var html = '<table><thead><tr><th>Producto</th><th class="col-qty">Cant</th><th class="col-price">Precio</th><th class="col-price">Subtotal</th></tr></thead><tbody>';
    (f.detalles || []).forEach(function (d) {
      html += '<tr><td>' + esc(d.producto_nombre) + '</td><td class="col-qty">' + d.cantidad + '</td><td class="col-price">$' + fmt(d.precio_unitario) + '</td><td class="col-price">$' + fmt(d.subtotal) + '</td></tr>';
    });
    html += '</tbody></table>';
    var sim = f.moneda === 'COP' ? '$' : f.moneda === 'USD' ? '$' : 'Bs ';
    html += '<div class="factura-totales">';
    html += '<p>Subtotal: ' + sim + fmt(f.subtotal) + '</p>';
    if (f.descuento > 0) html += '<p>Descuento: -' + sim + fmt(f.descuento) + '</p>';
    html += '<p class="grande">Total: ' + sim + fmt(f.total) + '</p>';
    // USD / VES equivalents
    if (f.total_usd !== undefined) {
      html += '<p class="equiv">USD: $' + fmt(f.total_usd, 2) + '</p>';
    }
    if (f.total_ves !== undefined) {
      html += '<p class="equiv">VES: Bs ' + fmt(f.total_ves, 2) + '</p>';
    }
    html += '</div>';
    $('facturaContenido').innerHTML = html;

    // Edit tools (solo si en espera)
    var editTools = $('facturaEditTools');
    if (f.status === 'en espera') {
      poblarSelect($('editStatus'), ['en espera', 'pagada'], f.status);
      var opts = [''].concat(metodosCache.map(function (m) { return m.nombre; }));
      poblarSelect($('editMetodoPago'), opts, f.metodo_pago || '');
      editTools.style.display = 'block';
    } else {
      editTools.style.display = 'none';
    }

    abrirModal('modalFactura');
  }

  window.guardarCambiosFactura = function () {
    var id = facturaEditandoId;
    if (!id) return;
    var status = $('editStatus').value;
    var metodo_pago = $('editMetodoPago').value;
    var btn = $('btnGuardarCambios');
    btn.disabled = true;
    btn.textContent = 'Guardando...';

    api('/api/facturas/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: status, metodo_pago: metodo_pago })
    }).then(function (f) {
      mostrarToast('Factura #' + id + ' actualizada');
      cargarFacturas();
      verFactura(f);
    }).catch(function (err) {
      mostrarToast(err.message || 'Error', true);
    }).finally(function () {
      btn.disabled = false;
      btn.textContent = 'Guardar Cambios';
    });
  };

  function cargarFacturas() {
    api('/api/facturas').then(function (data) {
      var tbody = $('facturasBody');
      if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#475569;padding:.75rem;font-size:.8125rem">Sin facturas a&uacute;n</td></tr>';
        return;
      }
      tbody.innerHTML = '';
      data.slice(0, 20).forEach(function (f) {
        var sim = f.moneda === 'COP' ? '$' : f.moneda === 'USD' ? '$' : 'Bs ';
        var est = f.status || 'en espera';
        var tr = document.createElement('tr');
        tr.innerHTML =
          '<td>' + f.id + '</td>' +
          '<td>' + esc(f.cliente_nombre) + '</td>' +
          '<td>' + f.fecha.slice(0, 10) + '</td>' +
          '<td class="col-price">' + sim + fmt(f.total) + '</td>' +
          '<td>' + f.moneda + '</td>' +
          '<td>' + badge(est) + '</td>' +
          '<td>' + esc(f.metodo_pago || '—') + '</td>' +
          '<td class="col-del"><button class="btn-act" onclick="verFacturaDesdeApi(' + f.id + ')">Ver</button></td>';
        tbody.appendChild(tr);
      });
    });
  }

  window.verFacturaDesdeApi = function (id) {
    api('/api/facturas/' + id).then(function (f) {
      verFactura(f);
    }).catch(function (err) { mostrarToast(err.message, true); });
  };

  document.addEventListener('keydown', function (e) {
    var modalAbierto = document.querySelector('.modal-overlay.abierto');
    if (modalAbierto) {
      if (e.key === 'Escape') {
        e.preventDefault();
        cerrarModal(modalAbierto.id);
      }
      return;
    }
    var tag = e.target.tagName;
    var isInput = tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA';

    switch (e.key) {
      case 'F1': e.preventDefault(); abrirModal('modalAyuda'); break;
      case 'F2': e.preventDefault(); $('selCliente').focus(); break;
      case 'F3': e.preventDefault(); $('buscarProd').focus(); $('buscarProd').select(); break;
      case 'F4': e.preventDefault(); $('selMoneda').focus(); break;
      case 'F5': e.preventDefault(); $('inputDescuento').focus(); $('inputDescuento').select(); break;
      case 'F6': e.preventDefault(); nuevaFactura(); break;
      case 'Escape':
        if (isInput && $('buscarProd') === e.target && e.target.value) {
          e.target.value = '';
          e.target._prod = null;
          $('resultadosBusqueda').classList.remove('visible');
        } else if (isInput) {
          e.target.blur();
        }
        break;
      case 'Delete':
      case 'Del':
        if (selectedIdx >= 0 && selectedIdx < detalles.length) {
          e.preventDefault();
          quitarDetalle(selectedIdx);
        }
        break;
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); generarFactura(); }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'n' || e.key === 'N')) { e.preventDefault(); nuevaFactura(); }
  });

  document.querySelectorAll('.modal-overlay').forEach(function (el) {
    el.addEventListener('click', function (e) {
      if (e.target === el) el.classList.remove('abierto');
    });
  });

  window.cerrarModal = cerrarModal;

  cargarClientes();
  cargarProductos();
  cargarMetodosPago();
  cargarFacturas();
  renderDetalle();

})();
