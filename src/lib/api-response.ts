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

export function unauthorized(messageOrCode?: string, code?: string): NextResponse {
  const msg = code ? messageOrCode! : messageOrCode === undefined ? 'Unauthorized' : messageOrCode
  const c = code ?? 'unauthorized'
  return error(msg, c, 401)
}

export function forbidden(messageOrCode?: string, code?: string): NextResponse {
  const msg = code ? messageOrCode! : messageOrCode === undefined ? 'Forbidden' : messageOrCode
  const c = code ?? 'forbidden'
  return error(msg, c, 403)
}

export function notFound(messageOrCode?: string, code?: string): NextResponse {
  const msg = code ? messageOrCode! : messageOrCode === undefined ? 'Not found' : messageOrCode
  const c = code ?? 'not_found'
  return error(msg, c, 404)
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
