// ============================================================
// libs/hmac/src/hmac.service.ts
// Servicio de firma HMAC-SHA256 para integridad criptográfica
// ============================================================

import * as crypto from 'crypto';

export interface HmacSignaturePayload {
  body: string;
  nonce: string;
  timestamp: number;
  secret: string;
}

export interface HmacVerifyPayload extends HmacSignaturePayload {
  signature: string;
  toleranceSeconds?: number;
}

export interface AuditSignaturePayload {
  id: string;
  objectId: string;
  pointsDelta: number;
  previousStateHash: string;
  action: string;
  createdAt: string;
  secret: string;
}

export class HmacService {
  private static readonly ALGORITHM = 'sha256';
  private static readonly DEFAULT_TOLERANCE_SECONDS = 60;

  /**
   * Genera firma HMAC para payloads SVP.
   * Protocolo: HMAC_SHA256(secret, body:nonce:timestamp)
   */
  static generateSignature({ body, nonce, timestamp, secret }: HmacSignaturePayload): string {
    const message = `${body}:${nonce}:${timestamp}`;
    return crypto
      .createHmac(this.ALGORITHM, secret)
      .update(message)
      .digest('hex');
  }

  /**
   * Verifica firma HMAC con protección contra Clock Drift y Replay Attacks.
   */
  static verifySignature({
    body,
    nonce,
    timestamp,
    secret,
    signature,
    toleranceSeconds = this.DEFAULT_TOLERANCE_SECONDS,
  }: HmacVerifyPayload): { valid: boolean; reason?: string } {
    const now = Math.floor(Date.now() / 1000);
    const drift = Math.abs(now - timestamp);

    if (drift > toleranceSeconds) {
      return { valid: false, reason: `Clock drift exceeded: ${drift}s > ${toleranceSeconds}s` };
    }

    const expected = this.generateSignature({ body, nonce, timestamp, secret });
    const isValid = crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(signature, 'hex'),
    );

    return isValid ? { valid: true } : { valid: false, reason: 'Signature mismatch' };
  }

  /**
   * Genera firma de auditoría para entradas del InventoryLedger.
   * Protocolo: HMAC_SHA256(secret, id+objectId+pointsDelta+previousStateHash+action+createdAt)
   */
  static generateAuditSignature({
    id,
    objectId,
    pointsDelta,
    previousStateHash,
    action,
    createdAt,
    secret,
  }: AuditSignaturePayload): string {
    const message = `${id}${objectId}${pointsDelta}${previousStateHash}${action}${createdAt}`;
    return crypto
      .createHmac(this.ALGORITHM, secret)
      .update(message)
      .digest('hex');
  }

  /**
   * Genera hash SHA256 del estado actual de un objeto para encadenamiento.
   */
  static hashState(state: Record<string, unknown>): string {
    const normalized = JSON.stringify(state, Object.keys(state).sort());
    return crypto.createHash(this.ALGORITHM).update(normalized).digest('hex');
  }

  /**
   * Genera nonce UUID v4.
   */
  static generateNonce(): string {
    return crypto.randomUUID();
  }

  /**
   * Genera eventId único e inmutable para idempotencia SVP.
   */
  static generateEventId(): string {
    return crypto.randomUUID();
  }
}
