# Spec: Landing Page de Presentación

**Prioridad:** Media
**Estado:** draft

---

## Descripción

Crear una landing page pública (no protegida por auth) que muestre el proyecto como portafolio. Debe verse profesional y permitir acceder al POS o al admin demo.

### Alcance

1. **Ruta pública `/`**
   - No requiere autenticación
   - Sirve la landing page
   - Links para acceder a `/admin` (POS) y `/admin/demo` (modo demo)

2. **Secciones de la landing**
   - **Hero**: Título "Cashflow POS", subtítulo "Sistema de punto de venta multi-moneda", CTA buttons ("Ver Demo", "Acceder")
   - **Features**: Cards con iconos mostrando:
     - Multi-moneda (COP, USD, VES)
     - Escáner de código de barras
     - Facturación rápida
     - Dashboard con KPIs
     - Actualización masiva desde fotos
     - Cierre de caja
   - **Screenshot/Mockup**: Captura o mockup del POS en acción
   - **Tech Stack**: Badges de tecnologías usadas (React, Express, SQLite, TypeScript)
   - **Footer**: Links a GitHub, créditos

3. **Diseño**
   - Dark theme consistente con el POS
   - Animaciones sutiles al hacer scroll
   - Responsive (mobile, tablet, desktop)
   - Gradientes modernos como fondo
   - Tipografía profesional

4. **Implementación técnica**
   - Nueva página `Landing.tsx` en `client/src/components/`
   - Ruta `/` en `App.tsx` que muestra Landing (sin auth)
   - Rutas `/admin/*` protegidas por auth
   - Ruta `/admin/demo` que activa modo demo automáticamente
   - CSS dedicado para landing o integrado en App.css

## Comportamiento

- Landing accesible sin login
- Botón "Ver Demo" lleva a `/admin/demo` con `VITE_DEMO_MODE=true`
- Botón "Acceder" lleva a `/admin` con login normal
- Animaciones suaves al entrar/hacer scroll
- Responsive: en mobile las secciones se apilan verticalmente

## Acceptance Criteria

- [ ] Ruta `/` muestra landing page sin autenticación
- [ ] Hero section con título, subtítulo y CTAs
- [ ] Sección de features con al menos 6 cards
- [ ] Sección de tech stack con badges
- [ ] Footer con link a GitHub
- [ ] Diseño responsive funciona en mobile
- [ ] Animaciones al scroll funcionan correctamente
- [ ] Botón "Ver Demo" activa modo demo
- [ ] Botón "Acceder" lleva a login normal
- [ ] Landing se ve profesional y consistente con el POS
- [ ] Build de producción incluye landing page

---

## Tareas Técnicas

- [ ] Crear `client/src/components/Landing.tsx`
- [ ] Agregar ruta `/` en `App.tsx` sin protección de auth
- [ ] Crear estilos CSS para landing
- [ ] Agregar animaciones de scroll
- [ ] Crear ruta `/admin/demo` que activa demo mode
- [ ] Verificar responsive design
- [ ] Verificar build de producción limpio
- [ ] Actualizar server.js para servir landing en `/`
