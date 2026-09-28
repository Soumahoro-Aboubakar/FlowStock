import React, { useEffect, useRef, useState } from 'react'
import { cx } from '../../utils/formatters.js'
import { Icon } from '../../components/ui/icons.jsx'
import { Spinner } from '../../components/ui/Kit.jsx'

export function BrandMark({ size = 28 }) {
  return (
    <span className="auth-mark flex items-center justify-center text-white" style={{ width: size, height: size, borderRadius: Math.round(size * 0.28) }}>
      <Icon name="package" size={Math.round(size * 0.54)} strokeWidth={2.1} />
    </span>
  )
}

export function Wordmark() {
  return (
    <span className="flex items-center gap-2.5">
      <BrandMark />
      <span className="text-[15px] font-semibold tracking-[-0.01em] text-slate-950">Materio</span>
    </span>
  )
}

// "Étape 1 sur 2" — signup and email verification are one flow, shown as such.
export function StepIndicator({ step, total = 2, label }) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <div className="flex gap-1" aria-hidden="true">
        {Array.from({ length: total }, (_, index) => (
          <span key={index} className={cx('h-1 w-6 rounded-full transition-colors duration-500', index < step ? 'bg-primary' : 'bg-slate-200')} />
        ))}
      </div>
      <p className="text-[12px] font-medium text-slate-500"><span className="tnum">Étape {step} sur {total}</span><span className="mx-1.5 text-slate-300">·</span>{label}</p>
    </div>
  )
}

export function AuthHeading({ title, subtitle }) {
  return (
    <header>
      <h1 className="text-[26px] font-semibold leading-[1.2] tracking-[-0.025em] text-slate-950">{title}</h1>
      {subtitle && <p className="mt-2 text-[14.5px] leading-relaxed text-slate-500">{subtitle}</p>}
    </header>
  )
}

export function AuthField({ label, htmlFor, error, hint, aside, children }) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="text-[13px] font-medium text-slate-700">{label}</label>
        {aside}
      </div>
      {children}
      <div aria-live="polite">
        {error
          ? <p key={error} className="anim-fade-in mt-1.5 text-[12.5px] leading-snug text-red-600">{error}</p>
          : hint ? <p className="mt-1.5 text-[12.5px] leading-snug text-slate-500">{hint}</p> : null}
      </div>
    </div>
  )
}

export const AuthInput = React.forwardRef(function AuthInput({ error, className, trailing, ...props }, ref) {
  return (
    <div className="relative">
      <input ref={ref} {...props} aria-invalid={!!error || undefined}
        className={cx('auth-input', error && 'auth-input-error', trailing && 'pr-11', className)} />
      {trailing && <div className="absolute inset-y-0 right-1 flex items-center">{trailing}</div>}
    </div>
  )
})

export function AuthButton({ loading, loadingLabel, success, children, className, disabled, ...props }) {
  return (
    <button type="submit" {...props} disabled={disabled || loading} aria-busy={loading || undefined}
      className={cx('auth-button', success && 'auth-button-success', className)}>
      <span className={cx('flex items-center justify-center gap-2 transition-opacity duration-150', loading && 'opacity-0')}>{children}</span>
      {loading && <span className="absolute inset-0 flex items-center justify-center"><Spinner size={16} /><span className="sr-only">{loadingLabel}</span></span>}
    </button>
  )
}

export function TextLink({ children, className, ...props }) {
  return <button type="button" {...props} className={cx('font-medium text-slate-950 underline decoration-slate-300 underline-offset-[3px] transition-colors hover:decoration-slate-950', className)}>{children}</button>
}

export function PasswordInput({ id, value, onChange, error, autoComplete, placeholder, inputRef, onCapsLock }) {
  const [visible, setVisible] = useState(false)
  const detectCaps = (event) => { if (onCapsLock && event.getModifierState) onCapsLock(event.getModifierState('CapsLock')) }
  return (
    <AuthInput ref={inputRef} id={id} type={visible ? 'text' : 'password'} value={value} onChange={onChange} error={error} autoComplete={autoComplete} placeholder={placeholder}
      onKeyDown={detectCaps} onKeyUp={detectCaps} spellCheck={false}
      trailing={
        <button type="button" onClick={() => setVisible((current) => !current)} aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} aria-pressed={visible}
          className="inline-flex h-8 w-9 items-center justify-center rounded-md text-slate-400 transition-colors hover:text-slate-700 focus-visible:text-slate-700">
          <Icon name={visible ? 'eye-off' : 'eye'} size={16} />
        </button>
      } />
  )
}

