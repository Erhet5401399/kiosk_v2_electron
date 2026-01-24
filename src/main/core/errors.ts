import { ErrorCode, ERROR } from './constants';

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly retryable: boolean;
  readonly timestamp = Date.now();
  readonly context?: Record<string, unknown>;

  constructor(
    code: ErrorCode,
    message: string,
    retryable = false,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.retryable = retryable;
    this.context = context;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      retryable: this.retryable,
      timestamp: this.timestamp,
      context: this.context,
    };
  }
}

export class AuthError extends AppError {
  constructor(code: ErrorCode = ERROR.AUTH_FAILED, message = 'Authentication failed') {
    super(code, message, code === ERROR.AUTH_EXPIRED);
    this.name = 'AuthError';
  }
}

export class NetworkError extends AppError {
  constructor(message = 'Network error', public statusCode?: number) {
    super(ERROR.NETWORK, message, true);
    this.name = 'NetworkError';
  }
}

export class ApiError extends AppError {
  constructor(public statusCode: number, message = 'API error', public body?: unknown) {
    super(ERROR.API, message, statusCode >= 500 || statusCode === 429);
    this.name = 'ApiError';
  }
}

export class PrinterError extends AppError {
  constructor(code: ErrorCode = ERROR.PRINT_FAILED, message = 'Printer error') {
    super(code, message, code !== ERROR.PRINTER_NOT_FOUND);
    this.name = 'PrinterError';
  }
}

export class StorageError extends AppError {
  constructor(message = 'Storage error') {
    super(ERROR.STORAGE, message, false);
    this.name = 'StorageError';
  }
}

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  if (error instanceof Error) {
    return new AppError(ERROR.UNKNOWN, error.message, false);
  }
  return new AppError(ERROR.UNKNOWN, String(error), false);
}
