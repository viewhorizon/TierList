# Guía de Despliegue Local — TierList Global

> Guía paso a paso para levantar el sistema completo en tu máquina. Tiempo estimado: **10–15 minutos** en una primera instalación.

---

## Prerrequisitos

Verificá que tenés instalado lo siguiente antes de comenzar:

| Herramienta | Versión mínima | Verificar con |
|---|---|---|
| Node.js | 20.x LTS | `node --version` |
| npm / yarn / pnpm | npm 9+ ó yarn 1.22+ | `npm --version` |
| Docker Desktop | 24+ | `docker --version` |
| Docker Compose | 2.x (incluido en Docker Desktop) | `docker compose version` |
| Git | cualquier versión reciente | `git --version` |

> **Windows**: usar WSL2 (Ubuntu 22.04) para el mejor resultado. Docker Desktop debe tener habilitada la integración con WSL2.
> **macOS**: Docker Desktop para Mac funciona de forma nativa.
> **Linux**: instalar Docker Engine + Docker Compose plugin.

---

## Paso 1 — Obtener el proyecto

```bash
# Si tenés el ZIP descargado:
unzip tierlist-global-sistema-completo.zip
cd tierlist-global

# Si usás Git (cuando esté en repo):
# git clone <url>
# cd tierlist-global
```

---

## Paso 2 — Configurar variables de entorno

```bash
# Copiar el archivo de ejemplo
cp .env.example .env
```

Abrí `.env` y revisá los valores. Para desarrollo local **no necesitás cambiar nada**, los valores por defecto funcionan. En producción sí debés generar secretos reales:

```bash
# Generar secretos seguros (ejecutar uno por uno):
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copiar la salida para SVP_HMAC_SECRET, AUDIT_HMAC_SECRET, VOTE_HMAC_SECRET y JWT_SECRET
```

El archivo `.env` resultante para desarrollo:
```env
NODE_ENV=development
PORT=4000

DB_HOST=localhost
DB_PORT=5432
DB_USER=tierlist
DB_PASSWORD=tierlist_secret
DB_NAME=tierlist_global

REDIS_URL=redis://localhost:6379

JWT_SECRET=dev_jwt_secret_cambiar_en_prod
SVP_HMAC_SECRET=dev_svp_secret_cambiar_en_prod
AUDIT_HMAC_SECRET=dev_audit_secret_cambiar_en_prod
VOTE_HMAC_SECRET=dev_vote_secret_cambiar_en_prod

SVP_ENDPOINT_URL=http://localhost:5000/v1/events
FRONTEND_URL=http://localhost:3000
VITE_API_URL=http://localhost:4000
```

---

## Paso 3 — Levantar la infraestructura con Docker

Este comando levanta PostgreSQL, Redis y el SVP Mock (simulador del sistema externo):

```bash
docker compose -f docker/docker-compose.yml up -d postgres redis svp-mock
```

Verificar que los servicios están corriendo:
```bash
docker compose -f docker/docker-compose.yml ps
```

Deberías ver los tres servicios con estado `healthy` o `running`:
```
NAME                STATUS
tierlist_postgres   running (healthy)
tierlist_redis      running (healthy)
tierlist_svp_mock   running
```

Si algún servicio tarda en estar `healthy`, esperá 15–20 segundos y volvé a ejecutar el comando de verificación. El healthcheck de PostgreSQL puede tardar en pasar en la primera vez.

---

## Paso 4 — Instalar dependencias de Node.js

Desde la raíz del proyecto (donde está el `package.json` principal):

```bash
# Con npm (viene con Node.js, sin instalar nada extra):
npm install

# Alternativa con yarn:
# yarn install

# Alternativa con pnpm:
# pnpm install
```

Este comando instala las dependencias de todos los workspaces (`apps/api`, `apps/web-client`, `libs/`).

---

## Paso 5 — Inicializar la base de datos

El schema SQL completo está en `docker/init.sql` y se ejecuta automáticamente cuando Docker crea el contenedor de PostgreSQL por primera vez. Para verificarlo:

```bash
docker exec -it tierlist_postgres psql -U tierlist -d tierlist_global -c "\dt"
```

Deberías ver las tablas:
```
            List of relations
 Schema |       Name          | Type  |  Owner
--------+---------------------+-------+----------
 public | achievements        | table | tierlist
 public | audit_logs          | table | tierlist
 public | debate_items        | table | tierlist
 public | debates             | table | tierlist
 public | inventory_ledger    | table | tierlist
 public | inventory_objects   | table | tierlist
 public | policies            | table | tierlist
 public | svp_transactions    | table | tierlist
 public | users               | table | tierlist
 public | votes               | table | tierlist
```

