'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'

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
  const t = useTranslations('auth')
  const [pending, startTransition] = useTransition()
  const [errors, setErrors] = useState<FieldError[]>([])
  const [success, setSuccess] = useState<string | null>(null)
  const [turnstileToken, setTurnstileToken] = useState<string>('')
  const [captchaRequired, setCaptchaRequired] = useState(false)
  const [formLoadTime] = useState(() => Date.now())

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrors([])
    setSuccess(null)
    const fd = new FormData(e.currentTarget)
    const email = String(fd.get('email') ?? '').trim()
    const password = String(fd.get('password') ?? '')
    const passwordConfirm = String(fd.get('passwordConfirm') ?? '')
    const name = String(fd.get('name') ?? '').trim()
    const website = String(fd.get('website') ?? '').trim()

    if (mode === 'register' && password !== passwordConfirm) {
      setErrors([{ field: 'passwordConfirm', message: t('passwordMismatch') }])
      return
    }
    if ((mode === 'register' || mode === 'reset') && password.length < 8) {
      setErrors([{ field: 'password', message: t('passwordTooShort') }])
      return
    }
    if ((mode === 'register' || mode === 'reset') && !isPasswordStrong(password)) {
      setErrors([{ field: 'password', message: t('passwordWeak') }])
      return
    }
    if (mode === 'register' && turnstileSiteKey && !turnstileToken) {
      setErrors([{ message: t('captchaRequired') }])
      return
    }
    if (mode === 'login' && captchaRequired && turnstileSiteKey && !turnstileToken) {
      setErrors([{ message: t('captchaRequired') }])
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
          website,
          _t: formLoadTime,
        }, t)
        if (!resp.ok) {
          // Detect captcha_required from backend — activate Turnstile for login
          if (mode === 'login' && resp.captchaRequired) {
            setCaptchaRequired(true)
            setTurnstileToken('')
          }
          setErrors(resp.errors)
          return
        }
        if (mode === 'login') {
          window.location.href = returnUrl
        } else if (mode === 'register') {
          // Remember email for the verify-email page to claim bonus
          try { sessionStorage.setItem('register-email', email) } catch { /* ignore */ }
          window.location.href = returnUrl
        } else if (mode === 'forgot') {
          setSuccess(t('resetSent'))
        } else if (mode === 'reset') {
          setSuccess(t('resetDone'))
          setTimeout(() => router.push('/login'), 1500)
        }
      } catch (err) {
        setErrors([{ message: err instanceof Error ? err.message : t('requestFailed') }])
      }
    })
  }

  const needsTurnstile = turnstileSiteKey && (mode === 'register' || (mode === 'login' && captchaRequired))

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
        <FieldRow label={t('emailField')} name="email" type="email" required errors={errors} />
      )}
      {mode === 'register' && <FieldRow label={t('nicknameField')} name="name" type="text" errors={errors} />}
      {(mode === 'login' || mode === 'register' || mode === 'reset') && (
        <FieldRow
          label={mode === 'reset' ? t('newPasswordField') : t('passwordField')}
          name="password"
          type="password"
          required
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          errors={errors}
        />
      )}
      {(mode === 'register' || mode === 'reset') && (
        <FieldRow
          label={t('confirmPassword')}
          name="passwordConfirm"
          type="password"
          required
          autoComplete="new-password"
          errors={errors}
        />
      )}

      {/* Honeypot — invisible to humans, bots fill it */}
      {mode === 'register' && (
        <input
          type="text"
          name="website"
          autoComplete="off"
          tabIndex={-1}
          aria-hidden="true"
          style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, width: 0 }}
        />
      )}

      {needsTurnstile && (
        <TurnstileWidget siteKey={turnstileSiteKey!} onToken={setTurnstileToken} />
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
        {pending ? t('processing') : submitLabel(mode, t)}
      </button>

      <div className="auth-foot">
        {mode === 'login' && (
          <>
            <Link href="/forgot-password">{t('forgotLink')}</Link>
            <span aria-hidden="true">·</span>
            <Link href="/register">{t('noAccount')}</Link>
          </>
        )}
        {mode === 'register' && (
          <>
            <Link href="/login">{t('hasAccount')}</Link>
          </>
        )}
        {(mode === 'forgot' || mode === 'reset') && (
          <>
            <Link href="/login">{t('backToLogin')}</Link>
          </>
        )}
      </div>
    </form>
  )
}

function isPasswordStrong(password: string): boolean {
  return /[a-zA-Z]/.test(password) && /[0-9]/.test(password)
}

function submitLabel(mode: Mode, t: (key: string) => string) {
  if (mode === 'login') return t('loginTitle')
  if (mode === 'register') return t('registerTitle')
  if (mode === 'forgot') return t('sending')
  return t('resetTitle')
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
    turnstile?: {
      render: (container: string | HTMLElement, options: Record<string, unknown>) => string
      remove: (widgetId: string) => void
    }
  }
}

