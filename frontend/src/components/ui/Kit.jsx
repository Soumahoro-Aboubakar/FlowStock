import React, { useEffect, useMemo, useRef, useState } from 'react'
import { cx, fmtDate, fmtDateTime, norm, timeAgo, STATUS_META, STOCK_META, CATEGORIES, stockLevel, isAdminUser, roleLabel, initials, cap } from '../../utils/formatters.js'
import { Icon } from './icons.jsx'
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_BYTES, fmtFileSize } from '../../services/materialImages.js'
import { mediaUrl } from '../../api/client.js'

export function Button({ variant = 'primary', size = 'md', icon, iconRight, loading = false, loadingLabel = 'Traitement en cours', className, children, disabled, ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-all duration-150 active:scale-[.98] disabled:opacity-45 disabled:pointer-events-none select-none'
  const sizes = { xs: 'h-8 px-2.5 text-[13px]', sm: 'h-9 px-3.5 text-[13px]', md: 'h-10 px-4', lg: 'h-11 px-5' }
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-dark shadow-[0_1px_2px_rgba(37,99,235,.35)]',
    secondary: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-card',
    ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    soft: 'bg-primary-soft text-primary hover:bg-primary-muted',
    'danger-soft': 'bg-red-50 text-red-600 hover:bg-red-100',
    'danger-solid': 'bg-red-600 text-white hover:bg-red-700 shadow-[0_1px_2px_rgba(220,38,38,.35)]',
  }
  return (
    <button type="button" {...props} disabled={disabled || loading} aria-busy={loading || undefined} className={cx(base, sizes[size], variants[variant], className)}>
      {loading ? <Spinner size={size === 'xs' || size === 'sm' ? 14 : 16} /> : icon && <Icon name={icon} size={size === 'xs' || size === 'sm' ? 15 : 16} />}
      {loading && <span className="sr-only">{loadingLabel}</span>}
      {children}
      {!loading && iconRight && <Icon name={iconRight} size={15} />}
    </button>
  )
}

export function Spinner({ size = 16, className = '' }) {
  return <span aria-hidden="true" className={cx('loading-spinner', className)} style={{ width: size, height: size }} />
}

export function LoadingStatus({ active, label = 'Mise à jour des résultats…', className = '' }) {
  if (!active) return null
  return <span role="status" className={cx('inline-flex items-center gap-2 text-xs font-medium text-slate-500', className)}><Spinner size={14} />{label}</span>
}

export function PageSkeleton({ variant = 'list' }) {
  const cardGrid = variant === 'cards'
  return (
    <div className="page-skeleton space-y-5" role="status" aria-label="Chargement du contenu">
      <span className="sr-only">Chargement du contenu…</span>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2"><div className="loading-shimmer h-8 w-52 rounded-lg" /><div className="loading-shimmer h-4 w-72 max-w-[75vw] rounded-md" /></div>
        <div className="loading-shimmer h-10 w-36 rounded-lg" />
      </div>
      {variant === 'dashboard' && <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="loading-shimmer h-[122px] rounded-2xl border border-slate-200 bg-white" />)}</div>}
      {variant === 'dashboard' && <div className="grid gap-4 lg:grid-cols-3"><div className="loading-shimmer h-72 rounded-2xl border border-slate-200 bg-white lg:col-span-2" /><div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5"><div className="loading-shimmer mb-5 h-5 w-3/4 rounded" /><div className="space-y-4">{Array.from({ length: 5 }, (_, index) => <div key={index} className="flex items-center gap-3"><div className="loading-shimmer h-9 w-9 shrink-0 rounded-full" /><div className="flex-1 space-y-2"><div className="loading-shimmer h-3 w-3/4 rounded" /><div className="loading-shimmer h-3 w-2/5 rounded" /></div><div className="loading-shimmer h-6 w-16 rounded-full" /></div>)}</div></div></div>}
      {cardGrid && <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className="rounded-2xl border border-slate-200 bg-white p-2.5"><div className="loading-shimmer aspect-[16/9] rounded-xl" /><div className="px-2.5 pb-2.5"><div className="mt-4 space-y-2"><div className="loading-shimmer h-4 w-3/4 rounded" /><div className="loading-shimmer h-3 w-1/2 rounded" /><div className="loading-shimmer mt-4 h-3 w-full rounded" /></div><div className="loading-shimmer mt-6 h-9 w-full rounded-lg" /></div></div>)}</div>}
      {variant === 'settings' && <div className="grid gap-5 lg:grid-cols-5"><div className="space-y-5 lg:col-span-3">{[0, 1].map((item) => <div key={item} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="loading-shimmer mb-5 h-10 w-2/3 rounded-lg" />{[0, 1, 2].map((row) => <div key={row} className="loading-shimmer mb-4 h-12 rounded-lg last:mb-0" />)}</div>)}</div><div className="space-y-5 lg:col-span-2">{[0, 1].map((item) => <div key={item} className="loading-shimmer h-52 rounded-2xl border border-slate-200 bg-white" />)}</div></div>}
      {!cardGrid && variant !== 'dashboard' && variant !== 'settings' && <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5"><div className="loading-shimmer mb-5 h-5 w-full rounded" /><div className="space-y-4">{Array.from({ length: 7 }, (_, index) => <div key={index} className="flex items-center gap-3 border-b border-slate-100 pb-4 last:border-0"><div className="loading-shimmer h-9 w-9 shrink-0 rounded-full" /><div className="flex-1 space-y-2"><div className="loading-shimmer h-3 w-2/5 rounded" /><div className="loading-shimmer h-3 w-1/4 rounded" /></div><div className="loading-shimmer h-6 w-20 rounded-full" /></div>)}</div></div>}
    </div>
  )
}

