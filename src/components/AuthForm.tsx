'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Mode = 'login' | 'register' | 'forgot' | 'reset'

type Props = {
  mode: Mode
  returnUrl?: string
  resetToken?: string
  turnstileSiteKey?: string
}

type FieldError = { field?: string; message: string }

export function AuthForm({ mode, returnUrl = '/account', resetToken, turnstileSiteKey }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [errors, setErrors] = useState<FieldError[]>([])
  const [success, setSuccess] = useState<string | null>(null)
  const [turnstileToken, setTurnstileToken] = useState<string>('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrors([])
    setSuccess(null)
    const fd = new FormData(e.currentTarget)
    const email = String(fd.get('email') ?? '').trim()
    const password = String(fd.get('password') ?? '')
    const passwordConfirm = String(fd.get('passwordConfirm') ?? '')
    const name = String(fd.get('name') ?? '').trim()

    if (mode === 'register' && password !== passwordConfirm) {
      setErrors([{ field: 'passwordConfirm', message: '两次输入的密码不一致' }])
      return
    }
    if (mode === 'register' && password.length < 8) {
      setErrors([{ field: 'password', message: '密码至少 8 位' }])
      return
    }
    if (mode === 'register' && turnstileSiteKey && !turnstileToken) {
      setErrors([{ message: '请先完成人机验证' }])
      return
    }

    startTransition(async () => {
      try {
        const resp = await runAuth(mode, {
          email,
          password,
          passwordConfirm,
          name,
          token: resetToken,
          turnstileToken,
        })
        if (!resp.ok) {
          setErrors(resp.errors)
          return
        }
        if (mode === 'login') {
          router.push(returnUrl)
          router.refresh()
        } else if (mode === 'register') {
          if ('warning' in resp && resp.warning) {
            setSuccess(resp.warning)
          } else {
            setSuccess('注册成功，我们已向你的邮箱发送验证邮件，请前往激活后再登录。')
          }
        } else if (mode === 'forgot') {
          setSuccess('如果该邮箱存在，我们已发送重置链接，请检查邮箱（包括垃圾邮件文件夹）。')
        } else if (mode === 'reset') {
          setSuccess('密码已重置，请用新密码登录。')
          setTimeout(() => router.push('/login'), 1500)
        }
      } catch (err) {
        setErrors([{ message: err instanceof Error ? err.message : '请求失败，请稍后再试' }])
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
        <FieldRow label="邮箱" name="email" type="email" required errors={errors} />
      )}
      {mode === 'register' && <FieldRow label="昵称（可选）" name="name" type="text" errors={errors} />}
      {(mode === 'login' || mode === 'register' || mode === 'reset') && (
        <FieldRow
          label={mode === 'reset' ? '新密码' : '密码'}
          name="password"
          type="password"
          required
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          errors={errors}
        />
      )}
      {(mode === 'register' || mode === 'reset') && (
        <FieldRow
          label="确认密码"
          name="passwordConfirm"
          type="password"
          required
          autoComplete="new-password"
          errors={errors}
        />
      )}

      {mode === 'register' && turnstileSiteKey && (
        <TurnstileWidget siteKey={turnstileSiteKey} onToken={setTurnstileToken} />
      )}

      {errors.filter((e) => !e.field).length > 0 && (
        <div className="auth-error" role="alert">
          {errors.filter((e) => !e.field).map((e, i) => (
            <p key={i}>{e.message}</p>
          ))}
        </div>
      )}
      {success && (
        <div className="auth-success" role="status">
          {success}
        </div>
      )}

      <button type="submit" className="btn btn-primary auth-submit" disabled={pending}>
        {pending ? '处理中…' : submitLabel(mode)}
      </button>

      <div className="auth-foot">
        {mode === 'login' && (
          <>
            <Link href="/forgot-password">忘记密码？</Link>
            <span aria-hidden="true">·</span>
            <Link href="/register">没有账号？立即注册</Link>
          </>
        )}
        {mode === 'register' && (
          <>
            <Link href="/login">已有账号？登录</Link>
          </>
        )}
        {(mode === 'forgot' || mode === 'reset') && (
          <>
            <Link href="/login">返回登录</Link>
          </>
        )}
      </div>
    </form>
  )
}

function submitLabel(mode: Mode) {
  if (mode === 'login') return '登 录'
  if (mode === 'register') return '注 册'
  if (mode === 'forgot') return '发送重置邮件'
  return '重置密码'
}

function FieldRow({
  label,
  name,
  type,
  required,
  autoComplete,
  errors,
}: {
  label: string
  name: string
  type: string
  required?: boolean
  autoComplete?: string
  errors: FieldError[]
}) {
  const fieldErr = errors.find((e) => e.field === name)
  return (
    <label className="auth-field">
      <span>{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        aria-invalid={!!fieldErr}
        aria-describedby={fieldErr ? `${name}-err` : undefined}
      />
      {fieldErr && (
        <span id={`${name}-err`} className="auth-field-err">
          {fieldErr.message}
        </span>
      )}
    </label>
  )
}

declare global {
  interface Window {
    __flymacroOnTurnstile?: (token: string) => void
  }
}

function TurnstileWidget({ siteKey, onToken }: { siteKey: string; onToken: (t: string) => void }) {
  useEffect(() => {
    window.__flymacroOnTurnstile = (t: string) => onToken(t)
    if (!document.querySelector('script[data-turnstile]')) {
      const s = document.createElement('script')
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
      s.async = true
      s.defer = true
      s.setAttribute('data-turnstile', '1')
      document.head.appendChild(s)
    }
    return () => {
      delete window.__flymacroOnTurnstile
    }
  }, [onToken])

  return (
    <div
      className="cf-turnstile auth-turnstile"
      data-sitekey={siteKey}
      data-theme="dark"
      data-callback="__flymacroOnTurnstile"
    />
  )
}

type AuthInput = {
  email: string
  password: string
  passwordConfirm?: string
  name?: string
  token?: string
  turnstileToken?: string
}

type AuthResult = { ok: true; warning?: string } | { ok: false; errors: FieldError[] }

async function runAuth(mode: Mode, input: AuthInput): Promise<AuthResult> {
  if (mode === 'login') {
    return postJson('/api/auth/login', { email: input.email, password: input.password })
  }
  if (mode === 'register') {
    return postJson('/api/auth/register', {
      email: input.email,
      password: input.password,
      name: input.name || undefined,
      turnstileToken: input.turnstileToken || undefined,
    })
  }
  if (mode === 'forgot') {
    return postJson('/api/users/forgot-password', { email: input.email })
  }
  if (mode === 'reset') {
    return postJson('/api/users/reset-password', {
      token: input.token,
      password: input.password,
    })
  }
  return { ok: false, errors: [{ message: '未知的表单类型' }] }
}

async function postJson(url: string, body: Record<string, unknown>): Promise<AuthResult> {
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(body),
  })
  if (resp.ok) return { ok: true }
  let data: unknown = null
  try {
    data = await resp.json()
  } catch {
    /* noop */
  }
  return { ok: false, errors: extractErrors(data, resp.status) }
}