export const passwordChecks = (password) => [
  { key: 'length', label: '8 caractères', ok: password.length >= 8 },
  { key: 'letter', label: 'une lettre', ok: /[A-Za-zÀ-ÿ]/.test(password) },
  { key: 'digit', label: 'un chiffre', ok: /\d/.test(password) },
]

export function passwordScore(password) {
  if (!password) return 0
  let score = passwordChecks(password).filter((check) => check.ok).length
  if (password.length >= 12 && /[^A-Za-z0-9]/.test(password) && /[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1
  return Math.min(score, 4)
}

const STRENGTH = ['', 'Faible', 'Faible', 'Correct', 'Robuste']
const STRENGTH_BAR = ['bg-slate-200', 'bg-red-500', 'bg-red-500', 'bg-amber-500', 'bg-emerald-500']

export function PasswordStrength({ password }) {
  const score = passwordScore(password)
  return (
    <div className={cx('grid transition-[grid-template-rows,opacity,margin] duration-300 ease-out', password ? 'mt-2.5 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')} aria-hidden={!password}>
      <div className="overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="grid flex-1 grid-cols-4 gap-1">
            {[1, 2, 3, 4].map((step) => <span key={step} className={cx('h-[3px] rounded-full transition-colors duration-300', score >= step ? STRENGTH_BAR[score] : 'bg-slate-200')} />)}
          </div>
          <span className="w-14 text-right text-[12px] font-medium text-slate-600">{STRENGTH[score]}</span>
        </div>
        <p className="mt-2 text-[12.5px] text-slate-500">
          {passwordChecks(password).map((check, index) => (
            <React.Fragment key={check.key}>
              {index > 0 && <span className="text-slate-300"> · </span>}
              <span className={cx('transition-colors duration-200', check.ok ? 'text-slate-900' : 'text-slate-400')}>
                {check.ok && <Icon name="check" size={11} strokeWidth={2.6} className="mr-0.5 inline -translate-y-px text-emerald-600" />}{check.label}
              </span>
            </React.Fragment>
          ))}
        </p>
      </div>
    </div>
  )
}

export function CapsLockHint({ active }) {
  return (
    <div className={cx('grid transition-all duration-200', active ? 'mt-1.5 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')} aria-live="polite">
      <p className="overflow-hidden text-[12.5px] text-amber-700">Verrouillage majuscules activé.</p>
    </div>
  )
}

export function Notice({ tone = 'danger', title, children, footer }) {
  const tones = {
    danger: 'border-red-200 bg-red-50/60',
    warning: 'border-amber-200 bg-amber-50/60',
  }
  return (
    <div role="alert" className={cx('anim-scale-in rounded-lg border px-3.5 py-3', tones[tone])}>
      <p className={cx('text-[13px] font-medium', tone === 'danger' ? 'text-red-800' : 'text-amber-900')}>{title}</p>
      {children && <p className={cx('mt-0.5 text-[12.5px] leading-relaxed', tone === 'danger' ? 'text-red-700/90' : 'text-amber-800/90')}>{children}</p>}
      {footer}
    </div>
  )
}

// Remaining login attempts before the temporary lock.
export function AttemptsMeter({ remaining, max }) {
  return (
    <Notice title="Identifiants incorrects" footer={
      <div className="mt-2.5 flex items-center gap-2.5">
        <div className="grid flex-1 gap-1" style={{ gridTemplateColumns: `repeat(${max}, minmax(0, 1fr))` }} aria-hidden="true">
          {Array.from({ length: max }, (_, index) => <span key={index} className={cx('h-[3px] rounded-full', index < max - remaining ? 'bg-red-500' : 'bg-red-200')} />)}
        </div>
        <span className="tnum text-[12px] font-medium text-red-700">{remaining}/{max}</span>
      </div>
    }>
      {remaining > 1 ? `Encore ${remaining} tentatives avant un blocage temporaire.` : 'Dernière tentative avant un blocage temporaire.'}
    </Notice>
  )
}

function useNow(active) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return undefined
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [active])
  return now
}

const pad = (value) => String(value).padStart(2, '0')

