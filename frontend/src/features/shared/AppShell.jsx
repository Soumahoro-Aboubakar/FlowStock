import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { authApi } from '../../api/auth.js'
import { setCurrentRoute } from '../../store/uiSlice.js'
import { signedOut } from '../../store/sessionSlice.js'
import { loadFailed, loadStarted, loadSucceeded } from '../../store/dataSlice.js'
import { cx } from '../../utils/formatters.js'
import { Button, EmptyState, PageSkeleton, LoadingStatus, useToast } from '../../components/ui/Kit.jsx'
import { SidebarContent } from '../../components/layout/Sidebar.jsx'
import { AppCtx } from './context.js'
import { Header } from './Header.jsx'
import { RequestDrawer } from './RequestDrawer.jsx'
import { ProfileModal } from './ProfileModal.jsx'
import { useDelayedUnmount } from './hooks.js'

const REFRESH_AFTER_MS = 30000
const UNKNOWN_USER = { name: 'Utilisateur inconnu', email: '', team: '' }

// State and behaviour shared by both role applications: navigation, modals, async actions
// with error feedback, data loading and sign-out. Role-specific actions are added by each app.
export function useAppShell(role, fetchData) {
  const toast = useToast()
  const dispatch = useDispatch()
  const me = useSelector((state) => state.session.user)
  const route = useSelector((state) => state.ui.routeByRole[role])
  const { status, error, loadedAt, materials, requests, users } = useSelector((state) => state.data)
  const [params, setParams] = useState({})
  const [drawerId, setDrawerId] = useState(null)
  const [modal, setModal] = useState(null)
  const [mobileNav, setMobileNav] = useState(false)
  const [navigationLoading, setNavigationLoading] = useState(false)
  const [busyAction, setBusyAction] = useState('')
  const actionLock = useRef(false)
  const navigationTimer = useRef(null)
  useEffect(() => () => clearTimeout(navigationTimer.current), [])

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) dispatch(loadStarted())
    try {
      dispatch(loadSucceeded(await fetchData()))
    } catch (loadError) {
      if (loadError.status === 401) return
      if (!silent) dispatch(loadFailed(loadError.message))
    }
  }, [dispatch, fetchData])

  useEffect(() => { load() }, [load])

  // Coming back to the tab refreshes the data quietly, so admins see new requests without reloading.
  const loadedAtRef = useRef(loadedAt)
  useEffect(() => { loadedAtRef.current = loadedAt }, [loadedAt])
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible' && Date.now() - loadedAtRef.current > REFRESH_AFTER_MS) load({ silent: true }) }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [load])

  const matMap = useMemo(() => Object.fromEntries(materials.map((material) => [material.id, material])), [materials])
  const matById = useCallback((id) => matMap[id] || null, [matMap])
  const matName = useCallback((id) => (matMap[id] ? matMap[id].name : 'Matériel supprimé'), [matMap])
  const userMap = useMemo(() => Object.fromEntries((users.length ? users : [me]).map((user) => [user.id, user])), [users, me])
  const userById = useCallback((id) => userMap[id] || UNKNOWN_USER, [userMap])

  const navigate = useCallback((nextRoute, nextParams = {}) => {
    dispatch(setCurrentRoute({ role, route: nextRoute }))
    setParams(nextParams)
    setMobileNav(false)
    setDrawerId(null)
    setNavigationLoading(true)
    clearTimeout(navigationTimer.current)
    navigationTimer.current = setTimeout(() => setNavigationLoading(false), 240)
  }, [dispatch, role])

  // Runs one mutation at a time; API errors become a toast (and field errors when the form wants them).
  const runAction = useCallback(async (key, operation, { onFieldErrors } = {}) => {
    if (actionLock.current) return false
    actionLock.current = true
    setBusyAction(key)
    try {
      await operation()
      return true
    } catch (actionError) {
      if (actionError.status !== 401) {
        const fields = actionError.fields || {}
        if (onFieldErrors && Object.keys(fields).length) onFieldErrors(fields)
        toast.error(actionError.status === 0 ? 'Connexion impossible' : 'Action impossible', { description: actionError.message })
      }
      return false
    } finally {
      actionLock.current = false
      setBusyAction('')
    }
  }, [toast])

  const logout = useCallback(async () => {
    try { await authApi.logout() } catch { /* the local session is cleared anyway */ }
    dispatch(signedOut())
    toast.success('Vous êtes déconnecté·e', { description: 'À bientôt sur Materio.' })
  }, [dispatch, toast])

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') {
        if (modal) setModal(null)
        else if (drawerId) setDrawerId(null)
        else if (mobileNav) setMobileNav(false)
      } else if (event.key === '/') {
        const target = event.target
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)) return
        const search = document.querySelector('[data-search]')
        if (search) { event.preventDefault(); search.focus() }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modal, drawerId, mobileNav])

  return {
    role, route, me, params, status, error, materials, requests, users, matById, matName, userById,
    navigate, load, runAction, logout, busyAction, modal, setModal, drawerId, setDrawerId, mobileNav, setMobileNav, navigationLoading,
    openRequest: setDrawerId,
    openProfile: () => setModal({ type: 'profile' }),
    closeModal: () => setModal(null),
  }
}

