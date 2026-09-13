export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "SESSION_EXPIRED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "AVAILABILITY_CONFLICT"
  | "IDEMPOTENCY_CONFLICT"
  | "RATE_LIMITED"
  | "TRANSIENT_FAILURE"
  | "INTERNAL_ERROR"
  | "WALLET_CONNECTION_REJECTED";

export interface Paginated<TItem> {
  items: TItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiFieldError {
  field: string;
  message: string;
}

export interface ApiErrorBody {
  error: {
    code: ApiErrorCode;
    message: string;
    fields?: ApiFieldError[];
  };
}

export class ApiError extends Error {
  code: ApiErrorCode;
  fields?: ApiFieldError[];
  status: number;

  constructor(status: number, body: ApiErrorBody) {
    super(body.error.message);
    this.name = "ApiError";
    this.status = status;
    this.code = body.error.code;
    this.fields = body.error.fields;
  }
}

export interface RealtimeEvent<TPayload> {
  id: string;
  resource: string;
  resourceId: string;
  version: number;
  emittedAt: string;
  payload: TPayload;
}
