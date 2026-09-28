import React, { useEffect, useMemo, useState } from 'react'
import { ahead, toDateInput, fromDateInput } from '../../../utils/dates.js'
import { Icon } from '../../../components/ui/icons.jsx'
import { Button, Input, Textarea, Select, Field, MaterialThumb, Modal } from '../../../components/ui/Kit.jsx'

export function RequestFormModal({ open, preset, onClose, app }) {
  const { materials, actions, busyAction } = app
  const [materialId, setMaterialId] = useState('')
  const [qty, setQty] = useState(1)
  const [date, setDate] = useState('')
  const [just, setJust] = useState('')
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState({})
  useEffect(() => {
    if (open) {
      setMaterialId(preset ? preset.id : '')
      setQty(1)
      setDate(toDateInput(ahead(3)))
      setJust('')
      setNote('')
      setErrors({})
    }
  }, [open, preset])
  const selected = materials.find((item) => item.id === materialId)
  const byCat = useMemo(() => {
    const available = materials.filter((item) => item.quantity > 0 && !item.archived)
    return Object.keys({ Informatique: true, Audiovisuel: true, Mobilier: true, Réseau: true }).map((category) => ({ category, items: available.filter((item) => item.category === category) })).filter((group) => group.items.length)
  }, [materials])
  const submit = () => {
    const errs = {}
    if (!selected) errs.material = 'Sélectionnez un matériel.'
    if (!qty || qty < 1) errs.qty = 'Quantité invalide.'
    else if (selected && qty > selected.quantity) errs.qty = `Seulement ${selected.quantity} unité(s) disponible(s).`
    if (!date) errs.date = 'Choisissez une date.'
    if (just.trim().length < 8) errs.just = 'Décrivez brièvement le besoin (8 caractères minimum).'
    setErrors(errs)
    if (Object.keys(errs).length) return
    actions.createRequest({ materialId: selected.id, quantity: qty, dateNeeded: fromDateInput(date), justification: just.trim(), note: note.trim() || null }, { onFieldErrors: (fields) => setErrors({ material: fields.materialId, qty: fields.qty || fields.quantity, date: fields.dateNeeded, just: fields.justification }) })
  }
  return (
    <Modal open={open} onClose={onClose} title="Nouvelle demande" size="lg" description="Votre demande sera transmise à l'équipe administrative, qui la traitera sous 48 h ouvrées." footer={<><Button variant="secondary" disabled={!!busyAction} onClick={onClose}>Annuler</Button><Button variant="primary" icon="send" loading={busyAction === 'request:new'} loadingLabel="Envoi de la demande" onClick={submit}>Envoyer la demande</Button></>}>
      <div className="space-y-4">
        {preset ? (
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
            <MaterialThumb material={preset} size={52} className="rounded-xl" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{preset.name}</p>
              <p className="text-xs text-slate-500">{preset.category} · {preset.quantity} disponibles</p>
            </div>
          </div>
        ) : (
          <Field label="Matériel" required error={errors.material}><Select value={materialId} onChange={(event) => setMaterialId(event.target.value)}><option value="" disabled>Sélectionnez un matériel…</option>{byCat.map((group) => <optgroup key={group.category} label={group.category}>{group.items.map((material) => <option key={material.id} value={material.id}>{material.name} — {material.quantity} en stock</option>)}</optgroup>)}</Select></Field>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Quantité" required error={errors.qty} hint={selected ? `${selected.quantity} en stock` : undefined}>
            <div className="flex items-center gap-2">
              <button type="button" aria-label="Diminuer" disabled={qty <= 1} onClick={() => setQty((value) => Math.max(1, value - 1))} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:text-slate-800 disabled:opacity-40 disabled:pointer-events-none"><Icon name="minus" size={17} /></button>
              <input type="number" min="1" max={selected ? selected.quantity : undefined} value={qty} onChange={(event) => setQty(Math.max(1, parseInt(event.target.value, 10) || 1))} className="tnum h-10 w-16 rounded-lg border border-slate-200 text-center text-sm font-semibold outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10" />
              <button type="button" aria-label="Augmenter" disabled={selected && qty >= selected.quantity} onClick={() => setQty((value) => selected ? Math.min(selected.quantity, value + 1) : value + 1)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:text-slate-800 disabled:opacity-40 disabled:pointer-events-none"><Icon name="plus" size={17} /></button>
            </div>
          </Field>
          <Field label="Date souhaitée" required error={errors.date}><Input type="date" min={toDateInput(Date.now())} value={date} onChange={(event) => setDate(event.target.value)} className="tnum" /></Field>
        </div>
        <Field label="Justification" required error={errors.just} hint="Aide l'administrateur à prioriser les demandes."><Textarea rows={3} value={just} onChange={(event) => setJust(event.target.value)} placeholder="Expliquez brièvement le besoin…" /></Field>
        <Field label="Commentaire pour l'équipe" hint="Optionnel."><Input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Précisions logistiques, contraintes de date…" /></Field>
      </div>
    </Modal>
  )
}
