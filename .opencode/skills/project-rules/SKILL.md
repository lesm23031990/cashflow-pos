---
name: project-rules
description: Project conventions, stack, structure and Definition of Done for Cashflow POS.
---

## Stack

| Layer | Technology |
|---|---|
| Backend | Node.js + Express |
| Database | SQLite (sql.js) |
| Frontend | React 19 + TypeScript 6 + Vite 8 |
| Admin SPA | Build in `public/admin/` |
| Auth | JWT (jsonwebtoken) |

## Structure

```
cashflow-pos/
├── server.js              # Entry point
├── server/                # Backend code
│   ├── app.js
│   ├── database/
│   ├── middleware/
│   └── routes/
├── client/                # React frontend
├── public/admin/          # Admin SPA build
├── scripts/               # Utility scripts
├── data/                  # SQLite DB
├── docs/                  # Documentation
└── .github/workflows/     # CI/CD
```

## Conventions

| Aspect | Rule |
|---|---|
| Branches | `feature/<name>`, `fix/<name>`, `chore/<name>` |
| Commits | Prefix: `feat:`, `fix:`, `chore:`, `docs:`, `test:` |
| Backend | CommonJS (`require`), English for code, Spanish for texts |
| Frontend | TypeScript, PascalCase components, camelCase functions/vars |
| API responses | `{ ok, data?, error? }` |

## Definition of Done

- [ ] The spec in Plane is updated
- [ ] Automated tests pass
- [ ] Code is in a branch with PR
- [ ] Server starts without errors
- [ ] The Plane issue is closed