Si las tablas no aparecen (porque el contenedor ya existía de antes), ejecutar manualmente:
```bash
docker exec -i tierlist_postgres psql -U tierlist -d tierlist_global < docker/init.sql
```

---

## Paso 6 — Levantar el backend (API)

Abrí una terminal y ejecutá:

```bash
cd apps/api
npm run dev
```

O desde la raíz del monorepo:
```bash
npm run dev --workspace=apps/api
```

Deberías ver:
```
✅ PostgreSQL conectado
🚀 TierList API corriendo en http://localhost:4000
```

Verificar que la API responde:
```bash
curl http://localhost:4000/health
# {"status":"ok","timestamp":"2026-04-02T...","version":"1.0.0"}
```

---

## Paso 7 — Levantar el frontend (Web)

Abrí **otra terminal** (distinta a la del backend) y ejecutá:

```bash
cd apps/web-client
npm run dev
```

O desde la raíz:
```bash
npm run dev --workspace=apps/web-client
```

Deberías ver:
```
  VITE v5.x.x  ready in 500ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.x.x:3000/
```

Abrí el navegador en **http://localhost:3000** y deberías ver el dashboard principal.

---

## Resumen de puertos

| Servicio | URL | Descripción |
|---|---|---|
| Frontend (React) | http://localhost:3000 | Aplicación web completa |
| Backend (API) | http://localhost:4000 | REST API |
| API Health | http://localhost:4000/health | Estado del sistema |
| SVP Mock | http://localhost:5000 | Simulador del sistema SVP externo |
| PostgreSQL | localhost:5432 | Base de datos (usuario: `tierlist`) |
| Redis | localhost:6379 | Cache y rate limiting |

---

## Prueba rápida del sistema completo

Con todo corriendo, podés probar el flujo completo desde la terminal:

```bash
# 1. Crear un debate
curl -X POST http://localhost:4000/v1/debates \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Mejor lenguaje backend 2026",
    "description": "Debate técnico global",
    "category": "Tech",
    "scope": "GLOBAL",
    "startDate": "2026-04-01T00:00:00Z",
    "endDate": "2026-04-30T00:00:00Z",
    "createdBy": "00000000-0000-0000-0000-000000000001",
    "items": [
      {"name": "TypeScript"},
      {"name": "Go"},
      {"name": "Rust"}
    ]
  }'
# Guardar el "id" del debate devuelto

# 2. Abrir el debate (reemplazar DEBATE_ID)
curl -X PATCH http://localhost:4000/v1/debates/DEBATE_ID/open

# 3. Ver debates activos
curl http://localhost:4000/v1/debates?status=OPEN

# 4. Ver métricas del dispatcher SVP
curl http://localhost:4000/v1/dispatcher/metrics

# 5. Cerrar el debate y calcular puntos
curl -X POST http://localhost:4000/v1/debates/DEBATE_ID/close
# El sistema: calcula ranking → asigna tiers → inserta en Outbox SVP → envía al mock
```

---

## Detener el sistema

```bash
# Detener Node.js: Ctrl+C en cada terminal

# Detener Docker (mantiene los datos):
docker compose -f docker/docker-compose.yml stop

# Detener Docker y borrar los datos (reset completo):
docker compose -f docker/docker-compose.yml down -v
```

---

## Solución de problemas frecuentes

**`Error: connect ECONNREFUSED 127.0.0.1:5432`**
PostgreSQL no está corriendo. Verificar con `docker compose ps` y revisar los logs con `docker logs tierlist_postgres`.

**`Syntax error` al ejecutar `npm install`**
Asegurarse de estar en la raíz del monorepo (donde está el `package.json` principal, no en `apps/api`).

**Puerto 3000 o 4000 ya en uso**
```bash
# Ver qué proceso usa el puerto:
lsof -i :4000   # macOS/Linux
netstat -ano | findstr :4000  # Windows

# Cambiar el puerto en .env: PORT=4001
```

**El frontend muestra datos vacíos / error de red**
Verificar que `VITE_API_URL=http://localhost:4000` está en el `.env` y que la API está corriendo. Vite requiere reinicio para tomar cambios en variables de entorno.

**`table "users" does not exist`**
El schema SQL no se ejecutó. Correr manualmente:
```bash
docker exec -i tierlist_postgres psql -U tierlist -d tierlist_global < docker/init.sql
```
