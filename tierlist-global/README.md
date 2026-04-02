# TierList Global — Ecosistema de Consenso Auditado

> Plataforma de debate y votación pública donde la opinión colectiva se convierte en valor verificable. Cada voto queda registrado en un **Sovereign Ledger** con encadenamiento HMAC-SHA256 e integración asíncrona con el **Sistema de Votos y Puntos (SVP)**.

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| Backend API | Node.js (Express) + TypeScript |
| ORM | TypeORM |
| Base de datos | PostgreSQL 16 |
| Cache / Rate Limiting | Redis 7 |
| Seguridad | HMAC-SHA256, JWT, Idempotency Keys |
| Contenedores | Docker Compose |

---

## Arquitectura del Sistema

```
tierlist-global/
├── apps/
│   ├── api/                          # Backend Express + TypeScript
│   │   └── src/
│   │       ├── modules/
│   │       │   ├── auth/             # JWT + refresh tokens
│   │       │   ├── debates/          # Ciclo de vida de debates
│   │       │   ├── votes/            # Motor de votación anti-fraude
│   │       │   ├── inventory/        # Objetos + Ledger encadenado
│   │       │   ├── svp/              # Dispatcher Outbox + HMAC
│   │       │   ├── policy/           # Policy Engine stateless
│   │       │   └── audit/            # Logs firmados
│   │       └── database/
│   │           ├── entities/         # Entidades TypeORM
│   │           └── migrations/       # Migraciones SQL
│   └── web-client/                   # Frontend React
│       └── src/
│           ├── pages/                # 8 páginas funcionales
│           ├── components/
│           │   └── layout/           # AppLayout con navegación real
│           └── services/             # Cliente HTTP tipado
├── libs/
│   ├── common/src/types.ts           # Tipos de dominio compartidos
│   └── hmac/src/hmac.service.ts      # Utilidades criptográficas
├── docker/
│   ├── docker-compose.yml            # PostgreSQL + Redis + API + Web + SVP Mock
│   └── init.sql                      # Schema completo + seeds
└── apps/api/test/unit.spec.ts        # Tests unitarios
```

---

## Módulos del Sistema

### 1. Debate Engine
- Ciclo de vida: `DRAFT → OPEN → CLOSED → CALC_POINTS → FINALIZED`
- Cierre atómico con transacción: ranking → logros → outbox SVP → commit

### 2. Motor de Votación
- Un voto por usuario por item (constraint DB)
- IP hasheada (privacidad), firma HMAC por voto
- Idempotency Key en header para reintentos de red

### 3. SVP Dispatcher (Patrón Outbox)
- Inserta evento en `svp_transactions` dentro de la misma transacción atómica del cierre
- Worker corre cada 30s, reintenta con backoff: 30s → 5m → 30m → 2h
- Tras 5 fallos: `CRITICAL_FAILURE` con alerta

### 4. Policy Engine
- Stateless: evalúa reglas JSON contra un contexto de actividad
- Acciones: `REVALUE`, `TRANSFORM`, `BURN`, `BADGE`
- Reglas versionadas en PostgreSQL, actualizables sin deploy

### 5. Inventory Ledger (Cadena auditada)
- `previousStateHash` en cada entrada para encadenamiento
- `auditSignature = HMAC_SHA256(secret, id+objectId+pointsDelta+prevHash+action+createdAt)`
- Endpoint `/v1/inventory/object/:id/verify` para validar toda la cadena

### 6. Fórmula SVP
```
puntosSVP = horasActividad × (votesLocales + votesGlobales)
```
El cálculo ocurre en el backend al cerrar un debate. El SVP es la autoridad que confirma y registra los puntos.

---

## Instalación y Desarrollo Local

### Prerrequisitos
- Node.js 20+
- Docker + Docker Compose
- Yarn

### 1. Clonar y configurar
```bash
git clone <repo>
cd tierlist-global
cp .env.example .env
# Editar .env con tus secretos
```

### 2. Levantar infraestructura
```bash
yarn docker:up
# Levanta: PostgreSQL, Redis, SVP Mock
```

### 3. Instalar dependencias
```bash
yarn install
```

### 4. Ejecutar en desarrollo
```bash
yarn dev
# API en http://localhost:4000
# Web en http://localhost:3000
```

### 5. Tests
```bash
yarn test
```

---

## API — Endpoints Principales

### Debates
```
GET    /v1/debates                   Lista de debates (paginado)
GET    /v1/debates/:id               Detalle de debate
GET    /v1/debates/:id/ranking       Ranking actualizado con tiers
POST   /v1/debates                   Crear debate
PATCH  /v1/debates/:id/open          Abrir debate
POST   /v1/debates/:id/close         Cerrar + calcular + enqueue SVP
```

### Votación
```
POST   /v1/debates/:id/vote          Emitir voto (requiere X-Idempotency-Key)
GET    /v1/votes/user/:userId        Votos del usuario
```

### Inventario
```
GET    /v1/inventory/:userId         Objetos del usuario
GET    /v1/inventory/object/:id/ledger     Cadena de ledger
GET    /v1/inventory/object/:id/verify     Verificar integridad HMAC
POST   /v1/inventory/grant           Asignar objeto por logro
```

### SVP Dispatcher
```
GET    /v1/dispatcher/transactions   Transacciones (filtrables por status)
GET    /v1/dispatcher/metrics        Métricas: pending/sent/failed/ack
POST   /v1/dispatcher/retry/:id      Reintentar transacción fallida
```

### Policy Engine
```
GET    /v1/policies                  Políticas activas
POST   /v1/policies                  Crear política
POST   /v1/engine/revalue            Evaluar reglas (activityContext + objectMetadata)
```

### Auditoría
```
GET    /v1/audit/logs                Logs firmados (filtrable por entityName)
```

---

## Seguridad

| Mecanismo | Aplicación |
|---|---|
| HMAC-SHA256 | Cada evento SVP, cada entrada de ledger, cada log de auditoría |
| Idempotency Key | `X-Idempotency-Key` en votos y eventos SVP (eventId como clave única) |
| Anti Replay | Nonce UUID + timestamp en firma SVP (tolerancia ±60s) |
| IP Privacy | IPs hasheadas con SHA256 antes de persistir |
| JWT | Auth stateless con refresh token rotation |
| Constraint DB | UNIQUE (user_id, item_id) en votos impide doble voto a nivel base de datos |

---

## Fases de Despliegue

| Fase | Alcance |
|---|---|
| MVP (actual) | Frontend + API + PostgreSQL + SVP Dispatcher + Policy Engine básico |
| Beta | Redis Rate Limiting + JWT Auth completo + Ledger verificación automática |
| Producción | Multi-tenant sharding + Observabilidad (Prometheus/Grafana) + Auto-scaling |

---

## Créditos

Sistema construido sobre las especificaciones del **PRD TierList Global** y el **Design System "The Institutional Pulse"** (DESIGN.md). Tipografía: Manrope + Inter. Paleta: Deep Navy `#0d1321` · Electric Blue `#0052ff` · Emerald `#4edea3` · Amber `#ffb95f`.
