# Spec: UI Profesional del POS

**Prioridad:** Alta
**Estado:** draft

---

## Descripción

Refactorizar los estilos del frontend para que el POS se vea profesional, limpio y moderno. Objetivo: listo para mostrar como portafolio/demo.

### Alcance

1. **Sistema de diseño consistente**
   - Paleta de colores profesional (dark theme refinado)
   - Tipografía consistente y jerárquica
   - Espaciado uniforme (8px grid system)
   - Bordes redondeados consistentes
   - Sombras sutiles para profundidad

2. **Login Page**
   - Logo/branding centrado
   - Formulario limpio con inputs modernos
   - Fondo con gradiente sutil o patrón
   - Animación suave al cargar

3. **Topbar/Navbar**
   - Logo + nombre de la app
   - Navegación clara (Dashboard, Facturación, Productos)
   - Indicador de tasas de cambio elegante
   - Avatar/usuario a la derecha
   - Separación visual clara

4. **Dashboard**
   - KPI cards con iconos, números grandes y labels claros
   - Tabla de facturas recientes con hover states
   - Sección de tasas de cambio visualmente atractiva
   - Layout en grid responsive

5. **Facturación (POS)**
   - Layout split limpio: productos | carrito
   - Cards para cada producto con hover effects
   - Carrito con items bien diferenciados
   - Totales prominentes al final
   - Botones de acción claros y accesibles
   - Atajos de teclado visibles como help bar

6. **ProductTable**
   - Filas con hover states
   - Edición inline con indicadores visuales claros
   - Búsqueda sticky con diseño refinado
   - Badge de categoría/color por tipo

7. **Modales**
   - Backdrop con blur
   - Contenido centrado con max-width
   - Animación de entrada suave
   - Botones de acción bien diferenciados
   - Cerrar con ESC o clic fuera

8. **Toast Notifications**
   - Posición fija arriba-derecha
   - Iconos por tipo (éxito, error, info)
   - Animación de entrada/salida
   - Auto-dismiss con progress bar visual

## Comportamiento

- Dark theme por defecto
- Transiciones suaves en hover/focus (200ms ease)
- Focus visible en todos los elementos interactivos
- Responsive básico (min 1024px para POS)
- Sin emojis, usar iconos SVG inline

## Acceptance Criteria

- [ ] Login page se ve profesional con branding consistente
- [ ] Topbar tiene navegación clara con estados activos
- [ ] Dashboard muestra KPIs con diseño de cards moderno
- [ ] Facturación tiene layout split claro y profesional
- [ ] ProductTable tiene hover states y edición inline visualmente clara
- [ ] Modales tienen backdrop blur y animación de entrada
- [ ] Toasts se ven profesionales con iconos y animaciones
- [ ] Paleta de colores es consistente en toda la app
- [ ] Tipografía tiene jerarquía clara (h1, h2, body, small)
- [ ] Todos los inputs tienen focus states visibles
- [ ] El servidor arranca sin errores de CSS/estilos
- [ ] Build de producción genera CSS limpio

---

## Tareas Técnicas

- [ ] Crear variables CSS custom properties en `:root`
- [ ] Refactorizar `App.css` con sistema de diseño
- [ ] Mejorar componente `Login.tsx` con estilos profesionales
- [ ] Rediseñar `Topbar` con navegación moderna
- [ ] Mejorar `Dashboard.tsx` con KPI cards
- [ ] Refinar `Facturacion.tsx` layout split
- [ ] Pulir `ProductTable.tsx` con hover states
- [ ] Mejorar modales con backdrop blur y animaciones
- [ ] Refinar `Toast.tsx` con iconos SVG
- [ ] Verificar build de producción limpio
