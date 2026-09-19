# 🛒 CashFlow POS - Sistema de Punto de Venta y Gestión Financiera

[![React](https://shields.io)](https://react.dev)
[![TypeScript](https://shields.io)](https://typescriptlang.org)
[![Node.js](https://shields.io)](https://nodejs.org)
[![License: MIT](https://shields.io)](https://opensource.org)

**CashFlow POS** es una plataforma integral diseñada para pequeños y medianos negocios que integra un sistema de Punto de Venta eficiente con un control exhaustivo del flujo de caja diario. Permite registrar transacciones en tiempo real, gestionar el inventario y analizar las métricas financieras de manera intuitiva.

---

## ✨ Características Principales

*   **Punto de Venta (POS):** Procesamiento rápido de ventas con generación de tickets y desglose de impuestos.
*   **Control de Caja (Cashflow):** Registro minucioso de aperturas, cierres, ingresos adicionales y egresos de efectivo.
*   **Gestión de Inventario:** Control de stock automatizado tras cada transacción comercial con alertas de inventario bajo.
*   **Arquitectura Limpia:** Separación clara del cliente (Frontend en React) y el servidor (Backend en Node.js) mediante una API estructurada.

---

## 🛠️ Tecnologías Utilizadas

### Frontend (Client)
*   **React** con **TypeScript** para interfaces de usuario escalables y fuertemente tipadas.
*   Gestión de estados optimizada para flujos de caja y canastas de compras dinámicas.

### Backend (Server)
*   **Node.js** y **Express** estructurando una API REST rápida y modular.
*   Estructura de datos robusta configurada en la carpeta de entorno local.

---

## 🚀 Instalación y Configuración Local

Sigue estos pasos para levantar el entorno de desarrollo en tu máquina local de manera integrada:

### Prerrequisitos
Asegúrate de tener instalado [Node.js](https://nodejs.org) (versión 16 o superior).

### 1. Clonar el repositorio
```bash
git clone https://github.com
cd cashflow-pos
```

### 2. Configurar el Backend (Servidor)
Crea un archivo `.env` con al menos `JWT_SECRET` (genéralo con `openssl rand -hex 32`).
El servidor **no arranca** sin él (fail-fast por seguridad). Luego:
```bash
npm install
npm start        # producción   |   npm run dev  (con --watch)
```
*Nota: esto inicia el script central `server.js`. La API queda en `http://localhost:3000`.*

### 3. Configurar el Frontend (Cliente)
En una nueva terminal, dirígete al directorio del cliente:
```bash
cd client
npm install
npm run dev      # Vite en modo desarrollo (proxy a /api)
```

---

## 📁 Estructura del Proyecto

```text
├── server/          # Backend Node.js/Express (routes, database, middleware)
├── server.js        # Punto de entrada del servidor
├── client/          # Frontend React + TypeScript (Vite)
├── public/admin/    # Build del SPA (lo que sirve el backend en /admin)
├── docs/            # Documentación (openapi.yaml, specs/, rules.md)
├── scripts/         # Utilidades (seed-demo, sync-plane)
├── data/            # Base de datos SQLite (gitignoreada)
└── package.json     # Scripts y dependencias del backend
```

---

## 📚 Documentación de la API

El contrato HTTP completo (32 endpoints) está definido en **[`docs/openapi.yaml`](docs/openapi.yaml)**
(estándar OpenAPI 3.0). Para verla interactiva:

- Abrir en [https://editor.swagger.io](https://editor.swagger.io) → *File > Open* → `docs/openapi.yaml`
- Importar en **Postman/Insomnia** → *Import* → el mismo archivo (genera una colección)

> ⚠️ La API se documenta **tal como está hoy**: `/api/productos` devuelve claves abreviadas
> (`p/b/v/m/c`) y no todas las respuestas usan el envoltorio `{ ok, data, error }` de `docs/rules.md`.
> Ver la sección "Deuda de contrato" dentro del propio `openapi.yaml`.

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo para más detalles.