export function LockoutPanel({ retryAt, retryInHours, onDone, onOtherAccount }) {
  const now = useNow(true)
  const left = Math.max(0, retryAt - now)
  const unlockTime = new Date(retryAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  useEffect(() => { if (left === 0) onDone() }, [left, onDone])
  return (
    <div className="anim-scale-in overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,.04)]">
      <div className="flex items-start gap-3.5 p-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 ring-1 ring-amber-200/70"><Icon name="lock" size={17} /></span>
        <div className="min-w-0">
          <p className="text-[14px] font-semibold text-slate-950">Connexion temporairement bloquée</p>
          <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
            Trop de tentatives échouées. Réessayez dans {retryInHours} heure{retryInHours > 1 ? 's' : ''}, à partir de {unlockTime}.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-4 py-3">
        <span className="tnum text-[13px] font-semibold tracking-tight text-slate-900" role="timer" aria-label="Temps restant avant déverrouillage">
          {pad(Math.floor(left / 3600000))}:{pad(Math.floor((left % 3600000) / 60000))}:{pad(Math.floor((left % 60000) / 1000))}
        </span>
        <TextLink onClick={onOtherAccount} className="text-[13px]">Utiliser un autre compte</TextLink>
      </div>
    </div>
  )
}

export function OtpInput({ length = 6, value, onChange, onComplete, status, disabled }) {
  const refs = useRef([])
  const digits = Array.from({ length }, (_, index) => value[index] || '')
  const focusAt = (index) => { const input = refs.current[Math.max(0, Math.min(length - 1, index))]; if (input) { input.focus(); input.select() } }
  useEffect(() => { if (status === 'error') focusAt(0) }, [status]) // eslint-disable-line react-hooks/exhaustive-deps

  const commit = (next) => {
    const clean = next.replace(/\D/g, '').slice(0, length)
    onChange(clean)
    if (clean.length === length) onComplete(clean)
  }
  const handleInput = (index, raw) => {
    const typed = raw.replace(/\D/g, '')
    if (!typed) return
    if (typed.length > 1) { commit(value.slice(0, index) + typed); focusAt(index + typed.length); return }
    commit((value.slice(0, index) + typed + value.slice(index + 1)).slice(0, length))
    focusAt(index + 1)
  }
  const handleKey = (index, event) => {
    if (event.key === 'Backspace') {
      event.preventDefault()
      if (digits[index]) commit(value.slice(0, index) + value.slice(index + 1))
      else if (index > 0) { commit(value.slice(0, index - 1) + value.slice(index)); focusAt(index - 1) }
    } else if (event.key === 'ArrowLeft') { event.preventDefault(); focusAt(index - 1) }
    else if (event.key === 'ArrowRight') { event.preventDefault(); focusAt(index + 1) }
  }
  const handlePaste = (event) => {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!pasted) return
    event.preventDefault()
    commit(pasted)
    focusAt(pasted.length)
  }

  return (
    <div className={cx('flex items-center gap-2', status === 'error' && 'auth-shake')} role="group" aria-label="Code de vérification à 6 chiffres">
      {digits.map((digit, index) => (
        <React.Fragment key={index}>
          {index === length / 2 && <span className="h-px w-3 shrink-0 bg-slate-300" aria-hidden="true" />}
          <input
            ref={(element) => { refs.current[index] = element }}
            value={digit}
            onChange={(event) => handleInput(index, event.target.value)}
            onKeyDown={(event) => handleKey(index, event)}
            onPaste={handlePaste}
            onFocus={(event) => event.target.select()}
            inputMode="numeric"
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            maxLength={length}
            disabled={disabled}
            aria-label={`Chiffre ${index + 1}`}
            className={cx('auth-otp tnum', digit && 'auth-otp-filled', status === 'error' && 'auth-otp-error', status === 'success' && 'auth-otp-success')}
            style={status === 'success' ? { transitionDelay: `${index * 40}ms` } : undefined}
          />
        </React.Fragment>
      ))}
    </div>
  )
}

export function useResendCountdown(availableAt) {
  const now = useNow(Boolean(availableAt && availableAt > Date.now()))
  return Math.max(0, Math.ceil(((availableAt || 0) - now) / 1000))
}

export function InlineSpinner({ label }) {
  return <span className="flex items-center gap-2 text-[12.5px] text-slate-500"><Spinner size={12} />{label}</span>
}
