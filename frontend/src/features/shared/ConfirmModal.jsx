import React from 'react'
import { Button, Modal } from '../../components/ui/Kit.jsx'

export function ConfirmModal({ open, onClose, title, description, confirmLabel, onConfirm, loading = false }) {
  return (
    <Modal open={open} onClose={onClose} title={title} description={description} size="sm" footer={<><Button variant="secondary" disabled={loading} onClick={onClose}>Annuler</Button><Button variant="danger-solid" loading={loading} onClick={onConfirm}>{confirmLabel}</Button></>} />
  )
}
