(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };

  function api(path) {
    return fetch(path).then(function (r) {
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

      // KPIs
      var facturasHoy = facturas.filter(function (f) { return f.fecha.slice(0, 10) === hoy(); });
      var ingresosHoy = facturasHoy.reduce(function (sum, f) { return sum + f.total; }, 0);
      var ingresosTotal = facturas.reduce(function (sum, f) { return sum + f.total; }, 0);

      $('kpiFacturasHoy').textContent = facturasHoy.length;
      $('kpiIngresosHoy').textContent = fmtMoneda(ingresosHoy);
      $('kpiTotalIngresos').textContent = fmtMoneda(ingresosTotal);
      $('kpiProductos').textContent = productos.length;
      $('kpiClientes').textContent = clientes.length;
      $('kpiFacturasTotal').textContent = facturas.length;

      // Tasas
      $('tasaUsdDisplay').textContent = '1 USD = ' + fmt(tasas.usd) + ' COP';
      $('tasaVesDisplay').textContent = '1 VES = ' + fmt(tasas.ves, 1) + ' COP';

      // Facturas recientes
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

  function esc(s) {
    var d = document.createElement('div');
    d.appendChild(document.createTextNode(s));
    return d.innerHTML;
  }

  cargarDashboard();
  setInterval(cargarDashboard, 30000);
})();
