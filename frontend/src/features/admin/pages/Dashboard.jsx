import React, { useMemo } from 'react'
import { stockLevel, fmtDateLong, timeAgo, cx } from '../../../utils/formatters.js'
import { ago } from '../../../utils/dates.js'
import { Icon } from '../../../components/ui/icons.jsx'
import { Button, StatusBadge, StockBadge, StockBar, MaterialThumb, Avatar, PageHeader, StatCard, TrendChart } from '../../../components/ui/Kit.jsx'
import { useApp } from '../../shared/context.js'

export function AdminDashboard({ params }) {
  const { me, materials, requests, matById, userById, navigate, openRequest, editMaterial } = useApp()
  const hour = new Date().getHours(); const greet = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'
    const stats = useMemo(() => ({ pending: requests.filter((request) => request.status === 'pending'), approved: requests.filter((request) => request.status === 'approved'), rejected: requests.filter((request) => request.status === 'rejected'), week: requests.filter((request) => request.createdAt > ago(7)).length, watch: materials.filter((material) => stockLevel(material) !== 'ok').sort((a, b) => a.quantity - b.quantity) }), [requests, materials])
  const trend = useMemo(() => {
    const days = []
    for (let i = 13; i >= 0; i--) {
      const start = new Date(); start.setHours(0, 0, 0, 0); const ts = start.getTime() - i * 86400000; const date = new Date(ts)
      days.push({ value: requests.filter((request) => request.createdAt >= ts && request.createdAt < ts + 86400000).length, label: String(date.getDate()), today: i === 0, tooltip: date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' }) })
    }
    return days
  }, [requests])
  const recent = useMemo(() => [...requests].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5), [requests])
  const pct = (count) => requests.length ? `${Math.round((count / requests.length) * 100)} % du volume total` : '—'
  const cards = [
    { label: 'Demandes en attente', value: stats.pending.length, caption: `${stats.week} reçues cette semaine`, icon: 'clock', chip: 'bg-amber-50 text-amber-600', to: () => navigate('requests', { status: 'pending' }) },
    { label: 'Demandes approuvées', value: stats.approved.length, caption: pct(stats.approved.length), icon: 'check-circle', chip: 'bg-emerald-50 text-emerald-600', to: () => navigate('requests', { status: 'approved' }) },
    { label: 'Demandes refusées', value: stats.rejected.length, caption: 'motif communiqué au demandeur', icon: 'x-circle', chip: 'bg-red-50 text-red-600', to: () => navigate('requests', { status: 'rejected' }) },
    { label: 'Alertes de stock', value: stats.watch.length, caption: `${stats.watch.filter((material) => stockLevel(material) === 'low').length} faible(s) · ${stats.watch.filter((material) => stockLevel(material) === 'out').length} épuisé(s)`, icon: 'alert-triangle', chip: 'bg-red-50 text-red-600', to: () => navigate('inventory') },
  ]
  const trendTotal = trend.reduce((sum, item) => sum + item.value, 0)
  return (
    <>
      <PageHeader title={`${greet}, ${me.name.split(' ')[0]}`} subtitle={`${fmtDateLong(Date.now())} — voici l'état du parc et des demandes.`} actions={<><Button variant="secondary" icon="archive" onClick={() => navigate('inventory')}>Gérer le matériel</Button><Button variant="primary" icon="inbox" onClick={() => navigate('requests', { status: 'pending' })}>Traiter les demandes{stats.pending.length > 0 && <span className="tnum rounded-md bg-white/20 px-1.5 py-0.5 text-xs font-bold">{stats.pending.length}</span>}</Button></>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map((card, index) => <StatCard key={card.label} card={card} index={index} />)}</div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <section className="rise rounded-2xl border border-slate-200 bg-white p-5 shadow-card lg:col-span-2" style={{ animationDelay: '240ms' }}><div className="flex items-start justify-between"><div><h2 className="text-[15px] font-semibold text-slate-900">Demandes créées</h2><p className="mt-0.5 text-xs text-slate-400">14 derniers jours</p></div><span className="tnum rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{trendTotal} au total</span></div><div className="mt-4"><TrendChart data={trend} /></div></section>
        <section className="rise overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card" style={{ animationDelay: '300ms' }}><header className="flex items-center justify-between px-5 pt-5"><h2 className="text-[15px] font-semibold text-slate-900">Demandes récentes</h2><Button variant="ghost" size="xs" iconRight="arrow-right" onClick={() => navigate('requests')}>Tout voir</Button></header><ul className="mt-2 divide-y divide-slate-100">{recent.map((request) => { const user = userById(request.userId); const material = matById(request.materialId); return (<li key={request.id}><button type="button" onClick={() => openRequest(request.id)} className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-slate-50"><Avatar name={user.name} size={32} /><span className="min-w-0 flex-1"><span className="block truncate text-[13px]"><span className="font-semibold text-slate-900">{user.name.split(' ')[0]}</span><span className="text-slate-400"> · {material ? material.name : '—'} ×{request.quantity}</span></span><span className="block text-xs text-slate-400">{timeAgo(request.updatedAt)}</span></span><StatusBadge status={request.status} size="sm" /></button></li>)})}</ul></section>
      </div>
      {stats.watch.length > 0 && (
        <section className="rise mt-4 overflow-hidden rounded-2xl border border-red-200/70 bg-red-50 shadow-card" style={{ animationDelay: '360ms' }}>
          <header className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5"><div className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600"><Icon name="alert-triangle" size={17} /></span><div><h2 className="text-[15px] font-semibold text-red-800">Alerte stock faible</h2><p className="mt-0.5 text-xs text-red-600/80">Matériels en stock faible ou en rupture — réapprovisionnement requis</p></div></div><Button variant="secondary" size="xs" iconRight="arrow-right" onClick={() => navigate('inventory')}>Tout l'inventaire</Button></header>
          <ul className="mt-3 divide-y divide-red-100 pb-1">{stats.watch.map((material) => { const level = stockLevel(material); return (<li key={material.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5"><MaterialThumb material={material} size={40} /><div className="min-w-0 flex-1 basis-40"><p className="truncate text-sm font-medium text-slate-900">{material.name}</p><p className="text-xs text-slate-500">{material.category} · mise à jour {timeAgo(material.updatedAt)}</p></div><div className="hidden w-28 sm:block"><StockBar quantity={material.quantity} total={material.total} level={level} /></div><p className="tnum w-20 text-right text-sm"><span className={cx('font-bold', level === 'out' ? 'text-red-600' : level === 'low' ? 'text-amber-600' : 'text-slate-900')}>{material.quantity}</span><span className="text-slate-300"> / {material.total}</span></p><StockBadge level={level} size="sm" /><Button variant="secondary" size="xs" onClick={() => editMaterial(material)}>Réapprovisionner</Button></li>)})}</ul>
        </section>
      )}
    </>
  )
}
