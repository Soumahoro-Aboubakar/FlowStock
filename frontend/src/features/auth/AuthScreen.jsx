import React, { useState } from 'react'
import { cx } from '../../utils/formatters.js'
import { Icon } from '../../components/ui/icons.jsx'
import { StockBar } from '../../components/ui/Kit.jsx'
import { TextLink, Wordmark } from './parts.jsx'
import { LoginForm } from './LoginForm.jsx'
import { SignupForm } from './SignupForm.jsx'
import { VerifyEmailForm } from './VerifyEmailForm.jsx'

// Invitation links open the signup form with the invited address: /?view=signup&email=…
function initialView() {
  const query = new URLSearchParams(window.location.search)
  const email = (query.get('email') || '').slice(0, 254)
  return { view: query.get('view') === 'signup' ? 'signup' : 'login', email, invited: query.get('view') === 'signup' && Boolean(email) }
}

const FEATURES = [
  { icon: 'package', title: 'Catalogue illustré', text: 'chaque référence avec sa photo et son stock à jour.' },
  { icon: 'check-circle', title: 'Validation en un clic', text: 'approbation, refus motivé et historique complet.' },
  { icon: 'shield', title: 'Accès séparés', text: 'les administrateurs gèrent, les utilisateurs demandent.' },
]

const PREVIEW_ITEMS = [
  { name: 'MacBook Pro 14″', category: 'Informatique', image: 'macbook-pro-14', quantity: 8, total: 12, level: 'ok' },
  { name: 'Casque Sony WH-1000XM5', category: 'Audiovisuel', image: 'casque-sony', quantity: 6, total: 8, level: 'ok' },
  { name: 'Station d’accueil USB-C', category: 'Informatique', image: 'station-accueil-usb-c', quantity: 2, total: 10, level: 'low' },
]

