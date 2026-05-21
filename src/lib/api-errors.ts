type ApiResult = { success: boolean; error?: string; code?: string }

const CODE_TO_I18N_KEY: Record<string, string> = {
  rate_limited: 'apiErrors.rate_limited',
  captcha_required: 'apiErrors.captcha_required',
  invalid_credentials: 'apiErrors.invalid_credentials',
  missing_credentials: 'apiErrors.missing_credentials',
  invalid_email: 'apiErrors.invalid_email',
  email_exists: 'apiErrors.email_exists',
  password_weak: 'apiErrors.password_weak',
  password_too_short: 'apiErrors.password_too_short',
  password_reuse: 'apiErrors.password_reuse',
  missing_turnstile: 'apiErrors.missing_turnstile',
  turnstile_failed: 'apiErrors.turnstile_failed',
  account_suspended: 'apiErrors.account_suspended',
  account_banned: 'apiErrors.account_banned',
  insufficient_credits: 'apiErrors.insufficient_credits',
  'insufficient-credits': 'apiErrors.insufficient_credits',
  already_exchanged: 'apiErrors.already_exchanged',
  'already-exchanged': 'apiErrors.already_exchanged',
  'macro-not-found': 'apiErrors.macro_not_found',
  'exchange-not-found': 'apiErrors.exchange_not_found',
  'package-not-found': 'apiErrors.package_not_found',
  'invalid-package-id': 'apiErrors.invalid_package',
  'payment-not-configured': 'apiErrors.payment_not_configured',
  'checkout-failed': 'apiErrors.checkout_failed',
  unauthenticated: 'apiErrors.unauthenticated',
  internal_error: 'apiErrors.internal_error',
  invalid_token: 'apiErrors.invalid_token',
  email_not_verified: 'apiErrors.email_not_verified',
}

export function getApiErrorMessage(result: ApiResult, t: (key: string) => string): string {
  if (!result.error) return t('apiErrors.unknown')
  const i18nKey = result.code ? CODE_TO_I18N_KEY[result.code] : undefined
  if (i18nKey) {
    try {
      const translated = t(i18nKey)
      if (translated && translated !== i18nKey) return translated
    } catch {
      // i18n key not found, fall through
    }
  }
  return result.error
}
