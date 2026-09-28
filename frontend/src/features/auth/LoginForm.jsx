import React, { useCallback, useEffect, useRef, useState } from 'react'
import { authApi } from '../../api/auth.js'
import { useToast } from '../../components/ui/Kit.jsx'
import { AttemptsMeter, AuthButton, AuthField, AuthHeading, AuthInput, CapsLockHint, LockoutPanel, PasswordInput } from './parts.jsx'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function LoginForm({ initialEmail = '', onSignedIn, onNeedsVerification, onSwitch }) {
  const toast = useToast()
  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [attempts, setAttempts] = useState(null)
  const [lock, setLock] = useState(null)
  const [loading, setLoading] = useState(false)
  const [capsLock, setCapsLock] = useState(false)
  const passwordRef = useRef(null)
  const emailRef = useRef(null)

  useEffect(() => { (initialEmail ? passwordRef : emailRef).current?.focus() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (event) => {
    event.preventDefault()
    const nextErrors = {}
    if (!EMAIL.test(email.trim())) nextErrors.email = 'Saisissez une adresse e-mail valide.'
    if (!password) nextErrors.password = 'Saisissez votre mot de passe.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setLoading(true)
    try {
      const { user } = await authApi.login({ email: email.trim(), password })
      setAttempts(null)
      onSignedIn(user)
    } catch (error) {
      setPassword('')
      if (error.code === 'INVALID_CREDENTIALS') {
        setAttempts({ remaining: error.details.remainingAttempts, max: error.details.maxAttempts })
        toast.error('Identifiants incorrects', { description: `${error.details.remainingAttempts} tentative${error.details.remainingAttempts > 1 ? 's' : ''} restante${error.details.remainingAttempts > 1 ? 's' : ''} avant verrouillage.` })
        passwordRef.current?.focus()
      } else if (error.code === 'ACCOUNT_LOCKED') {
        setAttempts(null)
        setLock(error.details)
        toast.error('Compte temporairement verrouillé', { description: error.message })
      } else if (error.code === 'EMAIL_NOT_VERIFIED') {
        toast.info('Vérifiez votre adresse e-mail', { description: error.details.code ? 'Confirmez votre compte avec le code affiché.' : 'Un code de confirmation vient de vous être envoyé.' })
        onNeedsVerification({ email: error.details.email, resendAvailableAt: error.details.resendAvailableAt, code: error.details.code })
      } else if (error.fields && Object.keys(error.fields).length) {
        setErrors(error.fields)
      } else {
        toast.error(error.status === 0 ? 'Connexion impossible' : 'Échec de la connexion', { description: error.message })
      }
    } finally {
      setLoading(false)
    }
  }

  const unlock = useCallback(() => { setLock(null); setAttempts(null) }, [])

  return (
    <div className="auth-reveal">
      <AuthHeading title="Connexion" subtitle="Accédez à vos demandes et au matériel de votre équipe." />

      {lock ? (
        <div className="mt-8">
          <LockoutPanel retryAt={lock.retryAt} retryInHours={lock.retryInHours} onDone={unlock} onOtherAccount={() => { unlock(); setEmail(''); setTimeout(() => emailRef.current?.focus(), 50) }} />
        </div>
      ) : (
        <form noValidate onSubmit={submit} className="mt-8 space-y-4">
          <AuthField label="Adresse e-mail" htmlFor="login-email" error={errors.email}>
            <AuthInput ref={emailRef} id="login-email" type="email" autoComplete="email" inputMode="email" placeholder="nom@entreprise.com" value={email} error={errors.email}
              onChange={(event) => { setEmail(event.target.value); setErrors((current) => ({ ...current, email: undefined })) }} />
          </AuthField>
          <AuthField label="Mot de passe" htmlFor="login-password" error={errors.password}>
            <PasswordInput id="login-password" inputRef={passwordRef} autoComplete="current-password" value={password} error={errors.password || attempts} onCapsLock={setCapsLock}
              onChange={(event) => { setPassword(event.target.value); setErrors((current) => ({ ...current, password: undefined })) }} />
            <CapsLockHint active={capsLock} />
          </AuthField>
          {attempts && <AttemptsMeter key={attempts.remaining} remaining={attempts.remaining} max={attempts.max} />}
          <div className="pt-2">
            <AuthButton loading={loading} loadingLabel="Connexion en cours">Se connecter</AuthButton>
          </div>
        </form>
      )}
    </div>
  )
}
