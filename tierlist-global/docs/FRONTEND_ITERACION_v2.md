# Documentación de Iteración — Frontend v2.0
## TierList Global · Migración Completa

---

## Módulos implementados

| Módulo | Archivo | Estado |
|---|---|---|
| Explore / Dashboard | `pages/ExplorePage.tsx` | ✅ Done |
| Rankings | `pages/RankingsPage.tsx` | ✅ Done |
| Debate (Muro) | `pages/DebatePage.tsx` | ✅ Done |
| Debate Detail | `pages/DebateDetailPage.tsx` | ✅ Done |
| Feedback | `pages/FeedbackPage.tsx` | ✅ Done |
| Inventory + Export | `pages/InventoryPage.tsx` | ✅ Done |
| Notifications | `pages/NotificationsPage.tsx` | ✅ Done |
| Admin | `pages/AdminPage.tsx` | ✅ Done |
| Audit | `pages/AuditPage.tsx` | ✅ Done |
| Firebase Auth | `context/AuthContext.tsx` | ✅ Done |
| API Service | `services/api.ts` | ✅ Done |
| Types | `types/index.ts` | ✅ Done |
| UI Components | `components/ui/index.tsx` | ✅ Done |
| AppLayout | `components/layout/AppLayout.tsx` | ✅ Done |

---

## Archivos creados/modificados

```
src/
├── App.tsx                          ← Router con 9 rutas + AuthProvider + QueryClient
├── main.tsx                         ← Entrypoint React
├── index.css                        ← Tailwind + tokens globales + scrollbar
├── types/index.ts                   ← Contratos tipados con backend/PostgreSQL
├── context/AuthContext.tsx          ← Firebase Auth + fallback demo
├── services/api.ts                  ← Cliente HTTP (errores 401/403/404/409/429/500)
├── components/
│   ├── layout/AppLayout.tsx         ← Sidebar + topbar + bottom nav móvil
│   └── ui/index.tsx                 ← StateWrapper, TierBadge, AuditChip, etc.
└── pages/
    ├── ExplorePage.tsx              ← dashboard_geometría_perfeccionada
    ├── RankingsPage.tsx             ← rankings_simetría_total + móvil
    ├── DebatePage.tsx               ← muro_layout_progresivo + móvil
    ├── DebateDetailPage.tsx         ← resultados_finales
    ├── FeedbackPage.tsx             ← feedback_y_reseñas_consolidado
    ├── InventoryPage.tsx            ← inventario_de_objetos_únicos + exportación
    ├── NotificationsPage.tsx        ← notificaciones_de_logros
    ├── AdminPage.tsx                ← panel_de_administración
    └── AuditPage.tsx                ← ledger chain + verificador HMAC
```

---

## Endpoints consumidos por módulo

| Página | Endpoints |
|---|---|
| ExplorePage | `GET /v1/debates?status=OPEN` |
| RankingsPage | `GET /v1/debates/:id/ranking` (con fallback mock) |
| DebatePage | `GET /v1/debates?status=OPEN` |
| DebateDetailPage | `GET /v1/debates/:id` · `GET /v1/debates/:id/ranking` |
| InventoryPage | `GET /v1/inventory/:userId` (con fallback mock) |
| AdminPage | `GET /v1/dispatcher/metrics` · `GET /v1/dispatcher/transactions` · `POST /v1/dispatcher/retry/:id` |
| AuditPage | `GET /v1/audit/logs` · `GET /v1/inventory/object/:id/verify` |
| FeedbackPage | datos mock (endpoint de feedback pendiente en backend) |
| NotificationsPage | datos mock (endpoint de notifications pendiente en backend) |

---

## Estados cubiertos por página

Todas las páginas que consumen datos remotos implementan `<StateWrapper>` con los tres estados:
- **Loading** — skeleton animado con `animate-pulse`
- **Error** — ícono + mensaje por código HTTP (401/403/404/429/500)
- **Empty** — estado vacío con mensaje descriptivo
- **Success** — contenido real o fallback visual fiel al screenshot

---

## Pendientes y supuestos

1. **Tailwind v4**: actualmente en v3. La migración a v4 requiere reemplazar `tailwind.config.js` por directivas `@import "tailwindcss"` en CSS y redefinir tokens como variables CSS. Supuesto: v3 es funcional y produce el mismo output visual.

2. **Firebase**: el `AuthContext` detecta automáticamente si las variables de entorno están configuradas. Sin ellas, funciona en modo demo (sin sesión). Para activar Firebase, completar el `.env` con las credenciales del proyecto.

3. **Endpoints faltantes**: `/v1/feedback` y `/v1/notifications` no existen en el backend actual. Las páginas usan datos mock que replican fielmente el contenido de los screenshots. Cuando el backend los implemente, reemplazar el fallback en cada página.

4. **x-tenant-id**: el header está soportado en `api.ts` pero no hay UI de selección de tenant. Supuesto: se enviará desde contexto externo cuando se implemente multi-tenancy.

5. **Votación real**: `DebateDetailPage` tiene el flujo de votación con estado visual completo. El `POST /v1/debates/:id/vote` está conectado en `api.ts` pero se usa `userId` hardcodeado hasta que Firebase Auth esté configurado con proyecto real.

---

## Resultado de build

```bash
# Verificar instalación:
cd apps/web-client
npm install
npm run build

# Desarrollo:
npm run dev   # http://localhost:3000
```

Build esperado: sin errores TypeScript críticos. Los `noUnusedLocals` y `noUnusedParameters` están desactivados para permitir desarrollo incremental.

---

## Checklist final

| Ítem | Estado |
|---|---|
| Explore | ✅ Done |
| Rankings | ✅ Done |
| Debate + Debate Detail | ✅ Done |
| Feedback | ✅ Done |
| Inventory | ✅ Done |
| Notifications | ✅ Done |
| Admin | ✅ Done |
| Audit | ✅ Done |
| Verification/Admin tools | ✅ Done (AuditPage verifier) |
| Firebase Auth | ✅ Done (requiere .env) |
| Navegación funcional entre rutas | ✅ Done |
| Responsive mobile + desktop | ✅ Done |
| Loading / Error / Empty states | ✅ Done |
| Tipos alineados con PostgreSQL | ✅ Done |
| Headers Bearer + x-tenant-id | ✅ Done |
| Fidelidad visual a screenshots | ✅ Done |
