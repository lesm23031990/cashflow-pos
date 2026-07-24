# Reglas Generales del Proyecto — Cashflow POS

## Stack

| Capa | Tecnología |
|---|---|
| Backend | Node.js + Express |
| Base de datos | SQLite (sql.js) |
| Frontend | React 19 + TypeScript 6 + Vite 8 |
| Admin SPA | Build en `public/admin/` |
| Auth | JWT (jsonwebtoken) |

## Estructura

```
cashflow-pos/
├── server.js              # Entry point
├── server/                # Backend
│   ├── app.js
│   ├── database/
│   │   ├── connection.js
│   │   └── seed.js
│   ├── middleware/
│   │   └── auth.js
│   └── routes/
│       ├── auth.js, productos.js, clientes.js, facturas.js, etc.
├── client/                # React (Vite + TypeScript)
├── public/admin/          # Build del admin SPA
├── scripts/               # Scripts útiles
├── data/                  # DB SQLite
├── .github/workflows/     # CI/CD
└── docs/                  # Documentación
```

## Workflow SDD (Spec-Driven Development)

1. Escribir spec en Plane (Issue con template)
2. Crear rama `feature/nombre-de-la-spec`
3. Escribir tests primero (que fallan)
4. Implementar hasta que los tests pasen
5. Hacer PR y cerrar el Issue en Plane

## Convenciones de Código

| Aspecto | Regla |
|---|---|
| Ramas | `feature/<nombre>`, `fix/<nombre>`, `chore/<nombre>` |
| Commits | Prefijo tipo: `feat:`, `fix:`, `chore:`, `docs:`, `test:` |
| Backend | CommonJS (`require`), inglés para código, español para textos |
| Frontend | TypeScript, PascalCase en componentes, camelCase en funciones/vars |
| Respuestas API | Formato consistente: `{ ok, data?, error? }` |

## Definition of Done

- [ ] La spec en Plane está actualizada
- [ ] Los tests automatizados pasan
- [ ] El código está en una rama con PR
- [ ] El servidor arranca sin errores
- [ ] Se cerró el Issue en Plane
