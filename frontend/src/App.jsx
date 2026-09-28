import React, { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { authApi } from './api/auth.js'
import { onSessionExpired } from './api/client.js'
import { sessionResolved, signedOut } from './store/sessionSlice.js'
import { Button, Spinner, ToastProvider, useToast } from './components/ui/Kit.jsx'
import { BrandMark } from './features/auth/parts.jsx'
import AuthScreen from './features/auth/AuthScreen.jsx'

// Each role gets its own bundle: an employee never downloads the administration code.
const AdminApp = lazy(() => import('./features/admin/AdminApp.jsx'))
const EmployeeApp = lazy(() => import('./features/employee/EmployeeApp.jsx'))

function Splash({ error, onRetry }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-white/60 px-6 text-center backdrop-blur-sm" role="status">
      <span className="anim-scale-in"><BrandMark size={48} /></span>
      {error ? (
        <div className="anim-view max-w-sm">
          <p className="text-[15px] font-semibold text-slate-900">Serveur injoignable</p>
          <p className="mt-1 text-sm text-slate-500">{error}</p>
          <Button variant="secondary" icon="refresh-cw" className="mt-4" onClick={onRetry}>Réessayer</Button>
        </div>
      ) : (
        <span className="flex items-center gap-2 text-[13px] font-medium text-slate-500"><Spinner size={14} className="text-primary" />Ouverture de votre espace…</span>
      )}
    </div>
  )
}

function Root() {
  const dispatch = useDispatch()
  const toast = useToast()
  const { status, user } = useSelector((state) => state.session)
  const [bootError, setBootError] = useState(null)
  const statusRef = useRef(status)
  useEffect(() => { statusRef.current = status }, [status])

  const restoreSession = useCallback(async () => {
    setBootError(null)
    try {
      const { user: current } = await authApi.me()
      dispatch(sessionResolved(current))
    } catch (error) {
      if (error.status === 0) setBootError(error.message)
      else dispatch(sessionResolved(null))
    }
  }, [dispatch])

  useEffect(() => { restoreSession() }, [restoreSession])

  useEffect(() => {
    onSessionExpired((error) => {
      if (statusRef.current !== 'authenticated') return
      statusRef.current = 'guest'
      dispatch(signedOut())
      toast.warning('Session expirée', { description: error.code === 'SESSION_EXPIRED' ? error.message : 'Reconnectez-vous pour continuer.' })
    })
    return () => onSessionExpired(null)
  }, [dispatch, toast])

  const handleAuthenticated = (signedIn) => {
    dispatch(sessionResolved(signedIn))
    toast.success(`Bienvenue, ${signedIn.name.split(' ')[0]}`, { description: signedIn.role === 'admin' ? 'Vous êtes connecté·e à l’espace administrateur.' : 'Vous êtes connecté·e à votre espace collaborateur.' })
  }

  if (status === 'checking') return <Splash error={bootError} onRetry={restoreSession} />
  if (status === 'guest' || !user) return <AuthScreen onAuthenticated={handleAuthenticated} />

  const RoleApp = user.role === 'admin' ? AdminApp : EmployeeApp
  return (
    <Suspense fallback={<Splash />}>
      <RoleApp key={user.id} />
    </Suspense>
  )
}

export default function RootApp() {
  return (
    <ToastProvider>
      <Root />
    </ToastProvider>
  )
}
