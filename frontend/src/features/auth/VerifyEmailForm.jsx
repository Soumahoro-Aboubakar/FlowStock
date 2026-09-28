import React, { useRef, useState } from 'react'
import { authApi } from '../../api/auth.js'
import { Icon } from '../../components/ui/icons.jsx'
import { Spinner, useToast } from '../../components/ui/Kit.jsx'
import { AuthButton, AuthHeading, InlineSpinner, OtpInput, StepIndicator, TextLink, useResendCountdown } from './parts.jsx'

// Test mode: the API returns the code instead of emailing it, so it is shown here to copy.
function TestCodeBanner({ code, onUse }) {
  const toast = useToast()
  const copy = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).catch(() => {})
    onUse(code)
    toast.success('Code copié', { description: 'Il a aussi été saisi pour vous.' })
  }
  return (
    <div role="status" className="anim-scale-in mb-6 flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800/80">Mode test · votre code</p>
        <p className="tnum mt-0.5 font-mono text-2xl font-bold tracking-[0.3em] text-amber-950 select-all">{code}</p>
      </div>
      <button type="button" onClick={copy} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-[13px] font-semibold text-amber-900 shadow-card ring-1 ring-amber-200 transition hover:bg-amber-100/60">
        <Icon name="copy" size={14} />Copier
      </button>
    </div>
  )
}

export function VerifyEmailForm({ email, resendAvailableAt: initialResendAt, testCode: initialTestCode, onVerified, onBack }) {
  const toast = useToast()
  const [code, setCode] = useState('')
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState(null)
  const [resendAt, setResendAt] = useState(initialResendAt)
  const [testCode, setTestCode] = useState(initialTestCode)
  const [resending, setResending] = useState(false)
  const inFlight = useRef(false)
  const secondsLeft = useResendCountdown(resendAt)

  const verify = async (value) => {
    if (inFlight.current || value.length !== 6) return
    inFlight.current = true
    setStatus('verifying')
    setMessage(null)
    try {
      const { user } = await authApi.verifyEmail(email, value)
      setStatus('success')
      // Let the success state register before the app takes over.
      setTimeout(() => onVerified(user), 650)
    } catch (error) {
      setStatus('error')
      setMessage(error.message)
      setCode('')
      if (error.code === 'CODE_LOCKED' || error.code === 'CODE_EXPIRED') setResendAt(Date.now())
      toast.error(error.code === 'CODE_EXPIRED' ? 'Code expiré' : error.code === 'CODE_LOCKED' ? 'Code bloqué' : 'Code incorrect', { description: error.message })
    } finally {
      inFlight.current = false
    }
  }

  const resend = async () => {
    setResending(true)
    try {
      const result = await authApi.resendCode(email)
      setResendAt(result.resendAvailableAt)
      if (result.code) setTestCode(result.code)
      setStatus('idle')
      setMessage(null)
      setCode('')
      toast.success(result.code ? 'Nouveau code généré' : 'Nouveau code envoyé', { description: result.code ? 'Il est affiché en haut de l’écran.' : `Un nouveau code a été envoyé à ${email}.` })
    } catch (error) {
      if (error.details?.resendAvailableAt) setResendAt(error.details.resendAvailableAt)
      toast.error('Envoi impossible', { description: error.message })
    } finally {
      setResending(false)
    }
  }

  const success = status === 'success'
  return (
    <div className="auth-reveal">
      {testCode && !success && <TestCodeBanner code={testCode} onUse={(value) => { setCode(value); verify(value) }} />}
      <StepIndicator step={2} label={success ? 'Compte activé' : 'Vérification de l’e-mail'} />
      <AuthHeading
        title={success ? 'Adresse confirmée' : 'Vérifiez votre e-mail'}
        subtitle={success ? 'Votre compte est actif. Ouverture de votre espace…' : testCode ? <>Saisissez le code à 6 chiffres affiché ci-dessus pour confirmer <span className="font-medium text-slate-900">{email}</span>. Il expire dans 15 minutes.</> : <>Saisissez le code à 6 chiffres envoyé à <span className="font-medium text-slate-900">{email}</span>. Il expire dans 15 minutes.</>}
      />

      <form noValidate onSubmit={(event) => { event.preventDefault(); verify(code) }} className="mt-8">
        <OtpInput value={code} onChange={(value) => { setCode(value); if (status === 'error') { setStatus('idle'); setMessage(null) } }} onComplete={verify} status={status} disabled={status === 'verifying' || success} />
        <div className="mt-2.5 min-h-[20px]" aria-live="polite">
          {status === 'verifying' && <InlineSpinner label="Vérification du code…" />}
          {status === 'error' && message && <p className="anim-fade-in text-[12.5px] text-red-600">{message}</p>}
        </div>
        <div className="mt-4">
          <AuthButton loading={status === 'verifying'} loadingLabel="Vérification" success={success} disabled={code.length !== 6 || success}>
            {success ? <><Icon name="check" size={16} strokeWidth={2.4} className="auth-pop" />Adresse confirmée</> : 'Confirmer'}
          </AuthButton>
        </div>
      </form>

      <div className="mt-8 border-t border-slate-100 pt-6 text-[13px] text-slate-500">
        <div className="flex items-center justify-between gap-4">
          <p>{testCode ? 'Code expiré ?' : 'Rien reçu ? Vérifiez vos spams.'}</p>
          {secondsLeft > 0
            ? <span className="tnum shrink-0 text-slate-400">Renvoyer dans {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}</span>
            : <TextLink onClick={resend} disabled={resending || success} className="shrink-0 disabled:opacity-50">{resending ? <span className="inline-flex items-center gap-1.5"><Spinner size={11} />Envoi…</span> : 'Renvoyer le code'}</TextLink>}
        </div>
        <div className="mt-2.5 flex items-center justify-between gap-4">
          <p>Mauvaise adresse ?</p>
          <TextLink onClick={onBack} className="shrink-0">Modifier l’e-mail</TextLink>
        </div>
      </div>
    </div>
  )
}
