import React, { useEffect, useRef, useState } from 'react'
import { authApi } from '../../api/auth.js'
import { useToast } from '../../components/ui/Kit.jsx'
import { AuthButton, AuthField, AuthHeading, AuthInput, CapsLockHint, PasswordInput, PasswordStrength, StepIndicator, passwordChecks } from './parts.jsx'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const NAME = /^[\p{L}\p{M}' .-]+$/u
const TEAMS = ['Design', 'Finance', 'Ingénierie', 'Marketing', 'Opérations', 'Ressources humaines', 'Ventes']

function validate({ name, email, team, password }) {
  const errors = {}
  if (name.trim().length < 2) errors.name = 'Indiquez votre nom complet.'
  else if (!NAME.test(name.trim())) errors.name = 'Lettres, espaces, apostrophes et tirets uniquement.'
  if (!EMAIL.test(email.trim())) errors.email = 'Saisissez une adresse e-mail valide.'
  if (team.trim().length < 2) errors.team = 'Indiquez votre équipe.'
  const missing = passwordChecks(password).filter((check) => !check.ok)
  if (missing.length) errors.password = `Il manque : ${missing.map((check) => check.label).join(', ')}.`
  return errors
}

export function SignupForm({ initialEmail = '', emailLocked = false, onCodeSent, onSwitch }) {
  const toast = useToast()
  const [form, setForm] = useState({ name: '', email: initialEmail, team: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [capsLock, setCapsLock] = useState(false)
  const nameRef = useRef(null)
  useEffect(() => { nameRef.current?.focus() }, [])

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const submit = async (event) => {
    event.preventDefault()
    const nextErrors = validate(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setLoading(true)
    try {
      const result = await authApi.signup({ name: form.name.trim(), email: form.email.trim(), team: form.team.trim(), password: form.password })
      toast.success('Code de vérification envoyé', { description: `Consultez la boîte de réception de ${result.email}.` })
      onCodeSent({ email: result.email, resendAvailableAt: result.resendAvailableAt })
    } catch (error) {
      if (error.code === 'EMAIL_TAKEN') {
        setErrors({ email: error.message })
        toast.info('Vous avez déjà un compte', { description: 'Connectez-vous avec cette adresse.', action: { label: 'Se connecter', onClick: () => onSwitch('login', form.email) } })
      } else if (Object.keys(error.fields).length) {
        setErrors(error.fields)
        toast.error('Vérifiez le formulaire', { description: error.message })
      } else {
        toast.error(error.status === 0 ? 'Connexion impossible' : 'Inscription impossible', { description: error.message })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-reveal">
      <StepIndicator step={1} label="Informations du compte" />
      <AuthHeading title="Créer un compte" subtitle={emailLocked ? 'Vous avez été invité·e sur Materio. Complétez votre profil pour activer l’accès.' : 'Demandez du matériel et suivez chaque demande jusqu’à sa validation.'} />

      <form noValidate onSubmit={submit} className="mt-8 space-y-4">
        <div className="grid gap-4 sm:grid-cols-[1.35fr_1fr]">
          <AuthField label="Nom complet" htmlFor="signup-name" error={errors.name}>
            <AuthInput ref={nameRef} id="signup-name" autoComplete="name" placeholder="Camille Roux" value={form.name} onChange={update('name')} error={errors.name} />
          </AuthField>
          <AuthField label="Équipe" htmlFor="signup-team" error={errors.team}>
            <AuthInput id="signup-team" autoComplete="organization-title" placeholder="Design" list="signup-teams" value={form.team} onChange={update('team')} error={errors.team} />
            <datalist id="signup-teams">{TEAMS.map((team) => <option key={team} value={team} />)}</datalist>
          </AuthField>
        </div>
        <AuthField label="Adresse e-mail" htmlFor="signup-email" error={errors.email} hint={emailLocked ? 'Adresse associée à votre invitation.' : 'Nous y enverrons un code de confirmation.'}>
          <AuthInput id="signup-email" type="email" inputMode="email" autoComplete="email" placeholder="nom@entreprise.com" value={form.email} onChange={update('email')} error={errors.email} readOnly={emailLocked} />
        </AuthField>
        <AuthField label="Mot de passe" htmlFor="signup-password" error={errors.password}>
          <PasswordInput id="signup-password" autoComplete="new-password" placeholder="8 caractères minimum" value={form.password} onChange={update('password')} error={errors.password} onCapsLock={setCapsLock} />
          <CapsLockHint active={capsLock} />
          <PasswordStrength password={form.password} />
        </AuthField>
        <div className="pt-2">
          <AuthButton loading={loading} loadingLabel="Création du compte">Continuer</AuthButton>
        </div>
      </form>
    </div>
  )
}
