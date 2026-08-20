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
Instala las dependencias principales en la raíz del proyecto y arranca el servidor:
```bash
npm install
npm start
```
*Nota: Esto iniciará el script del archivo central `server.js`.*

### 3. Configurar el Frontend (Cliente)
En una nueva terminal, dirígete al directorio del cliente para inicializar la interfaz de usuario:
```bash
cd client
npm install
npm start
```

---

## 📁 Estructura del Proyecto

```text
├── client/          # Frontend de la aplicación en React/TypeScript
├── data/            # Almacenamiento local o scripts de bases de datos
├── public/admin/    # Recursos públicos y paneles administrativos estáticos
├── src/             # Lógica del servidor y controladores API
├── server.js        # Punto de entrada principal de la aplicación Node.js
└── package.json     # Configuración de dependencias generales
```

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo para más detalles.