function TurnstileWidget({ siteKey, onToken }: { siteKey: string; onToken: (t: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const onTokenRef = useRef(onToken)
  onTokenRef.current = onToken

  useEffect(() => {
    if (!containerRef.current) return

    function doRender() {
      if (!containerRef.current || !window.turnstile) return
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme: 'dark',
        callback: (token: string) => onTokenRef.current(token),
        'error-callback': () => { onTokenRef.current('') },
        'expired-callback': () => { onTokenRef.current('') },
      })
    }

    if (window.turnstile) {
      doRender()
    } else if (!document.querySelector('script[data-turnstile]')) {
      const s = document.createElement('script')
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      s.async = true
      s.setAttribute('data-turnstile', '1')
      s.onload = doRender
      document.head.appendChild(s)
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try { window.turnstile.remove(widgetIdRef.current) } catch { /* ignore */ }
        widgetIdRef.current = null
      }
    }
  }, [siteKey])

  return <div ref={containerRef} className="auth-turnstile" />
}

type AuthInput = {
  email: string
  password: string
  passwordConfirm?: string
  name?: string
  token?: string
  turnstileToken?: string
  website?: string
  _t?: number
}

type AuthResult = { ok: true; warning?: string } | { ok: false; errors: FieldError[]; captchaRequired?: boolean }

async function runAuth(mode: Mode, input: AuthInput, t: (key: string) => string): Promise<AuthResult> {
  if (mode === 'login') {
    return postJson('/api/auth/login', {
      email: input.email,
      password: input.password,
      turnstileToken: input.turnstileToken || undefined,
    }, t)
  }
  if (mode === 'register') {
    return postJson('/api/auth/register', {
      email: input.email,
      password: input.password,
      name: input.name || undefined,
      turnstileToken: input.turnstileToken || undefined,
      website: input.website || undefined,
      _t: input._t,
    }, t)
  }
  if (mode === 'forgot') {
    return postJson('/api/auth/forgot-password', { email: input.email }, t)
  }
  if (mode === 'reset') {
    return postJson('/api/auth/reset-password', {
      token: input.token,
      password: input.password,
    }, t)
  }
  return { ok: false, errors: [{ message: t('unknownFormType') }] }
}

async function postJson(url: string, body: Record<string, unknown>, t: (key: string) => string): Promise<AuthResult> {
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
    /* ignore */
  }
  const errors = extractErrors(data, resp.status, t)
  const captchaRequired = isCaptchaRequired(data)
  return { ok: false, errors, captchaRequired }
}

function isCaptchaRequired(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false
  const maybe = data as { code?: string }
  return maybe.code === 'captcha_required'
}

function extractErrors(data: unknown, status: number, t: (key: string) => string): FieldError[] {
  if (!data || typeof data !== 'object') {
    return [{ message: defaultMessage(status, t) }]
  }
  const maybe = data as { errors?: unknown; message?: unknown; success?: boolean; error?: string }
  if (maybe.success === false && typeof maybe.error === 'string') {
    return [{ message: translateMessage(maybe.error, status, t) }]
  }
  if (Array.isArray(maybe.errors) && maybe.errors.length > 0) {
    return maybe.errors.map((e: unknown) => {
      if (typeof e === 'string') return { message: e }
      if (e && typeof e === 'object') {
        const obj = e as { field?: string; message?: string; name?: string }
        return { field: obj.field, message: obj.message ?? obj.name ?? t('requestFailed') }
      }
      return { message: t('requestFailed') }
    })
  }
  if (typeof maybe.message === 'string') {
    return [{ message: translateMessage(maybe.message, status, t) }]
  }
  return [{ message: defaultMessage(status, t) }]
}

function defaultMessage(status: number, t: (key: string) => string): string {
  if (status === 401) return t('wrongCredentials')
  if (status === 403) return t('accountInactive')
  if (status === 429) return t('tooManyRequests')
  return t('requestFailedRetry')
}

function translateMessage(msg: string, status: number, t: (key: string) => string): string {
  const lc = msg.toLowerCase()
  if (lc.includes('invalid') && lc.includes('credentials')) return t('wrongCredentials')
  if (lc.includes('email') && lc.includes('not verified')) return t('emailNotActivated')
  if (lc.includes('not verified') || lc.includes('email_not_verified')) return t('emailNotActivated')
  if (lc.includes('locked')) return t('accountLocked')
  if (lc.includes('exists')) return t('emailRegistered')
  if (lc.includes('turnstile') || lc.includes('人机验证')) return t('captchaRequired')
  if (status === 401 || status === 403) return defaultMessage(status, t)
  return msg
}
