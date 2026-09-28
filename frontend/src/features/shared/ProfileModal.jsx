import React from 'react'
import { roleLabel } from '../../utils/formatters.js'
import { Button, Avatar, Modal } from '../../components/ui/Kit.jsx'

export function ProfileModal({ open, onClose, app }) {
  const { me, logout } = app
  return (
    <Modal open={open} onClose={onClose} title="Mon profil" size="sm" footer={<><Button variant="danger-soft" icon="log-out" className="mr-auto" onClick={() => { onClose(); logout() }}>Se déconnecter</Button><Button variant="secondary" onClick={onClose}>Fermer</Button></>}>
      <div className="pb-1 pt-2 text-center">
        <Avatar name={me.name} size={64} className="mx-auto" />
        <p className="mt-3 text-base font-bold text-slate-900">{me.name}</p>
        <p className="text-sm text-slate-500">{me.email}</p>
        <div className="mt-3 flex justify-center gap-2">
          <span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary">{roleLabel(me.role)}</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{me.team}</span>
        </div>
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3.5 rounded-xl border border-slate-100 bg-slate-50/60 p-4 text-left">
        <div><dt className="text-xs text-slate-400">Membre depuis</dt><dd className="mt-0.5 text-[13px] font-medium text-slate-800">{me.joined}</dd></div>
        <div><dt className="text-xs text-slate-400">Société</dt><dd className="mt-0.5 text-[13px] font-medium text-slate-800">Nexa</dd></div>
        <div><dt className="text-xs text-slate-400">Site</dt><dd className="mt-0.5 text-[13px] font-medium text-slate-800">Paris — Siège</dd></div>
        <div><dt className="text-xs text-slate-400">Matricule</dt><dd className="tnum mt-0.5 text-[13px] font-medium text-slate-800">NX-{me.id.slice(-5).toUpperCase()}</dd></div>
      </dl>
    </Modal>
  )
}