// A faithful, static rendering of the real inventory screen (same components, same demo images).
function ProductPreview() {
  const nav = [['layout-dashboard', "Vue d'ensemble"], ['inbox', 'Demandes', 4], ['archive', 'Matériel'], ['users', 'Utilisateurs']]
  return (
    <div className="auth-preview w-[820px] overflow-hidden rounded-t-[14px] bg-white shadow-[0_0_0_1px_rgba(255,255,255,.08),0_40px_100px_-20px_rgba(0,0,0,.7)]" aria-hidden="true">
      <div className="flex h-9 items-center gap-1.5 border-b border-slate-200/80 bg-slate-50 px-3.5">
        {[0, 1, 2].map((dot) => <span key={dot} className="h-2.5 w-2.5 rounded-full bg-slate-200" />)}
      </div>
      <div className="grid grid-cols-[172px_1fr]">
        <div className="border-r border-slate-100 bg-slate-50/60 px-2.5 py-3.5">
          <div className="mb-4 flex items-center gap-2 px-1.5">
            <span className="auth-mark flex h-5 w-5 items-center justify-center rounded-[6px] text-white"><Icon name="package" size={11} strokeWidth={2.2} /></span>
            <span className="text-[12px] font-semibold text-slate-900">Materio</span>
          </div>
          {nav.map(([icon, label, badge]) => (
            <div key={label} className={cx('mb-0.5 flex items-center gap-2 rounded-md px-2 py-1.5 text-[11.5px]', label === 'Matériel' ? 'bg-primary-soft font-semibold text-primary' : 'text-slate-500')}>
              <Icon name={icon} size={13} />{label}
              {badge && <span className="ml-auto rounded-full bg-slate-200 px-1.5 text-[10px] font-semibold text-slate-600">{badge}</span>}
            </div>
          ))}
        </div>
        <div className="p-5">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[17px] font-bold tracking-tight text-slate-900">Matériel</p>
              <p className="mt-0.5 text-[11px] text-slate-500">12 références · 4 faible(s) · 1 épuisé(s)</p>
            </div>
            <span className="rounded-md bg-primary px-2.5 py-1.5 text-[11px] font-semibold text-white">+ Ajouter un matériel</span>
          </div>
          <div className="mt-4 inline-flex rounded-md bg-slate-100 p-0.5 text-[10.5px] font-medium text-slate-500">
            {['Tous', 'Disponible', 'Faible', 'Épuisé'].map((tab, index) => <span key={tab} className={cx('rounded px-2 py-1', index === 0 && 'bg-white text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,.1)]')}>{tab}</span>)}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {PREVIEW_ITEMS.map((item) => (
              <div key={item.name} className="rounded-xl border border-slate-200 p-1.5 shadow-[0_1px_2px_rgba(15,23,42,.04)]">
                <img src={`/images/materials/${item.image}.webp`} alt="" className="aspect-[16/9] w-full rounded-lg bg-slate-100 object-cover" />
                <div className="px-1.5 pb-1.5 pt-2.5">
                  <p className="truncate text-[11.5px] font-semibold text-slate-900">{item.name}</p>
                  <p className="text-[10px] text-slate-400">{item.category}</p>
                  <div className="mb-1 mt-3 flex justify-between text-[10px]"><span className="text-slate-500">Stock</span><span className="tnum"><span className={cx('font-bold', item.level === 'low' ? 'text-amber-600' : 'text-slate-900')}>{item.quantity}</span><span className="text-slate-300"> / {item.total}</span></span></div>
                  <StockBar quantity={item.quantity} total={item.total} level={item.level} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Showcase() {
  return (
    <aside className="auth-panel relative hidden overflow-hidden rounded-[18px] lg:flex lg:flex-col">
      <div className="auth-noise pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 rounded-[18px] ring-1 ring-inset ring-white/[.06]" aria-hidden="true" />

      <div className="relative px-12 pt-14 xl:px-16 xl:pt-[72px]">
        <p className="text-[13px] font-medium text-blue-300">Gestion du matériel d’entreprise</p>
        <h2 className="mt-4 max-w-[32rem] text-balance text-[34px] 2xl:max-w-[40rem] font-semibold leading-[1.12] tracking-[-0.03em] text-white xl:text-[38px]">
          Du besoin à la remise du matériel, <span className="text-white/40">sans tableur ni relance.</span>
        </h2>
        <ul className="mt-9 max-w-[30rem] space-y-4">
          {FEATURES.map((feature) => (
            <li key={feature.title} className="flex gap-3.5 text-[14px] leading-relaxed text-white/55">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[.06] text-blue-200 ring-1 ring-inset ring-white/10"><Icon name={feature.icon} size={14} /></span>
              <span><span className="font-medium text-white">{feature.title}</span> — {feature.text}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative mt-auto h-[300px] pl-12 pt-12 xl:h-[340px] xl:pl-16">
        <ProductPreview />
      </div>
    </aside>
  )
}

export default function AuthScreen({ onAuthenticated }) {
  const [state, setState] = useState(() => ({ ...initialView(), verify: null }))
  const { view, email, invited, verify } = state

  const go = (nextView, nextEmail = email) => {
    setState((current) => ({ ...current, view: nextView, email: nextEmail, invited: nextView === 'signup' ? current.invited && nextEmail === current.email : false }))
    if (window.location.search) window.history.replaceState(null, '', window.location.pathname)
  }
  const startVerification = ({ email: verifyEmail, resendAvailableAt, code }) => setState((current) => ({ ...current, view: 'verify', email: verifyEmail, verify: { resendAvailableAt, code } }))

  return (
    <div className="min-h-dvh bg-white lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.12fr)] lg:p-2">
      <div className="flex min-h-dvh flex-col lg:min-h-0">
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 px-6 sm:px-10">
          <Wordmark />
          <p className="text-[13px] text-slate-500">
            {view === 'login'
              ? <><span className="hidden sm:inline">Nouveau sur Materio ? </span><TextLink onClick={() => go('signup', email)}>Créer un compte</TextLink></>
              : <><span className="hidden sm:inline">Déjà un compte ? </span><TextLink onClick={() => go('login', email)}>Se connecter</TextLink></>}
          </p>
        </header>

        <main className="flex flex-1 items-center justify-center px-6 py-12 sm:px-10">
          <div key={view} className="w-full max-w-[380px]">
            {view === 'login' && <LoginForm initialEmail={email} onSignedIn={onAuthenticated} onNeedsVerification={startVerification} onSwitch={go} />}
            {view === 'signup' && <SignupForm initialEmail={email} emailLocked={invited} onCodeSent={startVerification} onSwitch={go} />}
            {view === 'verify' && <VerifyEmailForm email={email} resendAvailableAt={verify?.resendAvailableAt} testCode={verify?.code} onVerified={onAuthenticated} onBack={() => go('signup', email)} />}
          </div>
        </main>

        <footer className="flex h-14 shrink-0 flex-wrap items-center justify-between gap-x-4 px-6 text-[12px] text-slate-400 sm:px-10">
          <span>© {new Date().getFullYear()} Materio</span>
          <span className="hidden sm:inline">Un problème d’accès ? Contactez votre administrateur.</span>
        </footer>
      </div>
      <Showcase />
    </div>
  )
}
