import React from 'react'
import { useDispatch } from 'react-redux'
import { employeeApi } from '../../api/employee.js'
import { requestSaved } from '../../store/dataSlice.js'
import { useToast } from '../../components/ui/Kit.jsx'
import { AppShell, useAppShell } from '../shared/AppShell.jsx'
import { ConfirmModal } from '../shared/ConfirmModal.jsx'
// Section « Paramètres » désactivée (voir PAGES ci-dessous et la navigation dans Sidebar.jsx).
// import { SettingsPage } from '../shared/SettingsPage.jsx'
import { UserCatalog } from './pages/Catalog.jsx'
import { MyRequests } from './pages/MyRequests.jsx'
import { RequestFormModal } from './modals/RequestFormModal.jsx'

const PAGES = { catalog: UserCatalog, requests: MyRequests /* , settings: SettingsPage */ }
const skeletonVariant = (route) => (route === 'catalog' ? 'cards' : route === 'settings' ? 'settings' : 'list')
const actionLoadingLabel = (busyAction) => busyAction.startsWith('cancel:') ? 'Annulation de la demande…' : 'Envoi de la demande…'

export default function EmployeeApp() {
  const toast = useToast()
  const dispatch = useDispatch()
  const shell = useAppShell('employee', employeeApi.bootstrap)
  const { runAction, setModal, closeModal, modal, busyAction, navigate } = shell

  const createRequest = (data, options) => runAction('request:new', async () => {
    const { request } = await employeeApi.createRequest(data)
    dispatch(requestSaved(request))
    setModal(null)
    toast.success('Demande envoyée', { description: `${request.id} — vous serez notifié·e dès qu'un administrateur la traitera.`, action: { label: 'Voir mes demandes', onClick: () => navigate('requests') } })
  }, options)
  const cancelRequest = (id) => runAction(`cancel:${id}`, async () => {
    const { request } = await employeeApi.cancelRequest(id)
    dispatch(requestSaved(request))
    setModal(null)
    toast.info('Demande annulée', { description: `${id} a été marquée comme annulée.` })
  })

  const ctx = {
    ...shell,
    createRequest,
    cancelRequest,
    openRequestForm: (material) => setModal({ type: 'request-form', material }),
    openCancelModal: (request) => setModal({ type: 'confirm-cancel', request }),
    actions: { createRequest },
  }

  return (
    <AppShell ctx={ctx} pages={PAGES} skeletonVariant={skeletonVariant} actionLoadingLabel={actionLoadingLabel}>
      <RequestFormModal open={modal?.type === 'request-form'} preset={modal?.type === 'request-form' ? modal.material : null} onClose={closeModal} app={ctx} />
      {modal?.type === 'confirm-cancel' && <ConfirmModal open onClose={closeModal} title="Annuler cette demande ?" description={`La demande ${modal.request.id} sera marquée comme annulée. Cette action est définitive.`} confirmLabel="Oui, annuler" loading={busyAction === `cancel:${modal.request.id}`} onConfirm={() => cancelRequest(modal.request.id)} />}
    </AppShell>
  )
}