function extractErrors(data: unknown, status: number): FieldError[] {
  if (!data || typeof data !== 'object') {
    return [{ message: defaultMessage(status) }]
  }
  const maybe = data as { errors?: unknown; message?: unknown }
  if (Array.isArray(maybe.errors) && maybe.errors.length > 0) {
    return maybe.errors.map((e: unknown) => {
      if (typeof e === 'string') return { message: e }
      if (e && typeof e === 'object') {
        const obj = e as { field?: string; message?: string; name?: string }
        return { field: obj.field, message: obj.message ?? obj.name ?? '请求失败' }
      }
      return { message: '请求失败' }
    })
  }
  if (typeof maybe.message === 'string') {
    return [{ message: translateMessage(maybe.message, status) }]
  }
  return [{ message: defaultMessage(status) }]
}

function defaultMessage(status: number): string {
  if (status === 401) return '邮箱或密码错误'
  if (status === 403) return '账号未激活或没有权限'
  if (status === 429) return '请求过于频繁，请稍后再试'
  return '请求失败，请稍后再试'
}

function translateMessage(msg: string, status: number): string {
  const lc = msg.toLowerCase()
  if (lc.includes('invalid') && lc.includes('credentials')) return '邮箱或密码错误'
  if (lc.includes('email') && lc.includes('not verified')) return '邮箱尚未激活，请检查注册时收到的验证邮件'
  if (lc.includes('locked')) return '账号已被锁定，请稍后再试或联系客服'
  if (lc.includes('exists')) return '该邮箱已注册，请直接登录或使用「忘记密码」'
  if (status === 401 || status === 403) return defaultMessage(status)
  return msg
}
