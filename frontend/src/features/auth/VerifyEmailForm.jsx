import React, { useRef, useState } from 'react'
import { authApi } from '../../api/auth.js'
import { Icon } from '../../components/ui/icons.jsx'
import { Spinner, useToast } from '../../components/ui/Kit.jsx'
import { AuthButton, AuthHeading, InlineSpinner, OtpInput, StepIndicator, TextLink, useResendCountdown } from './parts.jsx'

export function VerifyEmailForm({ email, resendAvailableAt: initialResendAt, onVerified, onBack }) {
  const toast = useToast()
  const [code, setCode] = useState('')
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState(null)
  const [resendAt, setResendAt] = useState(initialResendAt)
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
      setStatus('idle')
      setMessage(null)
      setCode('')
      toast.success('Nouveau code envoyé', { description: `Un nouveau code a été envoyé à ${email}.` })
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
      <StepIndicator step={2} label={success ? 'Compte activé' : 'Vérification de l’e-mail'} />
      <AuthHeading
        title={success ? 'Adresse confirmée' : 'Vérifiez votre e-mail'}
        subtitle={success ? 'Votre compte est actif. Ouverture de votre espace…' : <>Saisissez le code à 6 chiffres envoyé à <span className="font-medium text-slate-900">{email}</span>. Il expire dans 15 minutes.</>}
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
          <p>Rien reçu ? Vérifiez vos spams.</p>
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
