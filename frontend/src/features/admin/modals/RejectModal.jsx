import React, { useEffect, useState } from 'react'
import { Button, Textarea, Field, Modal } from '../../../components/ui/Kit.jsx'

export function RejectModal({ open, request, onClose, app }) {
  const { actions, matById, userById, busyAction } = app
  const [reason, setReason] = useState('')
  const [error, setError] = useState(null)
  useEffect(() => { if (open) { setReason(''); setError(null) } }, [open])
  const user = request ? userById(request.userId) : null
  const mat = request ? matById(request.materialId) : null
  const submit = () => {
    if (reason.trim().length < 4) { setError("Merci d'indiquer un motif clair (4 caractères minimum).") ; return }
    actions.rejectRequest(request.id, reason.trim())
  }
  return (
    <Modal open={open} onClose={onClose} title="Refuser la demande" size="md" description={request ? `${request.id} — ${mat ? mat.name : ''} ×${request.quantity} · ${user.name}` : ''} footer={<><Button variant="secondary" disabled={!!busyAction} onClick={onClose}>Annuler</Button><Button variant="danger-solid" icon="x" loading={busyAction === `reject:${request?.id}`} loadingLabel="Refus en cours" onClick={submit}>Confirmer le refus</Button></>}>
      <Field label="Motif du refus" required error={error} hint="Le demandeur verra ce motif dans le détail de sa demande.">
        <Textarea rows={3} value={reason} autoFocus onChange={(event) => setReason(event.target.value)} placeholder="Ex. : stock insuffisant, priorité à un autre service, budget épuisé…" />
      </Field>
    </Modal>
  )
}
