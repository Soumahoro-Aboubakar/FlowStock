import React, { useMemo } from 'react'
import { STATUS_META, timeAgo, cx, roleLabel } from '../../utils/formatters.js'
import { Icon } from '../../components/ui/icons.jsx'
import { Avatar, Dropdown, MenuItem } from '../../components/ui/Kit.jsx'
import { useApp, PAGE_TITLES } from './context.js'

export function Header({ onMenu }) {
  const { role, route } = useApp()
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
      <div className="flex h-16 items-center gap-2 px-4 sm:px-6 lg:px-8">
        <button type="button" aria-label="Ouvrir le menu" onClick={onMenu} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 lg:hidden">
          <Icon name="menu" size={18} />
        </button>
        <nav aria-label="Fil d'Ariane" className="flex min-w-0 items-center gap-1.5 text-[13px]">
          <span className="hidden text-slate-400 sm:inline">Materio</span>
          <Icon name="chevron-right" size={13} className="hidden text-slate-300 sm:block" />
          <span className="truncate font-semibold text-slate-700">{PAGE_TITLES[role][route]}</span>
        </nav>
        <div className="ml-auto flex items-center gap-1.5">
          <Bell />
          <div className="mx-1 h-6 w-px bg-slate-200" />
          <UserMenu />
        </div>
      </div>
    </header>
  )
}

function Bell() {
  const { role, me, requests, matName, userById, navigate, openRequest } = useApp()
  const items = useMemo(() => {
    if (role === 'admin') {
      return requests.filter((request) => request.status === 'pending').sort((a, b) => b.createdAt - a.createdAt).slice(0, 4)
        .map((request) => ({ key: request.id + '-n', avatar: userById(request.userId).name, title: `${userById(request.userId).name} · ${matName(request.materialId)}`, sub: `×${request.quantity} · ${timeAgo(request.createdAt)}`, icon: 'clock', chip: 'bg-amber-50 text-amber-600', reqId: request.id }))
    }
    return requests.filter((request) => request.userId === me.id && (request.status === 'approved' || request.status === 'rejected')).sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 4)
      .map((request) => ({ key: request.id + request.status, title: `Votre demande « ${matName(request.materialId)} »`, sub: `${STATUS_META[request.status].label.toLowerCase()} · ${timeAgo(request.updatedAt)}`, icon: request.status === 'approved' ? 'check-circle' : 'x-circle', chip: request.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600', reqId: request.id }))
  }, [requests, role, me, matName, userById])
  const badge = useMemo(() => role === 'admin' ? requests.filter((request) => request.status === 'pending').length : requests.filter((request) => request.userId === me.id && (request.status === 'approved' || request.status === 'rejected')).length, [requests, role, me])
  return (
    <Dropdown width="w-80" trigger={
      <button type="button" aria-label="Notifications" className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700">
        <Icon name="bell" size={18} />
        {badge > 0 && <span className="tnum absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">{badge}</span>}
      </button>
    }>
      {({ close }) => (
        <>
          <div className="flex items-center justify-between px-3.5 py-2">
            <p className="text-[13px] font-semibold text-slate-900">Notifications</p>
            {badge > 0 && <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-bold text-primary">{badge}</span>}
          </div>
          <div className="border-t border-slate-100">
            {items.length === 0 && <p className="px-3.5 py-4 text-[13px] text-slate-400">Aucune notification pour le moment.</p>}
            {items.map((item) => (
              <button key={item.key} type="button" onClick={() => { close(); navigate('requests'); openRequest(item.reqId) }} className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-slate-50">
                {item.avatar ? <Avatar name={item.avatar} size={32} /> : <span className={cx('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', item.chip)}><Icon name={item.icon} size={15} /></span>}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-slate-800">{item.title}</span>
                  <span className="block text-xs text-slate-400">{item.sub}</span>
                </span>
              </button>
            ))}
          </div>
          <div className="border-t border-slate-100">
            <button type="button" onClick={() => { close(); navigate('requests') }} className="flex w-full items-center justify-center gap-1.5 py-2.5 text-[13px] font-semibold text-primary transition-colors hover:text-primary-dark">
              Tout voir <Icon name="arrow-right" size={14} />
            </button>
          </div>
        </>
      )}
    </Dropdown>
  )
}

function UserMenu() {
  const { me, role, openProfile, logout } = useApp()
  return (
    <Dropdown width="w-60" trigger={
      <button type="button" className="flex items-center gap-2.5 rounded-lg py-1 pl-1 pr-2 transition-colors hover:bg-slate-100">
        <Avatar name={me.name} size={32} />
        <span className="hidden text-left leading-tight sm:block">
          <span className="block text-[13px] font-semibold text-slate-800">{me.name}</span>
          <span className="block text-[11px] text-slate-400">{role === 'admin' ? roleLabel(me.role) : me.team}</span>
        </span>
        <Icon name="chevrons-up-down" size={14} className="text-slate-300" />
      </button>
    }>
      {({ close }) => (
        <>
          <div className="border-b border-slate-100 px-3 py-2.5">
            <p className="text-[13px] font-semibold text-slate-900">{me.name}</p>
            <p className="truncate text-xs text-slate-400">{me.email}</p>
          </div>
          <div className="py-1">
            <MenuItem icon="user" label="Mon profil" onClick={() => { close(); openProfile() }} />
            <MenuItem icon="log-out" label="Se déconnecter" danger onClick={() => { close(); logout() }} />
          </div>
        </>
      )}
    </Dropdown>
  )
}