export function useLoadingFeedback(delay = 260) {
  const [loading, setLoading] = useState(false)
  const timer = useRef(null)
  const trigger = useMemo(() => () => {
    setLoading(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setLoading(false), delay)
  }, [delay])
  useEffect(() => () => clearTimeout(timer.current), [])
  return [loading, trigger]
}

export function IconButton({ icon, label, tone = 'ghost', className, ...props }) {
  const tones = {
    ghost: 'text-slate-400 hover:bg-slate-100 hover:text-slate-600',
    plain: 'text-slate-500 hover:bg-slate-100 hover:text-slate-800',
    success: 'text-slate-400 hover:bg-emerald-50 hover:text-emerald-600',
    danger: 'text-slate-400 hover:bg-red-50 hover:text-red-600',
  }
  return (
    <button type="button" aria-label={label} title={label} {...props}
      className={cx('inline-flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:pointer-events-none', tones[tone], className)}>
      <Icon name={icon} size={17} />
    </button>
  )
}

export function Field({ label, required, error, hint, children }) {
  return (
    <div>
      <span className="mb-1.5 block text-[13px] font-medium text-slate-700">
        {label} {required && <span className="text-red-600">*</span>}
      </span>
      {children}
      {error ? <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600"><Icon name="alert-triangle" size={12} />{error}</p> : hint ? <p className="mt-1.5 text-xs text-slate-400">{hint}</p> : null}
    </div>
  )
}

export function Input({ error, className, ...props }) {
  return <input {...props} className={cx('w-full rounded-lg border bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition shadow-[0_1px_1px_rgba(15,23,42,.02)] h-11', error ? 'border-red-300 focus:ring-4 focus:ring-red-100' : 'border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10', className)} />
}

export function Textarea({ error, className, ...props }) {
  return <textarea {...props} className={cx('w-full rounded-lg border bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition shadow-[0_1px_1px_rgba(15,23,42,.02)] py-2.5 leading-relaxed resize-none', error ? 'border-red-300 focus:ring-4 focus:ring-red-100' : 'border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10', className)} />
}

export function Select({ error, className, children, ...props }) {
  return (
    <div className="relative">
      <select {...props} className={cx('w-full rounded-lg border bg-white px-3.5 text-sm text-slate-900 outline-none transition h-11 appearance-none pr-9', error ? 'border-red-300 focus:ring-4 focus:ring-red-100' : 'border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10', className)}>{children}</select>
      <Icon name="chevron-down" size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
    </div>
  )
}

export function Switch({ checked, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label}
      onClick={() => onChange(!checked)}
      className={cx('relative h-6 w-10 shrink-0 rounded-full transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300', checked ? 'bg-primary' : 'bg-slate-200')}>
      <span className={cx('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-200', checked ? 'left-[18px]' : 'left-0.5')} />
    </button>
  )
}

