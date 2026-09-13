import { HttpResponse } from "msw";
import type { ApiErrorBody, ApiErrorCode, ApiFieldError } from "@/types";
import { mockDatabase } from "../db";
import { shouldFailTransiently, simulateNetworkLatency } from "../scenarios";

const httpStatusByErrorCode = new Map<ApiErrorCode, number>([
  ["VALIDATION_ERROR", 400],
  ["UNAUTHENTICATED", 401],
  ["SESSION_EXPIRED", 401],
  ["FORBIDDEN", 403],
  ["NOT_FOUND", 404],
  ["CONFLICT", 409],
  ["AVAILABILITY_CONFLICT", 409],
  ["IDEMPOTENCY_CONFLICT", 409],
  ["RATE_LIMITED", 429],
  ["TRANSIENT_FAILURE", 503],
  ["INTERNAL_ERROR", 500],
]);

const createApiErrorBody = (errorCode: ApiErrorCode, errorMessage: string, fieldErrors?: ApiFieldError[]): ApiErrorBody => {
  return {
    error: {
      code: errorCode,
      message: errorMessage,
      fields: fieldErrors,
    },
  };
};

const createApiErrorResponse = (errorCode: ApiErrorCode, errorMessage: string, fieldErrors?: ApiFieldError[]) => {
  return HttpResponse.json(createApiErrorBody(errorCode, errorMessage, fieldErrors), { status: httpStatusByErrorCode.get(errorCode) ?? 500 });
};

/* - Cada handler chama esta função para manter latência e falhas configuráveis no mesmo ponto. - */

const applyNetworkConditions = async () => {
  await simulateNetworkLatency();

  if (shouldFailTransiently()) {
    throw new NetworkSimulationError();
  }
};

export class NetworkSimulationError extends Error {
  constructor() {
    super("Falha transitória simulada.");
    this.name = "NetworkSimulationError";
  }
}

const getSessionFromRequest = (request: Request) => {
  const authorizationHeader = request.headers.get("authorization");
  const sessionToken = authorizationHeader?.replace("Bearer ", "");

  if (!sessionToken) {
    return null;
  }

  const storedSession = mockDatabase.state.sessionsByToken[sessionToken];
  if (!storedSession) {
    return null;
  }

  if (new Date(storedSession.expiresAt).getTime() < Date.now()) {
    return null;
  }

  return storedSession;
};

const getCartOwnerKey = (request: Request) => {
  const storedSession = getSessionFromRequest(request);

  if (storedSession) {
    return storedSession.userId;
  }

  return request.headers.get("x-guest-id") ?? "anonymous";
};

export { createApiErrorBody, createApiErrorResponse, applyNetworkConditions, getCartOwnerKey, getSessionFromRequest };
