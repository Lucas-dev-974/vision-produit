export interface ApiErrorShape {
  status: number;
  code: string;
  message: string;
  details?: unknown;
}

export class ClientError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ClientError';
  }
}

export function isApiErrorShape(value: unknown): value is ApiErrorShape {
  if (typeof value !== 'object' || value === null) return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.status === 'number' &&
    typeof o.code === 'string' &&
    typeof o.message === 'string'
  );
}
