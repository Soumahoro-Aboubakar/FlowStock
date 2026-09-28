import React, { useMemo, useState } from 'react'
import { STATUS_META, norm, fmtDate, fmtDateTime, timeAgo } from '../../../utils/formatters.js'
import { Icon } from '../../../components/ui/icons.jsx'
import { Button, StatusBadge, MaterialThumb, Avatar, EmptyState, PageHeader, SearchInput, Segmented, Dropdown, MenuItem, useToast, LoadingStatus, useLoadingFeedback } from '../../../components/ui/Kit.jsx'
import { useApp } from '../../shared/context.js'

export function AdminRequests({ params }) {
  const { requests, matById, userById, openRequest, approveRequest, openRejectModal } = useApp()
  const toast = useToast()
  const [filtering, markFiltering] = useLoadingFeedback()
  const [q, setQ] = useState(params.q || '')
  const [status, setStatus] = useState(params.status || 'all')
  const [matFilter, setMatFilter] = useState('all')
  const [sort, setSort] = useState('recent')
  const counts = useMemo(() => ({ all: requests.length, pending: requests.filter((request) => request.status === 'pending').length, approved: requests.filter((request) => request.status === 'approved').length, rejected: requests.filter((request) => request.status === 'rejected').length, cancelled: requests.filter((request) => request.status === 'cancelled').length }), [requests])
  const options = [{ value: 'all', label: 'Toutes', count: counts.all }].concat(['pending', 'approved', 'rejected', 'cancelled'].filter((key) => counts[key] > 0).map((key) => ({ value: key, label: STATUS_META[key].label, count: counts[key] })))
  const effStatus = options.some((option) => option.value === status) ? status : 'all'
  const usedMats = useMemo(() => [...new Set(requests.map((request) => request.materialId))].map((id) => matById(id)).filter(Boolean), [requests, matById])
  const rows = useMemo(() => {
    let list = requests.slice()
    if (effStatus !== 'all') list = list.filter((request) => request.status === effStatus)
    if (matFilter !== 'all') list = list.filter((request) => request.materialId === matFilter)
    if (q.trim()) { const term = norm(q); list = list.filter((request) => norm(userById(request.userId).name).includes(term) || norm((matById(request.materialId) || {}).name).includes(term) || norm(request.id).includes(term)) }
    list.sort((a, b) => sort === 'recent' ? b.updatedAt - a.updatedAt : sort === 'old' ? a.createdAt - b.createdAt : b.quantity - a.quantity)
    return list
  }, [requests, q, effStatus, matFilter, sort, matById])
  const reset = () => { markFiltering(); setQ(''); setMatFilter('all'); setStatus('all'); setSort('recent') }
  const exportCsv = () => {
    const head = ['ID', 'Demandeur', 'Matériel', 'Quantité', 'Pour le', 'Statut', 'Créée le'].join(';')
    const lines = rows.map((request) => [request.id, userById(request.userId).name, (matById(request.materialId) || {}).name || '—', request.quantity, fmtDate(request.dateNeeded), STATUS_META[request.status].label, fmtDateTime(request.createdAt)].join(';'))
    const blob = new Blob(['\uFEFF' + [head].concat(lines).join('\r\n')], { type: 'text/csv;charset=utf-8' })
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `materio-demandes-${new Date().toISOString().slice(0, 10)}.csv`; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(link.href), 500)
    toast.success('Export généré', { description: `${rows.length} demande(s) exportée(s) au format CSV.` })
  }
  return (
    <>
      <PageHeader title="Demandes" subtitle={`${counts.pending} en attente de traitement · ${rows.length} affichée(s)`} actions={<Button variant="secondary" icon="download" onClick={exportCsv}>Exporter en CSV</Button>} />
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SearchInput value={q} onChange={(value) => { markFiltering(); setQ(value) }} loading={filtering} placeholder="Rechercher un demandeur, un matériel, un identifiant…" className="lg:w-80" />
        <div className="flex flex-wrap items-center gap-2">
          <div className="max-w-full overflow-x-auto pb-0.5"><Segmented options={options} value={effStatus} onChange={(value) => { markFiltering(); setStatus(value) }} /></div>
          <Dropdown width="w-56" trigger={<Button variant="secondary" size="sm" icon="sliders">{['recent', 'old', 'qty'].includes(sort) ? { recent: 'Mises à jour récentes', old: 'Plus anciennes', qty: 'Quantité décroissante' }[sort] : 'Mises à jour récentes'}<Icon name="chevron-down" size={14} className="text-slate-400" /></Button>}>
            {({ close }) => Object.keys({ recent: 'Mises à jour récentes', old: 'Plus anciennes', qty: 'Quantité décroissante' }).map((key) => (
              <button key={key} type="button" onClick={() => { markFiltering(); setSort(key); close() }} className="flex w-full items-center justify-between px-3 py-2 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50">{({ recent: 'Mises à jour récentes', old: 'Plus anciennes', qty: 'Quantité décroissante' })[key]}{sort === key && <Icon name="check" size={15} className="text-primary" />}</button>
            ))}
          </Dropdown>
          <Dropdown width="w-56" trigger={<Button variant="secondary" size="sm" icon="archive"><span className="max-w-[140px] truncate">{matFilter === 'all' ? 'Tout le matériel' : (matById(matFilter) || {}).name || 'Matériel'}</span><Icon name="chevron-down" size={14} className="text-slate-400" /></Button>}>
            {({ close }) => (<><MenuItem icon="archive" label="Tous les matériels" onClick={() => { markFiltering(); setMatFilter('all'); close() }} /><div className="my-1 border-t border-slate-100" />{usedMats.map((material) => <MenuItem key={material.id} icon="package" label={material.name} onClick={() => { markFiltering(); setMatFilter(material.id); close() }} />)}</>)}
          </Dropdown>
        </div>
      </div>
      <LoadingStatus active={filtering} className="mb-3" />
      {rows.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white shadow-card"><EmptyState icon="search" title="Aucune demande trouvée" description={`Aucun résultat pour « ${q} » avec ces filtres. Essayez un autre mot-clé ou réinitialisez.`} action={<Button variant="secondary" onClick={reset}>Réinitialiser les filtres</Button>} /></div> : <><div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card md:block"><table className="w-full text-left"><thead><tr className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-400"><th className="px-5 py-3.5">Demandeur</th><th className="px-3 py-3.5">Matériel</th><th className="px-3 py-3.5">Pour le</th><th className="px-3 py-3.5">Créée</th><th className="px-3 py-3.5">Statut</th><th className="px-5 py-3.5 text-right">Actions</th></tr></thead><tbody>{rows.map((request) => { const user = userById(request.userId); const material = matById(request.materialId); return (<tr key={request.id} tabIndex={0} onClick={() => openRequest(request.id)} onKeyDown={(event) => { if (event.key === 'Enter') openRequest(request.id) }} className="group cursor-pointer border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/70"><td className="py-3.5 pl-5 pr-3"><div className="flex items-center gap-3"><Avatar name={user.name} size={34} /><div className="min-w-0"><p className="truncate text-sm font-medium text-slate-900">{user.name}</p><p className="truncate text-xs text-slate-500">{user.email}</p></div></div></td><td className="px-3 py-3.5"><div className="flex items-center gap-2.5"><MaterialThumb material={material} size={36} /><span className="text-sm text-slate-700">{material ? material.name : '—'} <span className="text-slate-400">× {request.quantity}</span></span></div></td><td className="tnum whitespace-nowrap px-3 py-3.5 text-sm text-slate-600">{fmtDate(request.dateNeeded)}</td><td className="whitespace-nowrap px-3 py-3.5 text-sm text-slate-500">{timeAgo(request.createdAt)}</td><td className="px-3 py-3.5"><StatusBadge status={request.status} /></td><td className="py-3.5 pl-3 pr-5 text-right">{request.status === 'pending' ? <div className="flex items-center justify-end gap-1" onClick={(event) => event.stopPropagation()}><button type="button" aria-label="Approuver" className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700" onClick={() => approveRequest(request.id)}><Icon name="check" size={17} /></button><button type="button" aria-label="Refuser" className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => openRejectModal(request)}><Icon name="x" size={17} /></button></div> : <span className="pr-2 text-xs text-slate-300">Traité</span>}</td></tr>)})}</tbody></table></div><div className="space-y-3 md:hidden">{rows.map((request) => { const user = userById(request.userId); const material = matById(request.materialId); return (<div key={request.id} onClick={() => openRequest(request.id)} className="rise cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 shadow-card transition-shadow hover:shadow-pop"><div className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><Avatar name={user.name} size={36} /><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{user.name}</p><p className="text-xs text-slate-400">{timeAgo(request.createdAt)}</p></div></div><StatusBadge status={request.status} size="sm" /></div><div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3"><span className="flex items-center gap-2 text-sm text-slate-700"><MaterialThumb material={material} size={32} />{material ? material.name : '—'} <span className="text-slate-400">× {request.quantity}</span></span><span className="tnum text-xs text-slate-500">pour le {fmtDate(request.dateNeeded)}</span></div>{request.status === 'pending' && <div className="mt-3 flex gap-2" onClick={(event) => event.stopPropagation()}><Button variant="soft" size="sm" icon="check" className="flex-1" onClick={() => approveRequest(request.id)}>Approuver</Button><Button variant="danger-soft" size="sm" icon="x" className="flex-1" onClick={() => openRejectModal(request)}>Refuser</Button></div>}</div>)})}</div></>}
    </>
  )
}
