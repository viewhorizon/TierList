import type { ApiErrorShape, ApiHttpStatus } from "@/types/contracts";

const API_URL = import.meta.env.VITE_API_URL;

export const shouldUseMocks = !API_URL;

const statusMessages: Record<ApiHttpStatus, string> = {
  401: "Tu sesion vencio. Inicia sesion de nuevo.",
  403: "No tienes permisos para esta accion.",
  404: "No encontramos el recurso solicitado.",
  409: "Existe un conflicto con el estado actual.",
  429: "Hay muchas solicitudes seguidas. Intenta en unos segundos.",
  500: "El servicio tuvo un problema interno.",
};

export class ApiError extends Error {
  status: number;

  constructor({ status, message }: ApiErrorShape) {
    super(message);
    this.status = status;
  }
}

export function getStatusMessage(status: number) {
  if (status in statusMessages) {
    return statusMessages[status as ApiHttpStatus];
  }
  return "No pudimos completar la operacion por ahora.";
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_URL) {
    throw new ApiError({ status: 500, message: "Modo mock habilitado" });
  }

  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    throw new ApiError({ status: response.status, message: getStatusMessage(response.status) });
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json() as Promise<T>;
}