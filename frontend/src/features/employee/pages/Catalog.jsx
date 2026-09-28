import React, { useMemo, useState } from 'react'
import { stockLevel, norm, pl, cx } from '../../../utils/formatters.js'
import { Icon } from '../../../components/ui/icons.jsx'
import { Button, StockBadge, CatIcon, MaterialImage, EmptyState, PageHeader, SearchInput, LoadingStatus, useLoadingFeedback } from '../../../components/ui/Kit.jsx'
import { useApp } from '../../shared/context.js'

export function UserCatalog() {
  const { me, materials: allMaterials, requests, navigate, openRequestForm } = useApp()
  // Archived materials are only kept to label past requests.
  const materials = useMemo(() => allMaterials.filter((material) => !material.archived), [allMaterials])
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('Tous')
  const [filtering, markFiltering] = useLoadingFeedback()
  const rows = useMemo(() => {
    let list = materials.slice();
    if (category !== 'Tous') list = list.filter((item) => item.category === category)
    if (q.trim()) { const term = norm(q); list = list.filter((item) => norm(item.name).includes(term) || norm(item.description).includes(term)) }
    return list.sort((a, b) => Number(b.quantity > 0) - Number(a.quantity > 0))
  }, [materials, q, category])
  const available = materials.filter((material) => material.quantity > 0).length
  const myPending = requests.filter((request) => request.userId === me.id && request.status === 'pending').length
  return (
    <>
      <PageHeader title="Catalogue" subtitle={`${available} référence(s) disponible(s) sur ${materials.length} — demandes traitées sous 48 h ouvrées`} actions={<Button variant="primary" icon="send" onClick={() => openRequestForm(null)}>Nouvelle demande</Button>} />
      {myPending > 0 && <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-blue-100 bg-primary-soft px-4 py-3"><Icon name="info" size={17} className="text-primary" /><p className="text-[13px] text-slate-700">Vous avez <span className="font-semibold">{pl(myPending, 'demande en attente', 'demandes en attente')}</span> de validation.</p><button type="button" onClick={() => navigate('requests')} className="ml-auto text-[13px] font-semibold text-primary transition-colors hover:text-primary-dark">Voir mes demandes</button></div>}
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center"><SearchInput value={q} onChange={(value) => { markFiltering(); setQ(value) }} loading={filtering} placeholder="Rechercher un matériel…" className="md:w-80" /><div className="flex flex-wrap gap-2">{['Tous'].concat(Object.keys({ Informatique: true, Audiovisuel: true, Mobilier: true, Réseau: true })).map((item) => (<button key={item} type="button" onClick={() => { markFiltering(); setCategory(item) }} className={cx('rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-all duration-150', category === item ? 'bg-primary text-white shadow-[0_1px_2px_rgba(37,99,235,.35)]' : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900')}>{item}</button>))}</div></div>
      <LoadingStatus active={filtering} className="mb-3" />
      {rows.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white shadow-card"><EmptyState icon="search" title="Aucun matériel trouvé" description={`Aucune référence ne correspond à « ${q} » dans cette catégorie.`} action={<Button variant="secondary" onClick={() => { setQ(''); setCategory('Tous') }}>Réinitialiser</Button>} /></div> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{rows.map((material, index) => { const level = stockLevel(material); return (<article key={material.id} className="rise group flex flex-col rounded-2xl border border-slate-200 bg-white p-2.5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-pop" style={{ animationDelay: `${Math.min(index * 40, 200)}ms` }}><div className="relative"><MaterialImage material={material} className="aspect-[16/9] rounded-xl" imgClassName={cx('group-hover:scale-[1.03]', level === 'out' && 'grayscale-[.7]')} /><CatIcon category={material.category} overlay className="pointer-events-none absolute left-2.5 top-2.5" /><span className="absolute right-2.5 top-2.5"><StockBadge level={level} size="sm" /></span></div><div className="flex flex-1 flex-col px-2.5 pb-2.5"><h3 className="mt-3.5 text-[15px] font-semibold text-slate-900">{material.name}</h3><p className="mt-0.5 text-xs text-slate-400">{material.category}</p><p className="mt-2 line-clamp-2 min-h-[2.6em] text-[13px] leading-snug text-slate-500">{material.description}</p><div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4"><div><p className={cx('text-[13px] font-semibold', level === 'out' ? 'text-red-600' : 'text-slate-900')}>{material.quantity > 0 ? `${material.quantity} en stock` : 'Épuisé'}</p><p className="tnum text-xs text-slate-400">sur {material.total} au total</p></div>{material.quantity > 0 ? <Button size="sm" onClick={() => openRequestForm(material)}>Demander</Button> : <Button size="sm" variant="secondary" disabled>Indisponible</Button>}</div></div></article>)})}</div>}
    </>
  )
}
