import React from 'react'

// Each role application (AdminApp, EmployeeApp) provides its own value; shared components only
// rely on the common fields (role, route, me, data lookups, navigation, modals, busyAction).
export const AppCtx = React.createContext(null)
export const useApp = () => React.useContext(AppCtx)

export const KIND_DOT = { created: 'bg-primary', approved: 'bg-emerald-500', rejected: 'bg-red-500', cancelled: 'bg-slate-400', note: 'bg-slate-300' }
export const PAGE_TITLES = { admin: { dashboard: "Vue d'ensemble", requests: 'Demandes', inventory: 'Matériel', users: 'Utilisateurs', settings: 'Paramètres' }, employee: { catalog: 'Catalogue', requests: 'Mes demandes', settings: 'Paramètres' } }
