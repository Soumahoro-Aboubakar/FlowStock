import React from 'react'
import { fmtDate, fmtDateTime, timeAgo, cx } from '../../utils/formatters.js'
import { Icon } from '../../components/ui/icons.jsx'
import { StatusBadge, MaterialThumb, Avatar, SectionLabel, DrawerActions, EmployeeCancel } from '../../components/ui/Kit.jsx'
import { useApp, KIND_DOT } from './context.js'
import { useDelayedUnmount } from './hooks.js'

export function RequestDrawer({ open, request, onClose }) {
  const { role, matById, userById, approveRequest, openRejectModal, openCancelModal, busyAction } = useApp()
  const mounted = useDelayedUnmount(open, 220)
  const lastRef = React.useRef(null)
  if (request) lastRef.current = request
  const req = request || lastRef.current
  if (!mounted || !req) return null
  const mat = matById(req.materialId) || { name: 'Matériel supprimé', category: '', quantity: 0, total: 0 }
  const user = userById(req.userId)
  const canModerate = role === 'admin'
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={`Demande ${req.id}`}>
      <div className={cx('absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]', open ? 'anim-fade-in' : 'anim-fade-out')} onClick={onClose} />
      <aside className={cx('absolute bottom-0 right-0 top-0 flex w-full max-w-md flex-col bg-white shadow-modal', open ? 'anim-drawer-in' : 'anim-drawer-out')}>
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Demande</p>
            <div className="mt-0.5 flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-slate-900">{req.id}</h2>
              <StatusBadge status={req.status} size="sm" />
            </div>
          </div>
          <button type="button" aria-label="Fermer" onClick={onClose} className="-mr-2 -mt-1 inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
            <Icon name="x" size={17} />
          </button>
        </div>
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          <div className="flex items-center gap-3">
            <Avatar name={user.name} size={40} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
            </div>
            <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500">{user.team}</span>
          </div>
          <div>
            <SectionLabel>Matériel demandé</SectionLabel>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3">
              <MaterialThumb material={mat} size={56} className="rounded-xl" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{mat.name}</p>
                <p className="text-xs text-slate-500">{mat.category}{mat.total ? ` · ${mat.quantity}/${mat.total} en stock` : ''}</p>
              </div>
              <span className="tnum shrink-0 rounded-lg border border-slate-100 bg-white px-2.5 py-1.5 text-sm font-bold text-slate-900 shadow-card">× {req.quantity}</span>
            </div>
          </div>
          <div>
            <SectionLabel>Détails</SectionLabel>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div><dt className="text-xs text-slate-400">Pour le</dt><dd className="mt-0.5 text-sm font-medium text-slate-800">{fmtDate(req.dateNeeded)}</dd></div>
              <div><dt className="text-xs text-slate-400">Créée</dt><dd className="mt-0.5 text-sm font-medium text-slate-800">{timeAgo(req.createdAt)}</dd></div>
              <div><dt className="text-xs text-slate-400">Statut</dt><dd className="mt-1"><StatusBadge status={req.status} size="sm" /></dd></div>
              <div><dt className="text-xs text-slate-400">Dernière mise à jour</dt><dd className="mt-0.5 text-sm font-medium text-slate-800">{timeAgo(req.updatedAt)}</dd></div>
            </dl>
          </div>
          <div>
            <SectionLabel>Justification</SectionLabel>
            <blockquote className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">« {req.justification} »</blockquote>
            {req.note && <p className="mt-2 rounded-lg px-1 text-[13px] text-slate-500"><span className="font-medium text-slate-600">Commentaire :</span> {req.note}</p>}
          </div>
          {req.status === 'rejected' && req.rejectionReason && (
            <div className="flex gap-3 rounded-xl border border-red-100 bg-red-50 p-4">
              <Icon name="alert-triangle" size={17} className="mt-0.5 shrink-0 text-red-600" />
              <div>
                <p className="text-[13px] font-semibold text-red-700">Motif du refus</p>
                <p className="mt-1 text-[13px] leading-relaxed text-red-600/90">{req.rejectionReason}</p>
              </div>
            </div>
          )}
          <div>
            <SectionLabel>Historique</SectionLabel>
            <ul>
              {req.history.map((item, index) => (
                <li key={index} className="relative pb-5 pl-7 last:pb-0">
                  {index < req.history.length - 1 && <span className="absolute bottom-0 left-[4.5px] top-4 w-px bg-slate-200" />}
                  <span className={cx('absolute left-0 top-1 h-2.5 w-2.5 rounded-full', KIND_DOT[item.kind] || 'bg-slate-300')} />
                  <p className="text-sm font-medium text-slate-800">{item.label}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{fmtDateTime(item.at)}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
        {req.status === 'pending' ? (
          <div className="flex shrink-0 gap-2.5 border-t border-slate-100 bg-slate-50/70 px-5 py-4">
            {canModerate ? <DrawerActions req={req} approveRequest={approveRequest} openRejectModal={openRejectModal} busyAction={busyAction} /> : <EmployeeCancel req={req} openCancelModal={openCancelModal} busyAction={busyAction} />}
          </div>
        ) : (
          <div className="shrink-0 border-t border-slate-100 bg-slate-50/70 px-5 py-3.5 text-center text-xs text-slate-400">Cette demande est traitée — l'historique ci-dessus retrace chaque étape.</div>
        )}
      </aside>
    </div>
  )
}
