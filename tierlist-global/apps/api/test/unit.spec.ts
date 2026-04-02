// ============================================================
// apps/api/test/hmac.spec.ts
// Tests unitarios — HmacService
// ============================================================
import { HmacService } from '../../libs/hmac/src/hmac.service';

describe('HmacService', () => {
  const SECRET = 'test-secret-key';

  describe('generateSignature / verifySignature', () => {
    it('genera firma válida y la verifica correctamente', () => {
      const body = JSON.stringify({ eventId: 'test-123', score: 100 });
      const nonce = HmacService.generateNonce();
      const timestamp = Math.floor(Date.now() / 1000);

      const signature = HmacService.generateSignature({ body, nonce, timestamp, secret: SECRET });

      const result = HmacService.verifySignature({
        body, nonce, timestamp, secret: SECRET, signature,
        toleranceSeconds: 60,
      });

      expect(result.valid).toBe(true);
    });

    it('rechaza firma con payload alterado', () => {
      const nonce = HmacService.generateNonce();
      const timestamp = Math.floor(Date.now() / 1000);

      const signature = HmacService.generateSignature({ body: '{"score":100}', nonce, timestamp, secret: SECRET });
      const result = HmacService.verifySignature({
        body: '{"score":999}',  // Payload alterado
        nonce, timestamp, secret: SECRET, signature,
      });

      expect(result.valid).toBe(false);
    });

    it('rechaza firma con clock drift excedido', () => {
      const nonce = HmacService.generateNonce();
      const oldTimestamp = Math.floor(Date.now() / 1000) - 300; // 5 minutos atrás

      const signature = HmacService.generateSignature({
        body: 'test', nonce, timestamp: oldTimestamp, secret: SECRET,
      });

      const result = HmacService.verifySignature({
        body: 'test', nonce, timestamp: oldTimestamp, secret: SECRET,
        signature, toleranceSeconds: 60,
      });

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Clock drift');
    });
  });

  describe('generateAuditSignature', () => {
    it('genera firmas de auditoría deterministas', () => {
      const params = {
        id: 'entry-uuid-123',
        objectId: 'obj-uuid-456',
        pointsDelta: 1500,
        previousStateHash: '0'.repeat(64),
        action: 'GRANT',
        createdAt: '2026-04-01T12:00:00.000Z',
        secret: SECRET,
      };

      const sig1 = HmacService.generateAuditSignature(params);
      const sig2 = HmacService.generateAuditSignature(params);

      expect(sig1).toBe(sig2);
      expect(sig1).toHaveLength(64);
    });

    it('produce firmas distintas para distintos objectId', () => {
      const base = {
        id: 'entry-1', pointsDelta: 100, previousStateHash: '0'.repeat(64),
        action: 'GRANT', createdAt: '2026-04-01T00:00:00Z', secret: SECRET,
      };

      const sig1 = HmacService.generateAuditSignature({ ...base, objectId: 'obj-A' });
      const sig2 = HmacService.generateAuditSignature({ ...base, objectId: 'obj-B' });

      expect(sig1).not.toBe(sig2);
    });
  });

  describe('hashState', () => {
    it('produce hashes consistentes para el mismo estado', () => {
      const state = { id: '1', value: 500, status: 'ACTIVE' };
      expect(HmacService.hashState(state)).toBe(HmacService.hashState(state));
    });

    it('las claves desordenadas producen el mismo hash (normalización)', () => {
      const s1 = { a: 1, b: 2 };
      const s2 = { b: 2, a: 1 };
      expect(HmacService.hashState(s1)).toBe(HmacService.hashState(s2));
    });
  });
});


// ============================================================
// apps/api/test/svp-formula.spec.ts
// Tests — Fórmula SVP: puntos = horasActividad * (votesLocales + votesGlobales)
// ============================================================

