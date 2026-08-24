# Spec: Modo Demo con Datos Quemados

**Prioridad:** Alta
**Estado:** draft

---

## Descripción

Implementar un modo demo que permita mostrar el POS sin necesidad de tener el backend corriendo. Útil para presentaciones, portafolio y pruebas rápidas.

### Alcance

1. **Datos quemados (mock data)**
   - 20+ productos de ejemplo con precios realistas
   - Tasas de cambio demo (USD: 3500, VES: 4.70)
   - Cliente por defecto "Mostrador"
   - Métodos de pago: Efectivo, Débito, Pago Móvil
   - 5 facturas recientes de ejemplo para dashboard
   - KPIs calculados para demo

2. **Activación del modo demo**
   - Variable de entorno `VITE_DEMO_MODE=true`
   - Si está activo, intercepta todas las llamadas a la API
   - Retorna datos mock en lugar de llamar al backend
   - Indicador visual claro en la UI: "MODO DEMO" badge en topbar

3. **Componentes afectados**
   - Login: acepta cualquier credencial o auto-login
   - Dashboard: muestra KPIs y facturas mock
   - Facturación: productos mock, carrito funcional, cálculo de cambio
   - ProductTable: lista de productos mock con búsqueda funcional
   - TasasContext: tasas mock fijas

4. **Comportamiento en modo demo**
   - Login: auto-login al cargar, credenciales no importan
   - Productos: CRUD simulado (agregar/editar funciona en memoria)
   - Facturas: creación simulada con IDs temporales
   - Tasas: fijas, no editables en demo (mostrar como informativo)
   - Badge "MODO DEMO" visible en topbar (color amarillo/naranja)
   - Toast informativo al entrar: "Estás en modo demo - los datos no se guardan"

## Request/Response (interceptados en modo demo)

### GET /api/config
```json
{ "ok": true, "data": { "nombre": "Cashflow POS Demo" } }
```

### POST /api/auth/login
```json
{ "ok": true, "data": { "token": "demo-token-fake" } }
```

### GET /api/productos
```json
{
  "ok": true,
  "data": [
    { "id": 1, "nombre": "Corona 355ml", "codigo_barras": "7501000123456", "precio_cop": 4500, "marca": "Corona", "categoria": "Cervezas" },
    ...
  ]
}
```

### GET /api/tasas
```json
{ "ok": true, "data": { "id": 1, "usd": 3500, "ves": 4.70 } }
```

## Acceptance Criteria

- [ ] Con `VITE_DEMO_MODE=true` la app funciona sin backend
- [ ] Login funciona con cualquier credencial
- [ ] Dashboard muestra KPIs y facturas de ejemplo
- [ ] Lista de productos muestra datos mock
- [ ] Búsqueda de productos funciona con datos mock
- [ ] Carrito de facturación funciona con cálculo de totales
- [ ] Cambio calculado en COP/USD/VES funciona en demo
- [ ] Badge "MODO DEMO" visible en topbar
- [ ] Toast informativo al entrar en modo demo
- [ ] Sin `VITE_DEMO_MODE` funciona normal con backend
- [ ] Build de producción incluye modo demo si variable está activa

---

## Tareas Técnicas

- [ ] Crear archivo `client/src/demo-data.ts` con datos mock
- [ ] Crear archivo `client/src/demo-api.ts` que intercepta llamadas API
- [ ] Modificar `client/src/api.ts` para usar demo-api si `VITE_DEMO_MODE`
- [ ] Actualizar `Login.tsx` para auto-login en demo
- [ ] Agregar badge "MODO DEMO" en `App.tsx` topbar
- [ ] Agregar toast informativo al entrar en demo
- [ ] Verificar que sin demo mode funciona con backend real
- [ ] Documentar cómo activar modo demo en README