export function StatusBadge({ status, size = 'md' }) {
  const meta = STATUS_META[status] || STATUS_META.pending
  return (
    <span className={cx('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border font-semibold', size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs', meta.wrap)}>
      <span className={cx('h-1.5 w-1.5 rounded-full', meta.dot, meta.pulse && 'animate-pulse')} />
      {meta.label}
    </span>
  )
}

export function RoleBadge({ role }) {
  const admin = isAdminUser({ role })
  return (
    <span className={cx('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold', admin ? 'border-primary/20 bg-primary-soft text-primary' : 'border-slate-200 bg-slate-100 text-slate-600')}>
      {admin && <Icon name="shield" size={12} />}{roleLabel(role)}
    </span>
  )
}

export function StockBadge({ level, size = 'md' }) {
  const meta = STOCK_META[level] || STOCK_META.ok
  return (
    <span className={cx('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border font-semibold', size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs', meta.wrap)}>
      <span className={cx('h-1.5 w-1.5 rounded-full', meta.dot)} />{meta.label}
    </span>
  )
}

export function StockBar({ quantity, total, level }) {
  const pct = total ? Math.round((quantity / total) * 100) : 0
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={cx('h-full rounded-full transition-all duration-500', STOCK_META[level || 'ok'].bar)} style={{ width: pct + '%' }} />
    </div>
  )
}

export function CatIcon({ category, size = 'md', overlay = false, className }) {
  const meta = CATEGORIES[category] || { icon: 'package', chip: 'bg-slate-100 text-slate-500', tone: 'text-slate-500' }
  return (
    <span title={overlay ? category : undefined} className={cx('flex shrink-0 items-center justify-center', size === 'lg' ? 'h-11 w-11 rounded-xl' : 'h-9 w-9 rounded-lg', overlay ? cx('bg-white/95 shadow-card ring-1 ring-slate-900/5 backdrop-blur', meta.tone) : meta.chip, className)}>
      <Icon name={meta.icon} size={size === 'lg' ? 20 : 17} />
    </span>
  )
}

const DEFAULT_CATEGORY = { icon: 'package', chip: 'bg-slate-100 text-slate-500' }

function ImageFallback({ category, compact, iconSize }) {
  const meta = CATEGORIES[category] || DEFAULT_CATEGORY
  if (compact) return <span className={cx('absolute inset-0 flex items-center justify-center', meta.chip)}><Icon name={meta.icon} size={iconSize} /></span>
  return (
    <span className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-linear-to-br from-slate-50 via-slate-100 to-slate-200/80">
      <span className={cx('flex h-14 w-14 items-center justify-center rounded-2xl shadow-card ring-4 ring-white', meta.chip)}><Icon name={meta.icon} size={iconSize} /></span>
      <span className="text-[11px] font-medium text-slate-400">Aucune image</span>
    </span>
  )
}

// Renders a material's image with a shimmer while loading and a category fallback when it is missing or broken.
export function MaterialImage({ material, compact = false, iconSize = 24, className, imgClassName, style }) {
  const url = material && material.image ? mediaUrl(material.image.url) : null
  const [loadedUrl, setLoadedUrl] = useState(null)
  const [failedUrl, setFailedUrl] = useState(null)
  const missing = !url || failedUrl === url
  return (
    <div className={cx('relative isolate overflow-hidden bg-slate-100', className)} style={style}>
      {missing ? <ImageFallback category={material && material.category} compact={compact} iconSize={iconSize} /> : (
        <>
          {loadedUrl !== url && <span aria-hidden="true" className="loading-shimmer absolute inset-0" />}
          <img src={url} alt={material.name} loading="lazy" decoding="async" draggable="false" onLoad={() => setLoadedUrl(url)} onError={() => setFailedUrl(url)}
            className={cx('h-full w-full object-cover transition-[opacity,transform] duration-500', loadedUrl === url ? 'opacity-100' : 'opacity-0', imgClassName)} />
        </>
      )}
    </div>
  )
}

export function MaterialThumb({ material, size = 40, className }) {
  return <MaterialImage material={material} compact iconSize={Math.round(size * 0.44)} className={cx('shrink-0 rounded-lg ring-1 ring-slate-200/80', className)} style={{ width: size, height: size }} />
}

export function ImageDropzone({ previewUrl, badge, fileInfo, onSelect, onClear, clearLabel = 'Retirer', clearIcon = 'x', error, uploading = false, progress = 0, disabled = false }) {
  const inputRef = useRef(null)
  const depth = useRef(0)
  const [dragging, setDragging] = useState(false)
  const [brokenUrl, setBrokenUrl] = useState(null)
  const locked = disabled || uploading
  const browse = () => { if (!locked && inputRef.current) inputRef.current.click() }
  const pick = (files) => { const file = files && files[0]; if (file) onSelect(file) }
  const dragProps = {
    onDragEnter: (event) => { event.preventDefault(); if (locked) return; depth.current += 1; setDragging(true) },
    onDragOver: (event) => { event.preventDefault(); event.dataTransfer.dropEffect = locked ? 'none' : 'copy' },
    onDragLeave: (event) => { event.preventDefault(); depth.current = Math.max(0, depth.current - 1); if (!depth.current) setDragging(false) },
    onDrop: (event) => { event.preventDefault(); depth.current = 0; setDragging(false); if (!locked) pick(event.dataTransfer.files) },
  }
  const input = <input ref={inputRef} type="file" accept={ACCEPTED_IMAGE_TYPES.join(',')} className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(event) => { pick(event.target.files); event.target.value = '' }} />

  if (!previewUrl) {
    return (
      <>
        {input}
        <button type="button" onClick={browse} disabled={disabled} aria-invalid={!!error || undefined} {...dragProps}
          className={cx('group relative flex aspect-[16/9] w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 text-center transition-colors duration-150 disabled:opacity-50',
            dragging ? 'border-primary bg-primary-soft' : error ? 'border-red-300 bg-red-50/40 hover:border-red-400' : 'border-slate-200 bg-slate-50/70 hover:border-primary/40 hover:bg-primary-soft/50')}>
          <span className={cx('flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-card ring-1 ring-slate-200/70 transition-transform duration-200 group-hover:-translate-y-0.5', error && !dragging ? 'text-red-500' : 'text-primary')}>
            <Icon name={dragging ? 'image-plus' : 'upload-cloud'} size={22} />
          </span>
          <span>
            <span className="block text-sm font-medium text-slate-700">{dragging ? "Déposez l'image ici" : <>Glissez-déposez une image ou <span className="font-semibold text-primary">parcourez vos fichiers</span></>}</span>
            <span className="mt-1 block text-xs text-slate-400">JPG, PNG ou WebP · {fmtFileSize(MAX_IMAGE_BYTES)} max · format paysage 16:9 conseillé</span>
          </span>
        </button>
      </>
    )
  }

  return (
    <div {...dragProps} aria-busy={uploading || undefined}
      className={cx('relative aspect-[16/9] overflow-hidden rounded-xl border bg-slate-100 transition-shadow', dragging ? 'border-primary ring-4 ring-primary/15' : error ? 'border-red-300' : 'border-slate-200')}>
      {input}
      {brokenUrl === previewUrl
        ? <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400"><Icon name="image" size={26} /><span className="text-xs font-medium">Image actuelle introuvable</span></span>
        : <img src={previewUrl} alt="Aperçu de l'image du matériel" onError={() => setBrokenUrl(previewUrl)} className="h-full w-full object-cover" />}
      {badge && <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-card backdrop-blur"><Icon name="image" size={12} className="text-slate-400" />{badge}</span>}
      <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-x-3 gap-y-2 bg-linear-to-t from-slate-950/75 via-slate-950/35 to-transparent px-3 pb-3 pt-12">
        <div className="min-w-0 flex-1 basis-32 text-white">
          {fileInfo && <><p className="truncate text-[13px] font-semibold">{fileInfo.name}</p><p className="text-[11px] text-white/75">{fileInfo.meta}</p></>}
        </div>
        <div className="flex shrink-0 gap-1.5">
          <Button size="xs" variant="secondary" icon="refresh-cw" disabled={locked} onClick={browse}>Remplacer</Button>
          {onClear && <Button size="xs" variant="secondary" icon={clearIcon} disabled={locked} onClick={onClear}>{clearLabel}</Button>}
        </div>
      </div>
      {dragging && <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-primary/15 backdrop-blur-[1px]"><span className="rounded-full bg-white px-3 py-1.5 text-[13px] font-semibold text-primary shadow-pop">Déposez pour remplacer l'image</span></div>}
      {uploading && (
        <div role="status" className="anim-fade-in absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/80 backdrop-blur-[2px]">
          <Spinner size={22} className="text-primary" />
          <p className="tnum text-[13px] font-semibold text-slate-700">Téléversement de l'image… {progress} %</p>
          <div className="h-1.5 w-44 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-primary transition-all duration-200" style={{ width: `${progress}%` }} /></div>
        </div>
      )}
    </div>
  )
}

export function Avatar({ name, size = 36, className }) {
  const tone = ['bg-blue-100 text-blue-700', 'bg-amber-100 text-amber-700', 'bg-emerald-100 text-emerald-700', 'bg-violet-100 text-violet-700', 'bg-rose-100 text-rose-700', 'bg-teal-100 text-teal-700', 'bg-indigo-100 text-indigo-700', 'bg-cyan-100 text-cyan-700'][((name || '').split('').reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 997, 0)) % 8]
  return (
    <span className={cx('flex shrink-0 items-center justify-center rounded-full font-semibold', tone, className)}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}>
      {initials(name)}
    </span>
  )
}

export function SectionLabel({ children }) {
  return <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{children}</p>
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Icon name={icon} size={26} />
      </div>
      <h3 className="mt-4 text-[15px] font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm leading-relaxed text-slate-500">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[26px] font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function SearchInput({ value, onChange, placeholder, className, loading = false }) {
  return (
    <div className={cx('relative', className)} aria-busy={loading || undefined}>
      <Icon name="search" size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} aria-busy={loading || undefined}
        className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-10 text-sm outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10" />
      {loading && <span role="status" aria-label="Filtrage en cours" className="absolute right-10 top-1/2 -translate-y-1/2"><Spinner size={14} /></span>}
      {value ? <button type="button" aria-label="Effacer" onClick={() => onChange('')} className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"><Icon name="x" size={13} /></button> : loading ? null : <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden h-6 min-w-[24px] -translate-y-1/2 items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-1.5 text-[11px] font-medium text-slate-400 sm:flex">/</kbd>}
    </div>
  )
}

export function Segmented({ options, value, onChange, className }) {
  const refs = useRef({})
  const [rect, setRect] = useState(null)
  const measure = useMemo(() => () => {
    const el = refs.current[value]
    if (el) setRect({ left: el.offsetLeft, width: el.offsetWidth })
  }, [value, options])
  useEffect(() => {
    measure()
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure)
  }, [measure])
  useEffect(() => {
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [measure])
  return (
    <div className={cx('relative inline-flex rounded-lg bg-slate-100 p-1', className)} role="tablist">
      {rect && <span aria-hidden="true" className="absolute bottom-1 top-1 rounded-md bg-white shadow-[0_1px_3px_rgba(15,23,42,.12)] transition-all duration-200 ease-out" style={{ left: rect.left, width: rect.width }} />}
      {options.map((option) => (
        <button key={option.value} type="button" role="tab" aria-selected={value === option.value}
          ref={(element) => (refs.current[option.value] = element)}
          onClick={() => onChange(option.value)}
          className={cx('relative z-10 flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-[12.5px] font-medium transition-colors duration-150', value === option.value ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700')}>
          {option.icon && <Icon name={option.icon} size={13} />}
          {option.label}
          {option.count != null && <span className="tnum text-[11px] text-slate-400">{option.count}</span>}
        </button>
      ))}
    </div>
  )
}

export function Dropdown({ trigger, children, align = 'right', width = 'w-52' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const handleClick = (event) => { if (ref.current && !ref.current.contains(event.target)) setOpen(false) }
    const handleEscape = (event) => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])
  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen((value) => !value)}>{trigger}</div>
      {open && (
        <div className={cx('absolute z-40 mt-2 rounded-xl border border-slate-200 bg-white py-1.5 shadow-modal anim-scale-in origin-top-right', align === 'right' ? 'right-0' : 'left-0', width)}>
          {children({ close: () => setOpen(false) })}
        </div>
      )}
    </div>
  )
}

export function MenuItem({ icon, label, danger, onClick }) {
  return (
    <button type="button" onClick={onClick} className={cx('flex w-full items-center gap-2.5 px-3 py-2 text-[13px] font-medium transition-colors', danger ? 'text-red-600 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-50')}>
      <Icon name={icon} size={15} />{label}
    </button>
  )
}

export function Modal({ open, onClose, title, description, children, footer, size = 'md' }) {
  const [mounted, setMounted] = useState(open)
  useEffect(() => {
    if (open) { setMounted(true); return }
    const timer = setTimeout(() => setMounted(false), 170)
    return () => clearTimeout(timer)
  }, [open])
  if (!mounted) return null
  const width = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' }[size]
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className={cx('absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]', open ? 'anim-fade-in' : 'anim-fade-out')} onClick={onClose} />
      <div className={cx('relative flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-modal sm:rounded-2xl', width, open ? 'anim-scale-in' : 'anim-scale-out')}>
        <div className="flex items-start justify-between gap-4 px-6 pt-5">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
            {description && <p className="mt-1 text-sm leading-relaxed text-slate-500">{description}</p>}
          </div>
          <IconButton icon="x" label="Fermer" onClick={onClose} className="-mr-2 -mt-1" />
        </div>
        <div className="overflow-y-auto px-6 py-4">{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 rounded-b-2xl border-t border-slate-100 bg-slate-50/70 px-6 py-4">{footer}</div>}
      </div>
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const dismiss = (id) => setToasts((previous) => previous.filter((toast) => toast.id !== id))
  const push = (type, title, options = {}) => {
    const id = Date.now() + Math.random()
    setToasts((previous) => [...previous.slice(-3), { id, type, title, description: options.description, action: options.action }])
    setTimeout(() => dismiss(id), options.duration || 4600)
  }
  const api = useMemo(() => ({
    success: (title, options) => push('success', title, options),
    error: (title, options) => push('error', title, options),
    warning: (title, options) => push('warning', title, options),
    info: (title, options) => push('info', title, options),
  }), [])
  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[80] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2.5" aria-live="polite">
        {toasts.map((toast) => {
          const meta = { success: { icon: 'check-circle', chip: 'bg-emerald-50 text-emerald-600' }, error: { icon: 'x-circle', chip: 'bg-red-50 text-red-600' }, warning: { icon: 'alert-triangle', chip: 'bg-amber-50 text-amber-600' }, info: { icon: 'info', chip: 'bg-blue-50 text-blue-600' } }[toast.type]
          return (
            <div key={toast.id} className="anim-toast pointer-events-auto flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-modal">
              <span className={cx('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', meta.chip)}><Icon name={meta.icon} size={17} /></span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">{toast.title}</p>
                {toast.description && <p className="mt-0.5 text-[13px] leading-snug text-slate-500">{toast.description}</p>}
              </div>
              {toast.action && (
                <button type="button" className="shrink-0 self-center text-[13px] font-semibold text-primary hover:text-primary-dark" onClick={() => { toast.action.onClick && toast.action.onClick(); dismiss(toast.id) }}>
                  {toast.action.label}
                </button>
              )}
              <button type="button" aria-label="Fermer" className="shrink-0 self-start text-slate-300 hover:text-slate-500" onClick={() => dismiss(toast.id)}>
                <Icon name="x" size={15} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export const ToastContext = React.createContext(null)
export const useToast = () => React.useContext(ToastContext)

export function useCountUp(target, duration = 750) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    let raf
    const t0 = performance.now()
    const tick = (timestamp) => {
      const progress = Math.min((timestamp - t0) / duration, 1)
      setValue(Math.round(target * (1 - Math.pow(1 - progress, 3))))
      if (progress < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return value
}

export function StatCard({ card, index }) {
  const value = useCountUp(card.value)
  return (
    <button type="button" onClick={card.to}
      className="rise group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-pop"
      style={{ animationDelay: `${index * 60}ms` }}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-slate-500">{card.label}</p>
        <span className={cx('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-110', card.chip)}>
          <Icon name={card.icon} size={16} />
        </span>
      </div>
      <p className="tnum mt-3 text-[32px] font-bold leading-none text-slate-900">{value}</p>
      <p className="mt-2.5 text-xs text-slate-400">{card.caption}</p>
    </button>
  )
}

export function TrendChart({ data }) {
  const max = Math.max(...data.map((entry) => entry.value), 1)
  return (
    <div className="flex h-40 items-end gap-1.5 sm:gap-2">
      {data.map((entry, index) => (
        <div key={index} className="group relative flex h-full flex-1 flex-col items-center justify-end gap-1.5">
          <span className="tnum text-[11px] font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">{entry.value || ''}</span>
          <div className={cx('w-full max-w-[26px] rounded-md transition-colors duration-200', entry.today ? 'bg-primary' : 'bg-primary-soft group-hover:bg-primary/60')} style={{ height: `${entry.value ? Math.max((entry.value / max) * 70, 9) : 4}%` }} />
          <span className={cx('tnum text-[10.5px]', entry.today ? 'font-semibold text-primary' : 'text-slate-400')}>{entry.label}</span>
          <span className="pointer-events-none absolute -top-2 left-1/2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[11px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
            {entry.value} demandes · {entry.tooltip}
          </span>
        </div>
      ))}
    </div>
  )
}

export function SettingsSection({ icon, chip, title, description, children }) {
  return (
    <section className="rise rounded-2xl border border-slate-200 bg-white shadow-card">
      <header className="flex items-start gap-3.5 px-5 pt-5">
        <span className={cx('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', chip)}><Icon name={icon} size={17} /></span>
        <div>
          <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>
          <p className="mt-0.5 text-[13px] text-slate-500">{description}</p>
        </div>
      </header>
      <div className="px-5 pb-5 pt-4">{children}</div>
    </section>
  )
}

export function ToggleRow({ title, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-3.5 first:pt-0 last:border-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800">{title}</p>
        {description && <p className="mt-0.5 text-xs leading-snug text-slate-500">{description}</p>}
      </div>
      <Switch checked={checked} onChange={onChange} label={title} />
    </div>
  )
}

export function DrawerActions({ req, approveRequest, openRejectModal, busyAction }) {
  return (
    <>
      <Button variant="danger-soft" icon="x" className="flex-1" disabled={!!busyAction} onClick={() => openRejectModal(req)}>Refuser</Button>
      <Button variant="primary" icon="check" className="flex-1" loading={busyAction === `approve:${req.id}`} onClick={() => approveRequest(req.id)}>Approuver</Button>
    </>
  )
}

export function EmployeeCancel({ req, openCancelModal, busyAction }) {
  return <Button variant="danger-soft" icon="x" className="w-full" disabled={!!busyAction} onClick={() => openCancelModal(req)}>Annuler la demande</Button>
}

export const DEFAULT_PREFS = {
  newRequests: true,
  decisions: true,
  stockAlerts: true,
  pendingReminder: true,
  weekly: false,
  compact: false,
  lang: 'fr',
  tz: 'Europe/Paris',
  dateFmt: 'dmy',
}

export function getStatusBadgeFromRequest(request) {
  return request ? STATUS_META[request.status] : STATUS_META.pending
}

export function createInitialsFromName(name) { return initials(name) }
export function formatActionLabel(value) { return cap(value) }

export function getCountLabel(value, singular, plural) { return `${value} ${value > 1 ? plural : singular}` }

export default { Button, IconButton, Field, Input, Textarea, Select, Switch, StatusBadge, RoleBadge, StockBadge, StockBar, CatIcon, MaterialImage, MaterialThumb, ImageDropzone, Avatar, SectionLabel, EmptyState, PageHeader, SearchInput, Segmented, Dropdown, MenuItem, Modal, ToastProvider, useToast, useCountUp, StatCard, TrendChart, SettingsSection, ToggleRow, DEFAULT_PREFS, DrawerActions, EmployeeCancel }
