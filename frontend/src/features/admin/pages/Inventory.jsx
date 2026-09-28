import React, { useMemo, useState } from 'react'
import { stockLevel, norm, timeAgo, cx } from '../../../utils/formatters.js'
import { Icon } from '../../../components/ui/icons.jsx'
import { Button, StockBadge, StockBar, CatIcon, MaterialImage, EmptyState, PageHeader, SearchInput, Segmented, Dropdown, MenuItem, LoadingStatus, useLoadingFeedback } from '../../../components/ui/Kit.jsx'
import { useApp } from '../../shared/context.js'

export function AdminInventory({ params }) {
  const { materials, editMaterial, askDeleteMaterial } = useApp()
  const [filtering, markFiltering] = useLoadingFeedback()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState('recent')
  const counts = useMemo(() => ({ all: materials.length, ok: materials.filter((material) => stockLevel(material) === 'ok').length, low: materials.filter((material) => stockLevel(material) === 'low').length, out: materials.filter((material) => stockLevel(material) === 'out').length }), [materials])
  const rows = useMemo(() => {
    let list = materials.slice();
    if (status !== 'all') list = list.filter((material) => stockLevel(material) === status)
    if (q.trim()) { const term = norm(q); list = list.filter((material) => norm(material.name).includes(term) || norm(material.category).includes(term) || norm(material.description).includes(term)) }
    list.sort((a, b) => sort === 'recent' ? b.updatedAt - a.updatedAt : sort === 'name' ? a.name.localeCompare(b.name) : (a.quantity / a.total) - (b.quantity / b.total))
    return list
  }, [materials, q, status, sort])
  return (
    <>
      <PageHeader title="Matériel" subtitle={`${materials.length} références · ${counts.low} faible(s) · ${counts.out} épuisé(s)`} actions={<Button variant="primary" icon="plus" onClick={() => editMaterial(null)}>Ajouter un matériel</Button>} />
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SearchInput value={q} onChange={(value) => { markFiltering(); setQ(value) }} loading={filtering} placeholder="Rechercher un matériel, une catégorie…" className="lg:w-80" />
        <div className="flex flex-wrap items-center gap-2">
          <div className="max-w-full overflow-x-auto pb-0.5"><Segmented value={status} onChange={(value) => { markFiltering(); setStatus(value) }} options={[{ value: 'all', label: 'Tous', count: counts.all }, { value: 'ok', label: 'Disponible', count: counts.ok }, { value: 'low', label: 'Faible', count: counts.low }, { value: 'out', label: 'Épuisé', count: counts.out }]} /></div>
          <Dropdown width="w-52" trigger={<Button variant="secondary" size="sm" icon="sliders">{sort === 'recent' ? 'Récemment modifiés' : sort === 'name' ? 'Nom A–Z' : 'Stock croissant'}<Icon name="chevron-down" size={14} className="text-slate-400" /></Button>}>{({ close }) => [['recent', 'Récemment modifiés'], ['name', 'Nom A–Z'], ['stock', 'Stock croissant']].map(([key, label]) => <button key={key} type="button" onClick={() => { markFiltering(); setSort(key); close() }} className="flex w-full items-center justify-between px-3 py-2 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50">{label}{sort === key && <Icon name="check" size={15} className="text-primary" />}</button>)}</Dropdown>
        </div>
      </div>
      <LoadingStatus active={filtering} className="mb-3" />
      {rows.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white shadow-card"><EmptyState icon="package" title="Aucun matériel trouvé" description={`Aucune référence ne correspond à « ${q} » avec ces filtres.`} action={<Button variant="secondary" onClick={() => { setQ(''); setStatus('all') }}>Réinitialiser les filtres</Button>} /></div> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{rows.map((material, index) => { const level = stockLevel(material); return (<article key={material.id} className="rise group flex flex-col rounded-2xl border border-slate-200 bg-white p-2.5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-pop" style={{ animationDelay: `${Math.min(index * 40, 240)}ms` }}><div className="relative"><button type="button" tabIndex={-1} aria-hidden="true" onClick={() => editMaterial(material)} className="block w-full"><MaterialImage material={material} className="aspect-[16/9] rounded-xl" imgClassName="group-hover:scale-[1.03]" /></button><CatIcon category={material.category} overlay className="pointer-events-none absolute left-2.5 top-2.5" /><div className="absolute right-2.5 top-2.5"><Dropdown align="right" width="w-44" trigger={<button type="button" aria-label="Options" className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/95 text-slate-500 shadow-card ring-1 ring-slate-900/5 backdrop-blur transition hover:text-slate-800 focus:opacity-100 pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100"><Icon name="more-horizontal" size={17} /></button>}>{({ close }) => (<><MenuItem icon="pencil" label="Modifier" onClick={() => { close(); editMaterial(material) }} /><MenuItem icon="trash-2" label="Supprimer" danger onClick={() => { close(); askDeleteMaterial(material) }} /></> )}</Dropdown></div></div><div className="flex flex-1 flex-col px-2.5 pb-2.5"><button type="button" onClick={() => editMaterial(material)} className="mt-3.5 text-left"><h3 className="text-[15px] font-semibold text-slate-900 transition-colors group-hover:text-primary">{material.name}</h3><p className="mt-0.5 text-xs text-slate-400">{material.category}</p><p className="mt-2 line-clamp-2 min-h-[2.6em] text-[13px] leading-snug text-slate-500">{material.description}</p></button><div className="mt-auto pt-4"><div className="mb-1.5 flex items-center justify-between"><p className="text-[13px] text-slate-500">Stock</p><p className="tnum text-[13px]"><span className={cx('font-bold', level === 'out' ? 'text-red-600' : level === 'low' ? 'text-amber-600' : 'text-slate-900')}>{material.quantity}</span><span className="text-slate-300"> / {material.total}</span></p></div><StockBar quantity={material.quantity} total={material.total} level={level} /><div className="mt-3 flex items-center justify-between"><StockBadge level={level} size="sm" /><span className="text-[11px] text-slate-400">mise à jour {timeAgo(material.updatedAt)}</span></div></div></div></article>)})}</div>}
    </>
  )
}
