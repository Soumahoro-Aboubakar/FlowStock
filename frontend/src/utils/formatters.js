export const H = 36e5
export const D = 864e5

export const cx = (...parts) => parts.filter(Boolean).join(' ')

export const cap = (value = '') => value.charAt(0).toUpperCase() + value.slice(1)

export const fmtDate = (timestamp) =>
  new Date(timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })

export const fmtDateTime = (timestamp) =>
  `${new Date(timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} · ${new Date(timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`

export const fmtDateLong = (timestamp) =>
  cap(new Date(timestamp).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }))

export const norm = (value = '') =>
  value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

export const initials = (name = '') =>
  name.trim().split(/\s+/).map((word) => word[0]).slice(0, 2).join('').toUpperCase()

export const pl = (count, singular, plural) => `${count} ${count > 1 ? plural : singular}`

export const ROLE_LABELS = { admin: 'Administrateur', employee: 'Utilisateur' }
export const roleLabel = (role) => ROLE_LABELS[role] || role

export const isAdminUser = (user) => user.role === 'admin'

export const timeAgo = (timestamp) => {
  const minutes = Math.floor((Date.now() - timestamp) / 60000)
  if (minutes < 1) return "à l'instant"
  if (minutes < 60) return `il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `il y a ${hours} h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'hier'
  if (days < 7) return `il y a ${days} j`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `il y a ${weeks} sem.`
  return `le ${fmtDate(timestamp)}`
}

export const stockLevel = (material) =>
  material.quantity <= 0 ? 'out' : material.quantity <= Math.ceil(material.total * 0.25) ? 'low' : 'ok'

export const STATUS_META = {
  pending: { label: 'En attente', dot: 'bg-amber-500', wrap: 'bg-amber-50 text-amber-700 border-amber-200/70', pulse: true },
  approved: { label: 'Approuvée', dot: 'bg-emerald-500', wrap: 'bg-emerald-50 text-emerald-700 border-emerald-200/70' },
  rejected: { label: 'Refusée', dot: 'bg-red-500', wrap: 'bg-red-50 text-red-700 border-red-200/70' },
  cancelled: { label: 'Annulée', dot: 'bg-slate-400', wrap: 'bg-slate-100 text-slate-600 border-slate-200' },
}

export const STOCK_META = {
  ok: { label: 'Disponible', dot: 'bg-emerald-500', wrap: 'bg-emerald-50 text-emerald-700 border-emerald-200/70', bar: 'bg-emerald-500' },
  low: { label: 'Stock faible', dot: 'bg-amber-500', wrap: 'bg-amber-50 text-amber-700 border-amber-200/70', bar: 'bg-amber-500' },
  out: { label: 'Épuisé', dot: 'bg-red-500', wrap: 'bg-red-50 text-red-700 border-red-200/70', bar: 'bg-red-500' },
}

export const CATEGORIES = {
  Informatique: { icon: 'monitor', chip: 'bg-blue-50 text-blue-600', tone: 'text-blue-600' },
  Audiovisuel: { icon: 'video', chip: 'bg-violet-50 text-violet-600', tone: 'text-violet-600' },
  Mobilier: { icon: 'armchair', chip: 'bg-amber-50 text-amber-600', tone: 'text-amber-600' },
  Réseau: { icon: 'network', chip: 'bg-teal-50 text-teal-600', tone: 'text-teal-600' },
}
