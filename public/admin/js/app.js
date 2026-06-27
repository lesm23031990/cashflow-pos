(function () {
  'use strict';

  var productos = [];
  var editandoId = null;

  var $ = function (id) { return document.getElementById(id); };

  var tasaUsd = $('tasaUsd');
  var tasaVes = $('tasaVes');
  var searchAdmin = $('searchAdmin');
  var adminBody = $('adminBody');
  var totalCount = $('totalCount');
  var modalOverlay = $('modalOverlay');
  var modalTitle = $('modalTitle');
  var frmProducto = $('frmProducto');
  var frmMarca = $('frmMarca');
  var frmCategoria = $('frmCategoria');
  var frmPrecio = $('frmPrecio');
  var btnGuardar = $('btnGuardar');
  var toast = $('toast');

  // ─── API helper ──────────────────────────────────────────

  function api(path, opts) {
    return fetch(path, opts || {}).then(function (r) {
      if (!r.ok) return r.json().then(function (e) { throw new Error(e.error || r.statusText); });
      return r.json();
    });
  }

  // ─── Init ────────────────────────────────────────────────

  function init() {
    api('/api/tasas').then(function (t) {
      tasaUsd.value = t.usd;
      tasaVes.value = t.ves;
    }).catch(function () { mostrarToast('Error al cargar tasas', true); });
    cargarProductos();
  }

  function cargarProductos() {
    adminBody.innerHTML = '<tr><td colspan="7" class="cargando">Cargando...</td></tr>';
    api('/api/productos').then(function (data) {
      productos = data;
      renderTabla();
    }).catch(function () {
      adminBody.innerHTML = '<tr><td colspan="7" class="vacio">Error de conexi\u00f3n</td></tr>';
    });
  }

  // ─── Tasas ───────────────────────────────────────────────

  var _timerTasas;
  function tasaCambiada() {
    clearTimeout(_timerTasas);
    _timerTasas = setTimeout(function () {
      var usd = parseFloat(tasaUsd.value) || 0;
      var ves = parseFloat(tasaVes.value) || 0;
      api('/api/tasas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usd: usd, ves: ves })
      }).catch(function () {});
      renderTabla();
    }, 500);
  }

  tasaUsd.addEventListener('input', tasaCambiada);
  tasaVes.addEventListener('input', tasaCambiada);

  // ─── Render ──────────────────────────────────────────────

  function renderTabla() {
    var filtro = searchAdmin.value.toLowerCase().trim();
    var usd = parseFloat(tasaUsd.value) || 0;
    var ves = parseFloat(tasaVes.value) || 0;

    var lista = filtro
      ? productos.filter(function (item) {
          var txt = (item.p + ' ' + (item.m || '') + ' ' + (item.c || '')).toLowerCase();
          return txt.indexOf(filtro) !== -1;
        })
      : productos;

    if (lista.length === 0) {
      adminBody.innerHTML = '<tr><td colspan="7" class="vacio">No hay productos</td></tr>';
      totalCount.textContent = productos.length;
      return;
    }

    adminBody.innerHTML = '';
    for (var i = 0; i < lista.length; i++) {
      var item = lista[i];
      var idx = productos.indexOf(item);
      var cop = item.v;
      var usdVal = usd > 0 ? cop / usd : 0;
      var vesVal = ves > 0 ? cop / ves : 0;

      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + esc(item.p) + '</td>' +
        '<td>' + esc(item.m || '') + '</td>' +
        '<td>' + esc(item.c || '') + '</td>' +
        '<td class="precio-cop">$' + Number(cop).toLocaleString('es-CO') + '</td>' +
        '<td class="precio-usd">$' + Number(usdVal).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</td>' +
        '<td class="precio-ves">Bs ' + Number(vesVal).toLocaleString('es-CO', { maximumFractionDigits: 2 }) + '</td>' +
        '<td class="acciones">' +
        '<button class="btn-edit" data-idx="' + idx + '" title="Editar">\u270F\uFE0F</button>' +
        '<button class="btn-del" data-idx="' + idx + '" title="Eliminar">\u2716\uFE0F</button>' +
        '</td>';
      adminBody.appendChild(tr);
    }

    totalCount.textContent = productos.length;
  }

  function esc(s) {
    var d = document.createElement('div');
    d.appendChild(document.createTextNode(s));
    return d.innerHTML;
  }

  searchAdmin.addEventListener('input', renderTabla);

  // Delegación de eventos para botones de acción
  adminBody.addEventListener('click', function (e) {
    var target = e.target;
    if (target.classList.contains('btn-edit')) {
      editarProducto(parseInt(target.getAttribute('data-idx')));
    } else if (target.classList.contains('btn-del')) {
      eliminarProducto(parseInt(target.getAttribute('data-idx')));
    }
  });

  // ─── CRUD ────────────────────────────────────────────────

  function abrirFormulario(item) {
    editandoId = null;
    modalTitle.textContent = 'Nuevo producto';
    frmProducto.value = item ? item.p : '';
    frmMarca.value = item ? (item.m || '') : '';
    frmCategoria.value = item ? (item.c || 'Otra') : 'Otra';
    frmPrecio.value = item ? item.v : '';
    btnGuardar.textContent = item ? 'Actualizar' : 'Guardar';
    modalOverlay.classList.add('abierto');
    frmProducto.focus();
  }

  function cerrarFormulario() {
    modalOverlay.classList.remove('abierto');
  }

  modalOverlay.addEventListener('click', function (e) {
    if (e.target === modalOverlay) cerrarFormulario();
  });

  $('btnCancelar').addEventListener('click', cerrarFormulario);
  $('btnNuevo').addEventListener('click', function () { abrirFormulario(); });
  btnGuardar.addEventListener('click', guardarProducto);

  // Enter en campos del formulario
  frmPrecio.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') guardarProducto();
  });

  function guardarProducto() {
    var p = frmProducto.value.trim();
    var m = frmMarca.value.trim();
    var c = frmCategoria.value;
    var v = parseFloat(frmPrecio.value);

    if (!p) { mostrarToast('El nombre es obligatorio', true); frmProducto.focus(); return; }
    if (!v || v <= 0) { mostrarToast('Precio inv\u00e1lido', true); frmPrecio.focus(); return; }

    btnGuardar.disabled = true;
    btnGuardar.textContent = 'Guardando...';

    var body = { nombre: p, marca: m || 'Gen\u00e9rico', categoria: c, precio_cop: v };
    var url = editandoId !== null
      ? '/api/productos/' + productos[editandoId].id
      : '/api/productos';
    var method = editandoId !== null ? 'PUT' : 'POST';

    api(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(function () {
      mostrarToast(editandoId !== null ? 'Producto actualizado' : 'Producto agregado');
      cerrarFormulario();
      cargarProductos();
    }).catch(function (err) {
      mostrarToast(err.message || 'Error', true);
    }).finally(function () {
      btnGuardar.disabled = false;
      btnGuardar.textContent = editandoId !== null ? 'Actualizar' : 'Guardar';
    });
  }

  function editarProducto(idx) {
    editandoId = idx;
    var item = productos[idx];
    modalTitle.textContent = 'Editar producto';
    frmProducto.value = item.p;
    frmMarca.value = item.m || '';
    frmCategoria.value = item.c || 'Otra';
    frmPrecio.value = item.v;
    btnGuardar.textContent = 'Actualizar';
    modalOverlay.classList.add('abierto');
    frmProducto.focus();
  }

  function eliminarProducto(idx) {
    var item = productos[idx];
    if (!confirm('\u00bfEliminar "' + item.p + '"?')) return;
    api('/api/productos/' + item.id, { method: 'DELETE' }).then(function () {
      mostrarToast('Producto eliminado');
      cargarProductos();
    }).catch(function (err) {
      mostrarToast(err.message || 'Error', true);
    });
  }

  // ─── Exportar ────────────────────────────────────────────

  $('btnExportar').addEventListener('click', function () {
    var btn = this;
    btn.disabled = true;
    btn.textContent = 'Exportando...';
    api('/api/productos/exportar').then(function (data) {
      var json = JSON.stringify(data, null, 2);
      var blob = new Blob([json], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'productos.json';
      a.click();
      URL.revokeObjectURL(url);
      mostrarToast('Exportado como productos.json');
    }).catch(function (err) {
      mostrarToast(err.message || 'Error', true);
    }).finally(function () {
      btn.disabled = false;
      btn.textContent = 'Exportar';
    });
  });

  // ─── Toast ───────────────────────────────────────────────

  function mostrarToast(msg, error) {
    toast.textContent = msg;
    toast.className = 'toast mostrar' + (error ? ' error' : '');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function () { toast.classList.remove('mostrar'); }, 2000);
  }

  // ─── Arranque ────────────────────────────────────────────

  init();
})();
