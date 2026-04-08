import { apiRequest, shouldUseMocks } from "@/services/httpClient";
import { mockSvpEvents } from "@/services/mockData";
import type { SvpEventAck, SvpEventPayload } from "@/types/contracts";

interface EmitSvpEventInput {
  payload: SvpEventPayload;
  idempotencyKey: string;
  hmacSignature?: string;
}

function normalizeEvent(payload: SvpEventPayload): SvpEventPayload {
  return {
    ...payload,
    sourceApp: "tierlist-global",
    activityId: payload.activityId.trim(),
    unit: payload.unit.trim(),
  };
}

export async function emitSvpEvent(input: EmitSvpEventInput): Promise<SvpEventAck> {
  const payload = normalizeEvent(input.payload);

  if (shouldUseMocks) {
    const alreadyExists = mockSvpEvents.some((event) => event.eventId === payload.eventId);
    if (!alreadyExists) {
      mockSvpEvents.push(payload);
    }

    return {
      accepted: true,
      eventId: payload.eventId,
      receivedAt: new Date().toISOString(),
      idempotencyKey: input.idempotencyKey,
    };
  }

  return apiRequest<SvpEventAck>("/integrations/svp/events", {
    method: "POST",
    headers: {
      "X-Idempotency-Key": input.idempotencyKey,
      ...(input.hmacSignature ? { "X-Signature": input.hmacSignature } : {}),
    },
    body: JSON.stringify(payload),
  });
}