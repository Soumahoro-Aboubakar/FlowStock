import React from 'react'
import { useDispatch } from 'react-redux'
import { adminApi } from '../../api/admin.js'
import { materialRemoved, materialRestored, materialSaved, requestSaved, userSaved } from '../../store/dataSlice.js'
import { useToast } from '../../components/ui/Kit.jsx'
import { AppShell, useAppShell } from '../shared/AppShell.jsx'
import { ConfirmModal } from '../shared/ConfirmModal.jsx'
// Section « Paramètres » désactivée (voir PAGES ci-dessous et la navigation dans Sidebar.jsx).
// import { SettingsPage } from '../shared/SettingsPage.jsx'
import { AdminDashboard } from './pages/Dashboard.jsx'
import { AdminRequests } from './pages/Requests.jsx'
import { AdminInventory } from './pages/Inventory.jsx'
import { AdminUsers } from './pages/Users.jsx'
import { MaterialFormModal } from './modals/MaterialFormModal.jsx'
import { InviteModal } from './modals/InviteModal.jsx'
import { RejectModal } from './modals/RejectModal.jsx'

const PAGES = { dashboard: AdminDashboard, requests: AdminRequests, inventory: AdminInventory, users: AdminUsers /* , settings: SettingsPage */ }
const skeletonVariant = (route) => (route === 'dashboard' ? 'dashboard' : route === 'inventory' ? 'cards' : route === 'settings' ? 'settings' : 'list')
const actionLoadingLabel = (busyAction) => busyAction.startsWith('approve:') ? 'Validation de la demande…' : busyAction.startsWith('reopen:') ? "Annulation de l'approbation…" : busyAction.startsWith('reject:') ? 'Enregistrement du refus…' : busyAction.startsWith('material:') ? 'Enregistrement du matériel…' : busyAction.startsWith('delete:') || busyAction.startsWith('restore:') ? 'Mise à jour de l’inventaire…' : busyAction === 'invite' ? 'Envoi de l’invitation…' : busyAction.startsWith('role:') ? 'Mise à jour des droits…' : 'Traitement en cours…'

export default function AdminApp() {
  const toast = useToast()
  const dispatch = useDispatch()
  const shell = useAppShell('admin', adminApi.bootstrap)
  const { requests, materials, users, userById, runAction, setModal, closeModal, modal, busyAction } = shell

  const reopenRequest = (id) => runAction(`reopen:${id}`, async () => {
    const { request, material } = await adminApi.reopenRequest(id)
    dispatch(requestSaved(request))
    if (material) dispatch(materialSaved(material))
    toast.info('Approbation annulée', { description: `${id} est de nouveau en attente.` })
  })
  const approveRequest = (id) => {
    const previous = requests.find((request) => request.id === id)
    if (!previous) return
    return runAction(`approve:${id}`, async () => {
      const { request, material } = await adminApi.approveRequest(id)
      dispatch(requestSaved(request))
      dispatch(materialSaved(material))
      toast.success('Demande approuvée', { description: `${userById(previous.userId).name} a été notifié·e.`, action: { label: 'Annuler', onClick: () => reopenRequest(id) } })
    })
  }
  const rejectRequest = (id, reason) => {
    const previous = requests.find((request) => request.id === id)
    return runAction(`reject:${id}`, async () => {
      const { request } = await adminApi.rejectRequest(id, reason)
      dispatch(requestSaved(request))
      setModal(null)
      toast.warning('Demande refusée', { description: previous ? `${userById(previous.userId).name} verra le motif dans le détail de sa demande.` : '' })
    })
  }
  const saveMaterial = (data, id, options) => runAction(`material:${id || 'new'}`, async () => {
    const { material } = id ? await adminApi.updateMaterial(id, data) : await adminApi.createMaterial(data)
    dispatch(materialSaved(material))
    setModal(null)
    if (id) toast.success('Matériel mis à jour', { description: `${material.name} — ${material.quantity}/${material.total} en stock.` })
    else toast.success('Matériel ajouté', { description: `${material.name} est désormais visible dans le catalogue.` })
  }, options)
  const deleteMaterial = (id) => {
    const index = materials.findIndex((material) => material.id === id)
    const material = materials[index]
    if (!material) return
    return runAction(`delete:${id}`, async () => {
      await adminApi.deleteMaterial(id)
      dispatch(materialRemoved(id))
      setModal(null)
      toast.success('Matériel supprimé', {
        description: `« ${material.name} » a été retiré de l'inventaire.`,
        action: { label: 'Annuler', onClick: () => runAction(`restore:${id}`, async () => { const { material: restored } = await adminApi.restoreMaterial(id); dispatch(materialRestored({ material: restored, index })) }) },
      })
    })
  }
  const inviteUser = (data, options) => runAction('invite', async () => {
    const { user } = await adminApi.inviteUser(data)
    dispatch(userSaved(user))
    setModal(null)
    toast.success('Invitation envoyée', { description: `${user.name} · ${user.email} a reçu un lien pour créer son compte.` })
  }, options)
  const changeUserRole = (id, newRole) => {
    const target = users.find((entry) => entry.id === id)
    if (!target) return
    return runAction(`role:${id}`, async () => {
      const { user } = await adminApi.changeRole(id, newRole)
      dispatch(userSaved(user))
      toast.success(newRole === 'admin' ? 'Droits administrateur accordés' : 'Droits administrateur retirés', { description: `${user.name} est désormais ${newRole === 'admin' ? 'administrateur' : 'utilisateur'}.` })
    })
  }

  const ctx = {
    ...shell,
    approveRequest,
    rejectRequest,
    saveMaterial,
    deleteMaterial,
    inviteUser,
    changeUserRole,
    openRejectModal: (request) => setModal({ type: 'reject', request }),
    openInvite: () => setModal({ type: 'invite' }),
    editMaterial: (material) => setModal({ type: 'material-form', material }),
    askDeleteMaterial: (material) => setModal({ type: 'confirm-delete', material }),
    actions: { rejectRequest, saveMaterial },
  }

  return (
    <AppShell ctx={ctx} pages={PAGES} skeletonVariant={skeletonVariant} actionLoadingLabel={actionLoadingLabel}>
      <MaterialFormModal open={modal?.type === 'material-form'} material={modal?.type === 'material-form' ? modal.material : null} onClose={closeModal} app={ctx} />
      <InviteModal open={modal?.type === 'invite'} onClose={closeModal} app={ctx} />
      <RejectModal open={modal?.type === 'reject'} request={modal?.type === 'reject' ? modal.request : null} onClose={closeModal} app={ctx} />
      {modal?.type === 'confirm-delete' && <ConfirmModal open onClose={closeModal} title="Supprimer ce matériel ?" description={`« ${modal.material.name} » sera retiré de l'inventaire. Les demandes passées resteront consultables dans l'historique.`} confirmLabel="Supprimer" loading={busyAction === `delete:${modal.material.id}`} onConfirm={() => deleteMaterial(modal.material.id)} />}
    </AppShell>
  )
}
