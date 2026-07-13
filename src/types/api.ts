/**
 * Standard service response envelope (PAD §10.1).
 * Services return this shape; they never leak raw database errors to the UI.
 */
export interface ServiceResponse<T> {
  success: boolean;
  data: T | null;
  error: ServiceError | null;
  message: string | null;
  timestamp: string;
}

export type ServiceErrorCode =
  | 'validation'
  | 'authentication'
  | 'authorization'
  | 'not_found'
  | 'conflict'
  | 'locked'
  | 'network'
  | 'database'
  | 'unexpected';

export interface ServiceError {
  code: ServiceErrorCode;
  message: string;
  details?: unknown;
}

export function ok<T>(data: T, message: string | null = null): ServiceResponse<T> {
  return { success: true, data, error: null, message, timestamp: new Date().toISOString() };
}

export function fail<T = never>(error: ServiceError): ServiceResponse<T> {
  return {
    success: false,
    data: null,
    error,
    message: error.message,
    timestamp: new Date().toISOString(),
  };
}
