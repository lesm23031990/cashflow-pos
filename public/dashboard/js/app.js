(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var toast = $('toast');

  function api(path, opts) {
    return fetch(path, opts || {}).then(function (r) {
      if (!r.ok) return r.json().then(function (e) { throw new Error(e.error || r.statusText); });
      return r.json();
    });
  }

  function fmt(n, frac) {
    frac = frac !== undefined ? frac : 0;
    return Number(n).toLocaleString('es-CO', { minimumFractionDigits: frac, maximumFractionDigits: frac });
  }

  function fmtMoneda(n, moneda) {
    var s = moneda === 'VES' ? 'Bs ' : '$';
    return s + fmt(n);
  }

  function hoy() {
    return new Date().toISOString().slice(0, 10);
  }

  function abrirModal(id) { $(id).classList.add('abierto'); }
  function cerrarModal(id) { $(id).classList.remove('abierto'); }

  function mostrarToast(msg, error) {
    if (!toast) return;
    toast.textContent = msg;
    toast.className = 'toast mostrar' + (error ? ' error' : '');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function () { toast.classList.remove('mostrar'); }, 2500);
  }

  function esc(s) {
    var d = document.createElement('div');
    d.appendChild(document.createTextNode(s));
    return d.innerHTML;
  }

  function cargarDashboard() {
    Promise.all([
      api('/api/facturas'),
      api('/api/productos'),
      api('/api/clientes'),
      api('/api/tasas')
    ]).then(function (results) {
      var facturas = results[0];
      var productos = results[1];
      var clientes = results[2];
      var tasas = results[3];

      var facturasHoy = facturas.filter(function (f) { return f.fecha.slice(0, 10) === hoy(); });
      var ingresosHoy = facturasHoy.reduce(function (sum, f) { return sum + f.total; }, 0);
      var ingresosTotal = facturas.reduce(function (sum, f) { return sum + f.total; }, 0);

      $('kpiFacturasHoy').textContent = facturasHoy.length;
      $('kpiIngresosHoy').textContent = fmtMoneda(ingresosHoy);
      $('kpiTotalIngresos').textContent = fmtMoneda(ingresosTotal);
      $('kpiProductos').textContent = productos.length;
      $('kpiClientes').textContent = clientes.length;
      $('kpiFacturasTotal').textContent = facturas.length;

      $('tasaUsdDisplay').textContent = '1 USD = ' + fmt(tasas.usd) + ' COP';
      $('tasaVesDisplay').textContent = '1 VES = ' + fmt(tasas.ves, 1) + ' COP';

      // Badge
      $('badgeUsd').textContent = fmt(tasas.usd);
      $('badgeVes').textContent = fmt(tasas.ves, 1);

      var tbody = $('facturasBody');
      if (facturas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#475569;padding:.75rem">Sin facturas</td></tr>';
        return;
      }
      tbody.innerHTML = '';
      facturas.slice(0, 15).forEach(function (f) {
        var sim = f.moneda === 'COP' ? '$' : f.moneda === 'USD' ? '$' : 'Bs ';
        var tr = document.createElement('tr');
        tr.innerHTML =
          '<td>' + f.id + '</td>' +
          '<td>' + esc(f.cliente_nombre) + '</td>' +
          '<td>' + f.fecha.slice(0, 10) + '</td>' +
          '<td class="col-price">' + sim + fmt(f.total) + '</td>' +
          '<td>' + f.moneda + '</td>';
        tbody.appendChild(tr);
      });
    }).catch(function (err) {
      console.error('Dashboard error:', err);
    });
  }

  window.abrirModalTasas = function () {
    api('/api/tasas').then(function (t) {
      $('editTasaUsd').value = t.usd;
      $('editTasaVes').value = t.ves;
      abrirModal('modalTasas');
    });
  };

  window.guardarTasas = function () {
    var usd = parseFloat($('editTasaUsd').value);
    var ves = parseFloat($('editTasaVes').value);
    if (!usd || usd <= 0) { mostrarToast('Tasa USD inv\u00e1lida', true); return; }
    if (!ves || ves <= 0) { mostrarToast('Tasa VES inv\u00e1lida', true); return; }

    api('/api/tasas', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usd: usd, ves: ves })
    }).then(function () {
      cerrarModal('modalTasas');
      mostrarToast('Tasas actualizadas');
      cargarDashboard();
    }).catch(function (err) { mostrarToast(err.message, true); });
  };

  window.cerrarModal = cerrarModal;

  document.querySelectorAll('.modal-overlay').forEach(function (el) {
    el.addEventListener('click', function (e) {
      if (e.target === el) el.classList.remove('abierto');
    });
  });

  cargarDashboard();
  setInterval(cargarDashboard, 30000);
})();
