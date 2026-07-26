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

1. Escribir spec en Plane.so (Issue con template) o local en `docs/specs/`
2. `npm run plane:pull` — Traer issues de Plane.so como specs locales
3. Crear rama `feature/nombre-de-la-spec`
4. `npm test` — Escribir tests primero (que fallan) y confirmar que fallan
5. Implementar hasta que `npm test` pase
6. `npm run plane:push` — Sincronizar cambios a Plane.so
7. Hacer PR y cerrar el Issue en Plane

## Integración con Plane.so

Requiere variables de entorno (ver `.env.example`):

| Variable | Descripción |
|---|---|
| `PLANE_API_KEY` | Token de API de Plane.so |
| `PLANE_WORKSPACE` | Slug del workspace |
| `PLANE_PROJECT` | ID del proyecto |

Comandos:
- `npm run plane:pull` — Descarga issues abiertos como specs en `docs/specs/`
- `npm run plane:push` — Sube cambios locales a Plane.so
- `npm run plane:status` — Compara estado local vs remoto

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
