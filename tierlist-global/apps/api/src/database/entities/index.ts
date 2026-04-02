// ============================================================
// apps/api/src/database/entities/index.ts
// Entidades TypeORM — Modelo relacional completo
// ============================================================

import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Index,
} from 'typeorm';

// ─── Users ───────────────────────────────────────────────────

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  email: string;

  @Column({ unique: true })
  username: string;

  @Column()
  passwordHash: string;

  @Column({ default: 'USER' })
  role: string; // USER | AUDITOR | ADMIN | POLICY_OPERATOR

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  svpPoints: number;

  @Column({ default: 1 })
  level: number;

  @Column({ default: 'ACTIVE' })
  status: string;

  @Column({ nullable: true })
  refreshToken: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => VoteEntity, (v) => v.user)
  votes: VoteEntity[];

  @OneToMany(() => InventoryObjectEntity, (o) => o.owner)
  inventory: InventoryObjectEntity[];
}

// ─── Debates ─────────────────────────────────────────────────

@Entity('debates')
@Index(['status', 'scope'])
export class DebateEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  category: string;

  @Column({ default: 'LOCAL' })
  scope: string; // LOCAL | GLOBAL

  @Column({ default: 'DRAFT' })
  @Index()
  status: string; // DRAFT | OPEN | CLOSED | CALC_POINTS | FINALIZED

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp' })
  endDate: Date;

  @Column({ type: 'jsonb', default: '{}' })
  configRules: Record<string, unknown>;

  @Column()
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => DebateItemEntity, (i) => i.debate, { cascade: true })
  items: DebateItemEntity[];
}

// ─── DebateItems ─────────────────────────────────────────────

@Entity('debate_items')
export class DebateItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  debateId: string;

  @ManyToOne(() => DebateEntity, (d) => d.items)
  @JoinColumn({ name: 'debateId' })
  debate: DebateEntity;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ nullable: true })
  tier: string; // S | A | B | C

  @Column({ default: 0 })
  voteCount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  consensusPercentage: number;

  @Column({ default: false })
  isAudited: boolean;

  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, unknown>;

  @OneToMany(() => VoteEntity, (v) => v.item)
  votes: VoteEntity[];
}

// ─── Votes ───────────────────────────────────────────────────

@Entity('votes')
@Index(['userId', 'itemId'], { unique: true })
export class VoteEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => UserEntity, (u) => u.votes)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column()
  itemId: string;

  @ManyToOne(() => DebateItemEntity, (i) => i.votes)
  @JoinColumn({ name: 'itemId' })
  item: DebateItemEntity;

  @Column()
  debateId: string;

  @Column({ default: 'LOCAL' })
  scope: string;

  @Column({ default: 0 })
  durationSeconds: number;

  @Column({ nullable: true })
  comment: string;

  @Column({ nullable: true })
  ipHash: string;

  @Column({ nullable: true })
  signature: string;

  @Column({ default: 'VALIDATED' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;
}

// ─── SVP Transactions (Outbox Pattern) ───────────────────────

@Entity('svp_transactions')
@Index(['status'])
export class SvpTransactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  eventId: string;

  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>;

  @Column({ default: 'PENDING' })
  @Index()
  status: string; // PENDING | SENT | FAILED | ACKNOWLEDGED | CRITICAL_FAILURE

  @Column({ default: 0 })
  retryCount: number;

  @Column({ nullable: true, type: 'text' })
  lastError: string;

  @Column()
  signature: string;

  @Column({ nullable: true })
  sentAt: Date;

  @Column({ nullable: true })
  acknowledgedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// ─── Inventory Objects ────────────────────────────────────────

@Entity('inventory_objects')
@Index(['ownerId', 'status'])
export class InventoryObjectEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  ownerId: string;

  @ManyToOne(() => UserEntity, (u) => u.inventory)
  @JoinColumn({ name: 'ownerId' })
  owner: UserEntity;

  @Column()
  templateId: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  currentValue: number;

  @Column({ default: true })
  isDynamic: boolean;

  @Column({ default: 'ACTIVE' })
  @Index()
  status: string; // ACTIVE | TRANSFORMED | BURNED | TRANSFERRED

  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => InventoryLedgerEntity, (l) => l.object)
  ledgerEntries: InventoryLedgerEntity[];
}

// ─── Inventory Ledger (Cadena auditada) ───────────────────────

@Entity('inventory_ledger')
@Index(['objectId', 'createdAt'])
export class InventoryLedgerEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  objectId: string;

  @ManyToOne(() => InventoryObjectEntity, (o) => o.ledgerEntries)
  @JoinColumn({ name: 'objectId' })
  object: InventoryObjectEntity;

  @Column()
  transactionId: string;

  @Column()
  action: string; // GRANT | REVALUE | TRANSFORM | BURN | TRANSFER

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  pointsDelta: number;

  @Column({ length: 64 })
  previousStateHash: string;

  @Column({ type: 'jsonb' })
  currentStateSnapshot: Record<string, unknown>;

  @Column({ length: 64 })
  auditSignature: string;

  @CreateDateColumn()
  createdAt: Date;
}

// ─── Audit Logs ───────────────────────────────────────────────

@Entity('audit_logs')
@Index(['entityName', 'entityId'])
export class AuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  entityName: string;

  @Column()
  entityId: string;

  @Column()
  action: string;

  @Column()
  userId: string;

  @Column({ type: 'jsonb', nullable: true })
  oldValue: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  newValue: Record<string, unknown>;

  @Column({ length: 64 })
  signature: string;

  @CreateDateColumn()
  createdAt: Date;
}

// ─── Achievements ─────────────────────────────────────────────

@Entity('achievements')
export class AchievementEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text' })
  triggerCondition: string;

  @Column()
  rewardType: string; // OBJECT_GRANT | POINT_MULTIPLIER | BADGE

  @Column()
  objectTemplateId: string;

  @Column({ default: 'GLOBAL' })
  scope: string; // GLOBAL | INDIVIDUAL

  @Column({ default: 0 })
  initialValue: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

// ─── Policies ─────────────────────────────────────────────────

@Entity('policies')
export class PolicyEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  policyId: string;

  @Column()
  version: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  targetType: string;

  @Column({ type: 'jsonb' })
  rules: Record<string, unknown>[];

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
