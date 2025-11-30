import type { Context } from 'hono';

export interface SuccessResponse<T> {
  success: true;
  data: T;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

export function successResponse<T>(c: Context, data: T, statusCode = 200): Response {
  return c.json<SuccessResponse<T>>(
    {
      success: true,
      data,
    },
    statusCode as 200
  );
}

export function errorResponse(
  c: Context,
  code: string,
  message: string,
  statusCode = 500,
  details?: unknown
): Response {
  return c.json<ErrorResponse>(
    {
      success: false,
      error: {
        code,
        message,
        details,
      },
    },
    statusCode as 500
  );
}
