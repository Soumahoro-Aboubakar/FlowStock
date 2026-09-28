import React from 'react'
import { Icon } from '../ui/icons.jsx'
import { Avatar } from '../ui/Kit.jsx'
import { cx, pl, stockLevel, roleLabel } from '../../utils/formatters.js'

const NAV = {
  admin: [
    { key: 'dashboard', label: "Vue d'ensemble", icon: 'layout-dashboard' },
    { key: 'requests', label: 'Demandes', icon: 'inbox', badge: 'pending' },
    { key: 'inventory', label: 'Matériel', icon: 'archive' },
    { key: 'users', label: 'Utilisateurs', icon: 'users' },
    // Section « Paramètres » désactivée — décommenter pour la réafficher dans la navigation.
    // { key: 'settings', label: 'Paramètres', icon: 'settings' },
  ],
  employee: [
    { key: 'catalog', label: 'Catalogue', icon: 'package' },
    { key: 'requests', label: 'Mes demandes', icon: 'file-text', badge: 'mine' },
    // Section « Paramètres » désactivée — décommenter pour la réafficher dans la navigation.
    // { key: 'settings', label: 'Paramètres', icon: 'settings' },
  ],
}


export function SidebarContent({ onNavigate, app }) {
  const { role, route, requests, materials, me, navigate, openProfile, logout } = app
  const pending = requests.filter((request) => request.status === 'pending').length
  const myPending = requests.filter((request) => request.userId === me.id && request.status === 'pending').length
  const watchCount = materials.filter((material) => !material.archived && stockLevel(material) !== 'ok').length
  return (
    <div className="sidebar-shell flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-slate-100/80 bg-white/35 px-5 backdrop-blur-[2px]">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-[0_2px_8px_rgba(37,99,235,.35)]">
          <Icon name="package" size={18} strokeWidth={2} />
        </span>
        <span className="leading-tight">
          <span className="block text-[15px] font-bold tracking-tight text-slate-900">Materio</span>
          <span className="block text-[11px] text-slate-400">Gestion de matériel</span>
        </span>
      </div>
      <nav className="flex-1 overflow-y-auto bg-white/15 px-3 py-4 backdrop-blur-[1px]">
        <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{role === 'admin' ? 'Espace administrateur' : 'Espace collaborateur'}</p>
        <ul className="space-y-1">
          {NAV[role].map((item) => {
            const active = route === item.key
            const badge = item.badge === 'pending' ? pending : item.badge === 'mine' ? myPending : 0
            return (
              <li key={item.key}>
                <button type="button" onClick={() => { navigate(item.key); onNavigate && onNavigate() }} aria-current={active ? 'page' : undefined} className={cx('group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-150', active ? 'bg-primary-soft font-semibold text-primary' : 'font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900')}>
                  <Icon name={item.icon} size={18} className={cx('transition-colors', active ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600')} />
                  {item.label}
                  {item.badge && badge > 0 && (
                    <span className={cx('tnum ml-auto rounded-full px-2 py-0.5 text-[11px] font-bold transition-colors', active ? 'bg-primary text-white' : 'bg-slate-200 text-slate-600 group-hover:bg-slate-300')}>
                      {badge}
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
        {role === 'admin' && watchCount > 0 && (
          <button type="button" onClick={() => { navigate('inventory'); onNavigate && onNavigate() }} className="group mt-5 w-full rounded-xl border border-red-200/80 bg-red-50 p-3.5 text-left transition-colors hover:border-red-300 hover:bg-red-100/60">
            <span className="flex items-center gap-2 text-[13px] font-semibold text-red-700"><Icon name="alert-triangle" size={15} />{pl(watchCount, 'article en alerte', 'articles en alerte')}</span>
            <span className="mt-1 block text-xs leading-snug text-red-600/90">Stock faible ou épuisé — réapprovisionnement requis.</span>
            <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-red-700 transition-all group-hover:gap-1.5">Voir le matériel <Icon name="arrow-right" size={13} /></span>
          </button>
        )}
      </nav>
      <div className="shrink-0 border-t border-slate-100/80 bg-white/35 p-3 backdrop-blur-[2px]">
        <div className="group/account flex items-center gap-2.5 rounded-xl bg-white/70 p-2.5 transition-colors hover:bg-white/90">
          <button type="button" onClick={() => { openProfile(); onNavigate && onNavigate() }} className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg text-left" aria-label="Mon profil">
            <Avatar name={me.name} size={34} />
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-[13px] font-semibold text-slate-800">{me.name}</span>
              <span className="block truncate text-[11px] text-slate-400">{role === 'admin' ? roleLabel(me.role) : me.team}</span>
            </span>
          </button>
          <button type="button" onClick={logout} aria-label="Se déconnecter" title="Se déconnecter" className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600">
            <Icon name="log-out" size={16} />
          </button>
        </div>
        <p className="mt-3 px-1 text-[11px] text-slate-300">Materio · {role === 'admin' ? 'espace administrateur' : 'espace collaborateur'}</p>
      </div>
    </div>
  )
}

export default SidebarContent
