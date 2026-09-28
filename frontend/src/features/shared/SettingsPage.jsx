import React, { useState } from 'react'
import { fmtDateTime } from '../../utils/formatters.js'
import { Button, Field, Select, Avatar, PageHeader, useToast, SettingsSection, ToggleRow, DEFAULT_PREFS } from '../../components/ui/Kit.jsx'
import { useApp } from './context.js'

export function SettingsPage() {
  const { role, me, logout } = useApp()
  const toast = useToast()
  const [prefs, setPrefs] = useState(DEFAULT_PREFS)
  const [dirty, setDirty] = useState(false)
  const setPref = (key) => (value) => { setPrefs((previous) => ({ ...previous, [key]: value })); setDirty(true) }
  const save = () => { setDirty(false); toast.success('Préférences enregistrées', { description: 'Elles sont appliquées immédiatement à votre espace.' }) }
  const discard = () => { setPrefs(DEFAULT_PREFS); setDirty(false); toast.info('Modifications annulées') }
  const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const notifRows = role === 'admin' ? [ ['newRequests', 'Nouvelles demandes', "Être notifié·e à chaque nouvelle demande de matériel."], ['stockAlerts', 'Alertes de stock', "Être alerté·e lorsqu'un matériel passe en stock faible ou en rupture."], ['weekly', 'Résumé hebdomadaire', 'Chaque lundi : activité des demandes et état du parc.'] ] : [ ['decisions', 'Décisions sur mes demandes', "Être notifié·e dès qu'une de vos demandes est approuvée ou refusée."], ['pendingReminder', 'Rappels de demandes en attente', 'Un rappel si une demande reste en attente plus de 48 h.'], ['weekly', 'Résumé hebdomadaire', 'Chaque lundi : un point sur vos demandes.'] ]
  return (
    <>
      <PageHeader title="Paramètres" subtitle="Préférences de notifications, d'affichage et de session." />
      <div className="grid items-start gap-5 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-3">
          <SettingsSection icon="bell" chip="bg-primary-soft text-primary" title="Notifications" description="Choisissez les événements qui déclenchent une notification.">{notifRows.map(([key, title, description]) => <ToggleRow key={key} title={title} description={description} checked={prefs[key]} onChange={setPref(key)} />)}</SettingsSection>
          <SettingsSection icon="sliders" chip="bg-violet-50 text-violet-600" title="Préférences" description="Langue, fuseau horaire et affichage."><div className="grid gap-4 sm:grid-cols-2"><Field label="Langue"><Select value={prefs.lang} onChange={(event) => setPref('lang')(event.target.value)}><option value="fr">Français</option><option value="en">English</option></Select></Field><Field label="Fuseau horaire"><Select value={prefs.tz} onChange={(event) => setPref('tz')(event.target.value)}><option value="Europe/Paris">(GMT+1) Paris</option><option value="Europe/London">(GMT) Londres</option><option value="America/New_York">(GMT−5) New York</option></Select></Field><Field label="Format de date"><Select value={prefs.dateFmt} onChange={(event) => setPref('dateFmt')(event.target.value)}><option value="dmy">JJ/MM/AAAA</option><option value="mdy">MM/JJ/AAAA</option><option value="iso">AAAA-MM-JJ</option></Select></Field><Field label="Densité de l'interface"><Select value={prefs.compact ? 'compact' : 'comfy'} onChange={(event) => setPref('compact')(event.target.value === 'compact')}><option value="comfy">Confortable</option><option value="compact">Compacte</option></Select></Field></div></SettingsSection>
        </div>
        <div className="space-y-5 lg:col-span-2">
          <SettingsSection icon="shield" chip="bg-emerald-50 text-emerald-600" title="Session" description="Informations de connexion à votre espace."><div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5"><Avatar name={me.name} size={40} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">{me.name}</p><p className="truncate text-xs text-slate-500">{me.email}</p></div></div><dl className="mt-4 space-y-3"><div className="flex items-center justify-between"><dt className="text-[13px] text-slate-500">Dernière connexion</dt><dd className="text-[13px] font-medium text-slate-800">{me.lastLoginAt ? fmtDateTime(me.lastLoginAt) : `Aujourd'hui à ${now}`}</dd></div><div className="flex items-center justify-between"><dt className="text-[13px] text-slate-500">Appareil</dt><dd className="text-[13px] font-medium text-slate-800">Navigateur web</dd></div><div className="flex items-center justify-between"><dt className="text-[13px] text-slate-500">Lieu</dt><dd className="text-[13px] font-medium text-slate-800">Paris, France</dd></div></dl><Button variant="danger-soft" icon="log-out" className="mt-4 w-full" onClick={logout}>Se déconnecter de cet appareil</Button></SettingsSection>
          <SettingsSection icon="info" chip="bg-slate-100 text-slate-500" title="À propos" description="Informations sur l'application."><dl className="space-y-3"><div className="flex items-center justify-between"><dt className="text-[13px] text-slate-500">Version</dt><dd className="tnum text-[13px] font-medium text-slate-800">2.4.0</dd></div><div className="flex items-center justify-between"><dt className="text-[13px] text-slate-500">Environnement</dt><dd className="text-[13px] font-medium text-slate-800">Démonstration</dd></div><div className="flex items-center justify-between"><dt className="text-[13px] text-slate-500">Données</dt><dd className="text-[13px] font-medium text-slate-800">API Flowstock</dd></div></dl></SettingsSection>
        </div>
      </div>
      {dirty && <div className="fixed bottom-4 left-1/2 z-40 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2"><div className="anim-toast flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-modal"><span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" aria-hidden="true" /><p className="hidden text-sm text-slate-600 sm:block">Modifications non enregistrées</p><div className="ml-auto flex items-center gap-2"><Button variant="ghost" size="xs" onClick={discard}>Annuler</Button><Button variant="primary" size="xs" onClick={save}>Enregistrer</Button></div></div></div>}
    </>
  )
}
