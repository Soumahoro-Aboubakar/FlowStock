import React, { useMemo, useState } from 'react'
import { STATUS_META, fmtDate, timeAgo } from '../../../utils/formatters.js'
import { Icon } from '../../../components/ui/icons.jsx'
import { Button, StatusBadge, MaterialThumb, EmptyState, PageHeader, Segmented, LoadingStatus, useLoadingFeedback } from '../../../components/ui/Kit.jsx'
import { useApp } from '../../shared/context.js'

export function MyRequests() {
  const { me, requests, matById, openRequest, openCancelModal, navigate } = useApp()
  const mine = useMemo(() => requests.filter((request) => request.userId === me.id).sort((a, b) => b.createdAt - a.createdAt), [requests, me])
  const [status, setStatus] = useState('all')
  const [filtering, markFiltering] = useLoadingFeedback()
  const counts = useMemo(() => ({ all: mine.length, pending: mine.filter((request) => request.status === 'pending').length, approved: mine.filter((request) => request.status === 'approved').length, rejected: mine.filter((request) => request.status === 'rejected').length, cancelled: mine.filter((request) => request.status === 'cancelled').length }), [mine])
  const options = [{ value: 'all', label: 'Toutes', count: counts.all }].concat(['pending', 'approved', 'rejected', 'cancelled'].filter((key) => counts[key] > 0).map((key) => ({ value: key, label: STATUS_META[key].label, count: counts[key] })))
  const effStatus = options.some((option) => option.value === status) ? status : 'all'
  const rows = effStatus === 'all' ? mine : mine.filter((request) => request.status === effStatus)
  return (
    <>
      <PageHeader title="Mes demandes" subtitle={`${counts.pending} en attente · ${counts.approved} approuvée(s) · ${counts.rejected} refusée(s)`} actions={<Button variant="primary" icon="send" onClick={() => navigate('catalog')}>Nouvelle demande</Button>} />
      {mine.length > 0 && <div className="mb-5 max-w-full overflow-x-auto pb-0.5"><Segmented options={options} value={effStatus} onChange={(value) => { markFiltering(); setStatus(value) }} /></div>}
      <LoadingStatus active={filtering} className="mb-3" />
      {mine.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white shadow-card"><EmptyState icon="package" title="Aucune demande pour le moment" description="Parcourez le catalogue et envoyez votre première demande de matériel — elle sera traitée sous 48 h ouvrées." action={<Button variant="primary" icon="arrow-right" onClick={() => navigate('catalog')}>Parcourir le catalogue</Button>} /></div> : rows.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white shadow-card"><EmptyState icon="inbox" title="Rien dans ce statut" description="Aucune de vos demandes ne correspond à ce filtre actuellement." /></div> : <div className="space-y-3">{rows.map((request, index) => { const material = matById(request.materialId) || { name: 'Matériel supprimé', category: '' }; return (<div key={request.id} onClick={() => openRequest(request.id)} tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter') openRequest(request.id) }} className="rise group flex cursor-pointer flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-card transition-all duration-200 hover:shadow-pop sm:flex-nowrap" style={{ animationDelay: `${Math.min(index * 40, 200)}ms` }}><MaterialThumb material={material} size={44} className="rounded-xl" /><div className="min-w-0 flex-1 basis-48"><p className="truncate text-sm font-semibold text-slate-900">{material.name} <span className="font-normal text-slate-400">× {request.quantity}</span></p><p className="tnum mt-0.5 text-xs text-slate-500">Demandée {timeAgo(request.createdAt)} · pour le {fmtDate(request.dateNeeded)}</p></div><StatusBadge status={request.status} />{request.status === 'pending' && <Button variant="danger-soft" size="xs" onClick={(event) => { event.stopPropagation(); openCancelModal(request) }}>Annuler</Button>}<Icon name="chevron-right" size={16} className="hidden shrink-0 text-slate-300 transition-colors group-hover:text-slate-400 sm:block" /></div>)})}</div>}
    </>
  )
}
