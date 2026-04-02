-- ============================================================
-- TierList Global — Schema SQL Completo
-- PostgreSQL 16+ con optimizaciones para ledger auditado
-- ============================================================

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Para búsqueda full-text

-- ── Users ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email           VARCHAR(255) UNIQUE NOT NULL,
  username        VARCHAR(100) UNIQUE NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  role            VARCHAR(30) NOT NULL DEFAULT 'USER',
  svp_points      DECIMAL(18,2) NOT NULL DEFAULT 0,
  level           INTEGER NOT NULL DEFAULT 1,
  status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  refresh_token   VARCHAR(512),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ── Debates ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS debates (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           VARCHAR(500) NOT NULL,
  description     TEXT,
  category        VARCHAR(100) NOT NULL,
  scope           VARCHAR(10) NOT NULL DEFAULT 'LOCAL' CHECK (scope IN ('LOCAL','GLOBAL')),
  status          VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
                  CHECK (status IN ('DRAFT','OPEN','CLOSED','CALC_POINTS','FINALIZED')),
  start_date      TIMESTAMPTZ NOT NULL,
  end_date        TIMESTAMPTZ NOT NULL,
  config_rules    JSONB NOT NULL DEFAULT '{}',
  created_by      UUID NOT NULL REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_debates_status_scope ON debates(status, scope);
CREATE INDEX IF NOT EXISTS idx_debates_created_at ON debates(created_at DESC);

-- ── Debate Items ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS debate_items (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  debate_id            UUID NOT NULL REFERENCES debates(id) ON DELETE CASCADE,
  name                 VARCHAR(255) NOT NULL,
  description          TEXT,
  image_url            VARCHAR(512),
  tier                 CHAR(1) CHECK (tier IN ('S','A','B','C')),
  vote_count           INTEGER NOT NULL DEFAULT 0,
  consensus_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  is_audited           BOOLEAN NOT NULL DEFAULT FALSE,
  metadata             JSONB NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_debate_items_debate_id ON debate_items(debate_id);
CREATE INDEX IF NOT EXISTS idx_debate_items_vote_count ON debate_items(vote_count DESC);

-- ── Votes ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS votes (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES users(id),
  item_id          UUID NOT NULL REFERENCES debate_items(id),
  debate_id        UUID NOT NULL REFERENCES debates(id),
  scope            VARCHAR(10) NOT NULL DEFAULT 'LOCAL',
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  comment          TEXT,
  ip_hash          VARCHAR(64),
  signature        VARCHAR(64),
  status           VARCHAR(20) NOT NULL DEFAULT 'VALIDATED',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, item_id)  -- Un voto por user por item
);
CREATE INDEX IF NOT EXISTS idx_votes_debate_id ON votes(debate_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);

-- ── SVP Transactions (Outbox Pattern) ────────────────────────
CREATE TABLE IF NOT EXISTS svp_transactions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id         UUID UNIQUE NOT NULL,
  payload          JSONB NOT NULL,
  status           VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                   CHECK (status IN ('PENDING','SENT','FAILED','ACKNOWLEDGED','CRITICAL_FAILURE')),
  retry_count      INTEGER NOT NULL DEFAULT 0,
  last_error       TEXT,
  signature        VARCHAR(64) NOT NULL,
  sent_at          TIMESTAMPTZ,
  acknowledged_at  TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_svp_transactions_status ON svp_transactions(status);
CREATE INDEX IF NOT EXISTS idx_svp_transactions_created_at ON svp_transactions(created_at ASC);

-- ── Inventory Objects ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory_objects (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id        UUID NOT NULL REFERENCES users(id),
  template_id     VARCHAR(100) NOT NULL,
  name            VARCHAR(255) NOT NULL,
  description     TEXT,
  image_url       VARCHAR(512),
  current_value   DECIMAL(18,2) NOT NULL DEFAULT 0,
  is_dynamic      BOOLEAN NOT NULL DEFAULT TRUE,
  status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                  CHECK (status IN ('ACTIVE','TRANSFORMED','BURNED','TRANSFERRED')),
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_inventory_owner_status ON inventory_objects(owner_id, status);

-- ── Inventory Ledger (Cadena auditada HMAC) ───────────────────
-- Cada fila tiene previousStateHash para encadenamiento
-- auditSignature = HMAC_SHA256(secret, id+objectId+pointsDelta+prevHash+action+createdAt)
CREATE TABLE IF NOT EXISTS inventory_ledger (
  id                    UUID PRIMARY KEY,  -- Generado en backend para incluir en firma
  object_id             UUID NOT NULL REFERENCES inventory_objects(id),
  transaction_id        UUID NOT NULL,
  action                VARCHAR(20) NOT NULL
                        CHECK (action IN ('GRANT','REVALUE','TRANSFORM','BURN','TRANSFER')),
  points_delta          DECIMAL(18,2) NOT NULL,
  previous_state_hash   CHAR(64) NOT NULL,  -- SHA256 del estado anterior
  current_state_snapshot JSONB NOT NULL,
  audit_signature       CHAR(64) NOT NULL,  -- HMAC-SHA256 anti-tampering
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ledger_object_id ON inventory_ledger(object_id, created_at ASC);

-- ── Audit Logs (Sistema general) ──────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_name  VARCHAR(100) NOT NULL,
  entity_id    UUID NOT NULL,
  action       VARCHAR(100) NOT NULL,
  user_id      UUID NOT NULL,
  old_value    JSONB,
  new_value    JSONB,
  signature    VARCHAR(64) NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_name, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- ── Achievements ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS achievements (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                VARCHAR(255) NOT NULL,
  trigger_condition   TEXT NOT NULL,
  reward_type         VARCHAR(30) NOT NULL,
  object_template_id  VARCHAR(100) NOT NULL,
  scope               VARCHAR(10) NOT NULL DEFAULT 'GLOBAL',
  initial_value       DECIMAL(18,2) NOT NULL DEFAULT 0,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Policies (Policy Engine) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS policies (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  policy_id    VARCHAR(100) UNIQUE NOT NULL,
  version      VARCHAR(20) NOT NULL,
  description  TEXT NOT NULL,
  target_type  VARCHAR(100) NOT NULL,
  rules        JSONB NOT NULL,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Seeds iniciales ───────────────────────────────────────────
INSERT INTO policies (policy_id, version, description, target_type, rules) VALUES
(
  'pol_news_expert_2026',
  '1.2.0',
  'Revalorización para categoría noticias nivel experto',
  'news_token_v1',
  '[
    {"id":"rule_01","condition":"activity_hours > 10 && total_votes > 5000","action":{"type":"REVALUE","params":{"multiplier":1.5,"baseBonus":1000}}},
    {"id":"rule_02","condition":"is_global_winner == true","action":{"type":"TRANSFORM","params":{"targetTemplateId":"news_legendary_v1"}}}
  ]'::jsonb
),
(
  'pol_tech_debate_2026',
  '2.0.1',
  'Reglas para debates de tecnología',
  'tech_badge_v1',
  '[
    {"id":"rule_01","condition":"activity_hours > 5","action":{"type":"REVALUE","params":{"multiplier":1.25,"baseBonus":500}}},
    {"id":"rule_02","condition":"total_votes > 10000","action":{"type":"TRANSFORM","params":{"targetTemplateId":"tech_legendary_v2"}}}
  ]'::jsonb
)
ON CONFLICT (policy_id) DO NOTHING;

INSERT INTO achievements (name, trigger_condition, reward_type, object_template_id, scope, initial_value) VALUES
('S-Rank Global Winner', 'rank == 1 && total_votes > 10000', 'OBJECT_GRANT', 'trophy_s_global', 'GLOBAL', 12500),
('Top Voter Badge', 'rank <= 3 && is_global == true', 'BADGE', 'badge_top_voter', 'GLOBAL', 5000),
('Consensus Champion', 'total_votes > 5000', 'OBJECT_GRANT', 'token_consensus', 'INDIVIDUAL', 2500)
ON CONFLICT DO NOTHING;