describe('SVP Points Formula', () => {
  function calculatePoints(horasActividad: number, votesLocales: number, votesGlobales: number): number {
    return horasActividad * (votesLocales + votesGlobales);
  }

  it('calcula correctamente para debate local', () => {
    // Ejemplo del documento: 1.2h * (450+800) = 1500
    expect(calculatePoints(1.2, 450, 800)).toBeCloseTo(1500);
  });

  it('calcula 0 cuando no hay votos', () => {
    expect(calculatePoints(5, 0, 0)).toBe(0);
  });

  it('escala proporcionalmente con horas', () => {
    const pts1 = calculatePoints(1, 500, 500);
    const pts2 = calculatePoints(2, 500, 500);
    expect(pts2).toBe(pts1 * 2);
  });

  it('escala proporcionalmente con votos', () => {
    const pts1 = calculatePoints(2, 100, 100);
    const pts2 = calculatePoints(2, 200, 200);
    expect(pts2).toBe(pts1 * 2);
  });

  it('mismo tiempo con más votos globales = más puntos', () => {
    const ptsLocal  = calculatePoints(1, 1000, 0);
    const ptsGlobal = calculatePoints(1, 0, 1000);
    // Ambos = 1000 pts (solo cambia la categoría, no el valor)
    expect(ptsLocal).toBe(ptsGlobal);

    const ptsMixed = calculatePoints(1, 500, 1500);
    // 1 * (500+1500) = 2000 > 1000
    expect(ptsMixed).toBeGreaterThan(ptsLocal);
  });
});


// ============================================================
// apps/api/test/ledger-chain.spec.ts
// Tests — Integridad de la cadena del Inventory Ledger
// ============================================================
import * as crypto from 'crypto';

describe('InventoryLedger chain integrity', () => {
  function buildLedgerEntry(
    id: string,
    objectId: string,
    action: string,
    pointsDelta: number,
    previousStateHash: string,
    secret: string,
  ) {
    const createdAt = new Date().toISOString();
    const message = `${id}${objectId}${pointsDelta}${previousStateHash}${action}${createdAt}`;
    const auditSignature = crypto
      .createHmac('sha256', secret)
      .update(message)
      .digest('hex');
    return { id, objectId, action, pointsDelta, previousStateHash, auditSignature, createdAt };
  }

  function verifyChain(entries: ReturnType<typeof buildLedgerEntry>[], secret: string) {
    for (const entry of entries) {
      const message = `${entry.id}${entry.objectId}${entry.pointsDelta}${entry.previousStateHash}${entry.action}${entry.createdAt}`;
      const expected = crypto.createHmac('sha256', secret).update(message).digest('hex');
      if (expected !== entry.auditSignature) {
        return { valid: false, brokenAt: entry.id };
      }
    }
    return { valid: true };
  }

  const SECRET = 'test-audit-secret';
  const OBJ_ID = 'obj-test-123';

  it('cadena de 3 entradas es válida', () => {
    const e1 = buildLedgerEntry('le1', OBJ_ID, 'GRANT', 5000, '0'.repeat(64), SECRET);
    const e2 = buildLedgerEntry('le2', OBJ_ID, 'REVALUE', 2500, e1.auditSignature, SECRET);
    const e3 = buildLedgerEntry('le3', OBJ_ID, 'REVALUE', 1000, e2.auditSignature, SECRET);

    expect(verifyChain([e1, e2, e3], SECRET)).toEqual({ valid: true });
  });

  it('detecta alteración del pointsDelta en la segunda entrada', () => {
    const e1 = buildLedgerEntry('le1', OBJ_ID, 'GRANT', 5000, '0'.repeat(64), SECRET);
    const e2 = buildLedgerEntry('le2', OBJ_ID, 'REVALUE', 2500, e1.auditSignature, SECRET);

    // Simular ataque: alguien modifica el pointsDelta en la DB
    const tampered = { ...e2, pointsDelta: 999999 };

    expect(verifyChain([e1, tampered], SECRET)).toEqual({ valid: false, brokenAt: 'le2' });
  });
});
