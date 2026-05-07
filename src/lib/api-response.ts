import { NextResponse } from 'next/server'

export type ApiSuccess<T> = { success: true; data: T }
export type ApiError = { success: false; error: string; code: string }
export type ApiResponse<T> = ApiSuccess<T> | ApiError

export function success<T>(data: T): ApiSuccess<T> {
  return { success: true, data }
}

export function error(message: string, code: string, status = 400): NextResponse {
  return NextResponse.json({ success: false, error: message, code } as ApiError, { status })
}

export function unauthorized(code = 'unauthorized'): NextResponse {
  return error('Unauthorized', code, 401)
}

export function forbidden(code = 'forbidden'): NextResponse {
  return error('Forbidden', code, 403)
}

export function notFound(code = 'not_found'): NextResponse {
  return error('Not found', code, 404)
}

export function conflict(message: string, code = 'conflict'): NextResponse {
  return error(message, code, 409)
}

export function badRequest(message: string, code = 'bad_request'): NextResponse {
  return error(message, code, 400)
}

export function internalError(message = 'Internal server error', code = 'internal_error'): NextResponse {
  return error(message, code, 500)
}
