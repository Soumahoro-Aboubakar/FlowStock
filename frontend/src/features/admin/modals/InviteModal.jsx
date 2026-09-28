import React, { useEffect, useMemo, useState } from 'react'
import { Button, Input, Select, Field, Modal } from '../../../components/ui/Kit.jsx'

export function InviteModal({ open, onClose, app }) {
  const { users, inviteUser, busyAction } = app
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('employee')
  const [team, setTeam] = useState('')
  const [errors, setErrors] = useState({})
  useEffect(() => { if (open) { setName(''); setEmail(''); setRole('employee'); setTeam(''); setErrors({}) } }, [open])
  const teams = useMemo(() => [...new Set(users.map((user) => user.team))].sort((a, b) => a.localeCompare(b)), [users])
  const submit = () => {
    const errs = {}
    if (name.trim().length < 3) errs.name = 'Indiquez le nom complet (3 caractères minimum).'
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) errs.email = 'Adresse e-mail invalide.'
    else if (users.some((user) => user.email.toLowerCase() === email.trim().toLowerCase())) errs.email = 'Cette adresse est déjà utilisée.'
    if (team.trim().length < 2) errs.team = 'Indiquez une équipe.'
    setErrors(errs)
    if (Object.keys(errs).length) return
    inviteUser({ name: name.trim(), email: email.trim().toLowerCase(), role, team: team.trim() }, { onFieldErrors: setErrors })
  }
  return (
    <Modal open={open} onClose={onClose} title="Inviter un utilisateur" size="md" description="La personne recevra un lien d'activation à son adresse e-mail." footer={<><Button variant="secondary" disabled={!!busyAction} onClick={onClose}>Annuler</Button><Button variant="primary" icon="send" loading={busyAction === 'invite'} loadingLabel="Envoi de l’invitation" onClick={submit}>Envoyer l'invitation</Button></>}>
      <div className="space-y-4">
        <Field label="Nom complet" required error={errors.name}><Input value={name} autoFocus onChange={(event) => setName(event.target.value)} placeholder="Ex. : Camille Roux" /></Field>
        <Field label="Adresse e-mail professionnelle" required error={errors.email}><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="camille.roux@nexa.io" /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Rôle"><Select value={role} onChange={(event) => setRole(event.target.value)}><option value="employee">Utilisateur</option><option value="admin">Administrateur</option></Select></Field>
          <Field label="Équipe" required error={errors.team} hint="Choisissez une équipe existante ou créez-en une."><Input value={team} onChange={(event) => setTeam(event.target.value)} placeholder="Ex. : Ingénierie" list="teams-list" /><datalist id="teams-list">{teams.map((teamName) => <option key={teamName} value={teamName} />)}</datalist></Field>
        </div>
      </div>
    </Modal>
  )
}
