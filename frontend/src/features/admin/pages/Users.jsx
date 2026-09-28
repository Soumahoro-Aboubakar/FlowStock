import React, { useMemo, useState } from 'react'
import { norm, pl, isAdminUser } from '../../../utils/formatters.js'
import { Icon } from '../../../components/ui/icons.jsx'
import { Button, RoleBadge, Avatar, EmptyState, PageHeader, SearchInput, Segmented, Dropdown, MenuItem, useToast, LoadingStatus, useLoadingFeedback } from '../../../components/ui/Kit.jsx'
import { useApp } from '../../shared/context.js'

const STATUS_TAG = { invited: 'invitation envoyée', pending: 'e-mail non vérifié' }
const StatusTag = ({ status }) => STATUS_TAG[status] ? <span className="ml-1.5 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">{STATUS_TAG[status]}</span> : null

export function AdminUsers({ params }) {
  const { users, requests, me, navigate, openInvite, changeUserRole } = useApp()
  const toast = useToast()
  const [filtering, markFiltering] = useLoadingFeedback()
  const [q, setQ] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const counts = useMemo(() => { const admins = users.filter(isAdminUser).length; return { all: users.length, admins, employees: users.length - admins } }, [users])
  const options = [{ value: 'all', label: 'Tous', count: counts.all }, { value: 'admins', label: 'Administrateurs', count: counts.admins }, { value: 'employees', label: 'Utilisateurs', count: counts.employees }]
  const rows = useMemo(() => {
    let list = users.slice()
    if (roleFilter === 'admins') list = list.filter(isAdminUser)
    if (roleFilter === 'employees') list = list.filter((user) => !isAdminUser(user))
    if (q.trim()) { const term = norm(q); list = list.filter((user) => norm(user.name).includes(term) || norm(user.email).includes(term) || norm(user.team).includes(term)) }
    return list.sort((a, b) => a.name.localeCompare(b.name, 'fr'))
  }, [users, q, roleFilter])
  const reqByUser = useMemo(() => {
    const map = {}
    for (const request of requests) map[request.userId] = (map[request.userId] || 0) + 1
    return map
  }, [requests])
  const copyEmail = (user) => {
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(user.email).catch(() => {})
    toast.success('Adresse copiée', { description: user.email })
  }
  return (
    <>
      <PageHeader title="Utilisateurs" subtitle={`${pl(counts.admins, 'administrateur', 'administrateurs')} · ${pl(counts.employees, 'utilisateur', 'utilisateurs')}`} actions={<Button variant="primary" icon="plus" onClick={openInvite}>Inviter un utilisateur</Button>} />
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><SearchInput value={q} onChange={(value) => { markFiltering(); setQ(value) }} loading={filtering} placeholder="Rechercher un nom, un e-mail, une équipe…" className="lg:w-80" /><div className="max-w-full overflow-x-auto pb-0.5"><Segmented options={options} value={roleFilter} onChange={(value) => { markFiltering(); setRoleFilter(value) }} /></div></div>
      <LoadingStatus active={filtering} className="mb-3" />
      {rows.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white shadow-card"><EmptyState icon="users" title="Aucun utilisateur trouvé" description={`Aucun compte ne correspond à « ${q} » avec ce filtre.`} action={<Button variant="secondary" onClick={() => { setQ(''); setRoleFilter('all') }}>Réinitialiser les filtres</Button>} /></div> : <><div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card md:block"><table className="w-full text-left"><thead><tr className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-400"><th className="px-5 py-3.5">Utilisateur</th><th className="px-3 py-3.5">Équipe</th><th className="px-3 py-3.5">Rôle</th><th className="px-3 py-3.5">Demandes</th><th className="px-3 py-3.5">Membre depuis</th><th className="px-5 py-3.5 text-right">Actions</th></tr></thead><tbody>{rows.map((user) => (<tr key={user.id} tabIndex={0} onClick={() => navigate('requests', { q: user.name })} onKeyDown={(event) => { if (event.key === 'Enter') navigate('requests', { q: user.name }) }} className="group cursor-pointer border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/70"><td className="py-3.5 pl-5 pr-3"><div className="flex items-center gap-3"><Avatar name={user.name} size={34} /><div className="min-w-0"><p className="truncate text-sm font-medium text-slate-900">{user.name}{user.id === me.id && <span className="ml-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">vous</span>}<StatusTag status={user.status} /></p><p className="truncate text-xs text-slate-500">{user.email}</p></div></div></td><td className="px-3 py-3.5 text-sm text-slate-600">{user.team}</td><td className="px-3 py-3.5"><RoleBadge role={user.role} /></td><td className="tnum px-3 py-3.5 text-sm text-slate-600">{reqByUser[user.id] || 0}</td><td className="whitespace-nowrap px-3 py-3.5 text-sm text-slate-500">{user.joined}</td><td className="py-3.5 pl-3 pr-5 text-right" onClick={(event) => event.stopPropagation()}><div className="flex justify-end"><Dropdown align="right" width="w-60" trigger={<button type="button" aria-label="Options" className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"><Icon name="more-horizontal" size={17} /></button>}>{({ close }) => (<><MenuItem icon="inbox" label="Voir ses demandes" onClick={() => { close(); navigate('requests', { q: user.name }) }} /><MenuItem icon="copy" label="Copier l'adresse e-mail" onClick={() => { close(); copyEmail(user) }} />{user.id !== me.id && (isAdminUser(user) ? <MenuItem icon="user" label="Définir comme utilisateur" onClick={() => { close(); changeUserRole(user.id, 'employee') }} /> : <MenuItem icon="shield" label="Définir comme administrateur" onClick={() => { close(); changeUserRole(user.id, 'admin') }} />)}</>)}</Dropdown></div></td></tr>))}</tbody></table></div><div className="space-y-3 md:hidden">{rows.map((user) => (<div key={user.id} className="rise rounded-2xl border border-slate-200 bg-white p-4 shadow-card"><div className="flex items-start gap-3"><Avatar name={user.name} size={38} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">{user.name}{user.id === me.id && <span className="ml-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">vous</span>}<StatusTag status={user.status} /></p><p className="truncate text-xs text-slate-500">{user.email}</p></div><Dropdown align="right" width="w-60" trigger={<button type="button" aria-label="Options" className="-mr-2 -mt-1 inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"><Icon name="more-horizontal" size={17} /></button>}>{({ close }) => (<><MenuItem icon="inbox" label="Voir ses demandes" onClick={() => { close(); navigate('requests', { q: user.name }) }} /><MenuItem icon="copy" label="Copier l'adresse e-mail" onClick={() => { close(); copyEmail(user) }} />{user.id !== me.id && (isAdminUser(user) ? <MenuItem icon="user" label="Définir comme utilisateur" onClick={() => { close(); changeUserRole(user.id, 'employee') }} /> : <MenuItem icon="shield" label="Définir comme administrateur" onClick={() => { close(); changeUserRole(user.id, 'admin') }} />)}</>)}</Dropdown></div><div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3"><RoleBadge role={user.role} /><span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">{user.team}</span><span className="tnum ml-auto text-xs text-slate-500">{pl(reqByUser[user.id] || 0, 'demande', 'demandes')}</span></div></div>))}</div></>}
    </>
  )
}
