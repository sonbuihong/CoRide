export interface ApiErrorPayload {
  message?: string;
  code?: string;
  details?: Record<string, unknown>;
}

interface ApiErrorLike {
  message?: string;
  response?: { status?: number; data?: ApiErrorPayload };
}

export function getApiErrorPayload(error: unknown): ApiErrorPayload {
  if (typeof error !== 'object' || error === null) return {};
  const candidate = error as ApiErrorLike;
  return candidate.response?.data ?? { message: candidate.message };
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  return getApiErrorPayload(error).message || fallback;
}