export function AppShell({ ctx: shellCtx, pages, skeletonVariant, actionLoadingLabel, children }) {
  // A remembered route that no longer exists (e.g. a disabled section) falls back to the role's home page.
  const ctx = pages[shellCtx.route] ? shellCtx : { ...shellCtx, route: Object.keys(pages)[0] }
  const { role, route, params, status, error, load, requests, drawerId, setDrawerId, mobileNav, setMobileNav, navigationLoading, busyAction, modal, closeModal } = ctx
  const Page = pages[route]
  const drawerReq = drawerId ? requests.find((request) => request.id === drawerId) || null : null
  const navMounted = useDelayedUnmount(mobileNav, 180)
  const loading = status === 'idle' || status === 'loading' || navigationLoading

  return (
    <AppCtx.Provider value={ctx}>
      <div className="min-h-screen">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200/70 bg-white/35 backdrop-blur-sm lg:block"><SidebarContent app={ctx} /></aside>
        {navMounted && <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation"><div className={cx('absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]', mobileNav ? 'anim-fade-in' : 'anim-fade-out')} onClick={() => setMobileNav(false)} /><div className={cx('absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white/35 shadow-modal backdrop-blur-sm', mobileNav ? 'anim-drawer-left-in' : 'anim-fade-out')}><SidebarContent app={ctx} onNavigate={() => setMobileNav(false)} /></div></div>}
        <div className="lg:pl-64">
          <Header onMenu={() => setMobileNav(true)} />
          <main aria-busy={Boolean(busyAction || loading)} className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div key={role + '-' + route} className="anim-view">
              {status === 'error' ? (
                <div className="rounded-2xl border border-slate-200 bg-white shadow-card">
                  <EmptyState icon="alert-triangle" title="Impossible de charger vos données" description={error || 'Le serveur ne répond pas pour le moment.'} action={<Button variant="primary" icon="refresh-cw" onClick={() => load()}>Réessayer</Button>} />
                </div>
              ) : loading ? <PageSkeleton variant={skeletonVariant(route)} /> : <Page params={params} />}
            </div>
          </main>
        </div>
        <RequestDrawer open={!!drawerReq} request={drawerReq} onClose={() => setDrawerId(null)} />
        <LoadingStatus active={!!busyAction} label={actionLoadingLabel(busyAction)} className="fixed bottom-4 left-1/2 z-[75] -translate-x-1/2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-modal" />
        {children}
        <ProfileModal open={modal?.type === 'profile'} onClose={closeModal} app={ctx} />
      </div>
    </AppCtx.Provider>
  )
}
