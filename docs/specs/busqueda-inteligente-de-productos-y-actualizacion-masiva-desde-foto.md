# Spec: Búsqueda inteligente de productos y actualización masiva desde foto

**Plane Issue:** 9c778a30-4817-4be3-bb58-e2386bacb23b
**Prioridad:** Media
**Estado:** backlog

---

## Descripción

Especificación 1: Búsqueda inteligente con lector de código de barras1. Escaneo global de código de barras- El lector debe funcionar desde cualquier parte de la página

- No requiere que el input esté enfocado

- Al escanear un código, el input de búsqueda se enfoca automáticamente

2. Búsqueda inteligente- El input busca por: código de barras, nombre, marca o categoría

- Muestra resultados en tiempo real mientras se escribe

3. Producto no encontrado- Si el código de barras escaneado no existe en la DB:

- Abre automáticamente el formulario de creación de producto

- Pre-carga el campo código de barras con el valor escaneado

4. Edición inline (doble clic)- Por defecto los campos del producto son solo lectura

- Al hacer doble clic en un campo, se habilita para edición

- Al perder el foco o presionar Enter, se guarda automáticamente

5. Conversión de moneda- Todos los precios se almacenan en COP como única fuente de verdad

- Según la tasa del día (USD/VES), se calcula y muestra el precio equivalente

- La tasa se obtiene del endpoint /api/tasas

6. Input de búsqueda sticky- El input de búsqueda debe permanecer visible siempre al hacer scroll

- En versión minimalista cuando se hace scroll: solo el input, sin otros elementos

- Debe estar ubicado en la parte superior de la página

Especificación 2: Actualización masiva de precios desde foto de factura1. Subir imagen- Botón para subir la foto de la factura (desde WhatsApp)

- La imagen se muestra en pantalla para consulta visual

2. Matching inteligente por nombre + marca- El sistema intenta sugerir el producto correcto buscando por nombre y marca

- NO se usa código de barras para el matching

- La búsqueda prioriza: nombre del producto + marca + presentación

- Muestra el producto sugerido pero permite cambiarlo manualmente

3. Editor lado a lado- Pantalla dividida: foto a la izquierda, editor a la derecha

- Cada fila muestra: producto sugerido | input de precio nuevo

- Las filas tienen un checkbox de verificación

4. Verificación manual- Cada fila tiene un checkbox de verificación

- Si el producto sugerido es incorrecto, se puede cambiar manualmente

- Si el producto no existe, se crea automáticamente con código de barras vacío

5. Guardado- Un solo botón "Guardar todo"

- Solo guarda las filas verificadas

- Actualiza precios de existentes, crea nuevos con código vacío

Criterios de aceptación-  Escanear código en cualquier parte de la página enfoca el input

-  Búsqueda por código de barras, nombre, marca y categoría

-  Si código no existe, abre modal de nuevo producto

-  Doble clic en campo permite edición inline

-  Al perder foco se guarda el cambio

-  Precios se muestran en COP, USD y VES según tasa del día

-  Input de búsqueda siempre visible al hacer scroll

-  Se puede subir foto de factura y se muestra en pantalla

-  El sistema sugiere el producto por nombre + marca

-  El usuario verifica manualmente cada coincidencia antes de guardar

-  Si la sugerencia es incorrecta, se puede cambiar el producto

-  Si el producto no existe, se crea con código de barras vacío

-  Guardado masivo con un solo clic

## Criterios de aceptación

- [ ] Pendiente de definir

---

> ⚡ Sincronizado desde Plane.so el 2026-07-26
