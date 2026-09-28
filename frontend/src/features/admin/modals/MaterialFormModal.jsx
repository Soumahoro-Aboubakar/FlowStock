import React, { useEffect, useRef, useState } from 'react'
import { Button, Input, Select, Field, StockBadge, ImageDropzone, Modal, useToast } from '../../../components/ui/Kit.jsx'
import { validateImageFile, readImageDimensions, uploadMaterialImage, discardUploadedImage, fmtFileSize } from '../../../services/materialImages.js'

export function MaterialFormModal({ open, material, onClose, app }) {
  const { actions, busyAction } = app
  const toast = useToast()
  const editing = !!material
  const currentImage = material && material.image ? material.image : null
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Informatique')
  const [desc, setDesc] = useState('')
  const [total, setTotal] = useState('10')
  const [qty, setQty] = useState('10')
  const [errors, setErrors] = useState({})
  const [picked, setPicked] = useState(null)
  const [imageError, setImageError] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const uploadAbort = useRef(null)
  useEffect(() => {
    if (open) {
      setName(material ? material.name : '')
      setCategory(material ? material.category : 'Informatique')
      setDesc(material ? material.description : '')
      setTotal(material ? String(material.total) : '10')
      setQty(material ? String(material.quantity) : '10')
      setErrors({})
      setPicked(null)
      setImageError(null)
      setProgress(0)
    } else if (uploadAbort.current) {
      uploadAbort.current.abort()
    }
  }, [open, material])
  useEffect(() => () => { if (picked) URL.revokeObjectURL(picked.url) }, [picked])
  const level = (() => {
    const t = parseInt(total, 10) || 0; const q = parseInt(qty, 10) || 0; return q <= 0 ? 'out' : q <= Math.ceil(t * 0.25) ? 'low' : 'ok'
  })()
  const pickImage = async (file) => {
    setErrors((previous) => ({ ...previous, image: undefined }))
    const problem = validateImageFile(file)
    if (problem) { setImageError(problem); return }
    const url = URL.createObjectURL(file)
    try {
      const { width, height } = await readImageDimensions(url)
      setPicked({ file, url, width, height })
      setImageError(null)
    } catch {
      URL.revokeObjectURL(url)
      setImageError('Image illisible ou corrompue — choisissez un autre fichier.')
    }
  }
  const submit = async () => {
    if (uploading) return
    const errs = {}
    if (!editing && !picked) errs.image = 'Ajoutez une image : elle est obligatoire pour une nouvelle référence.'
    if (name.trim().length < 3) errs.name = 'Indiquez le nom du matériel (3 caractères minimum).'
    const t = parseInt(total, 10); const q = parseInt(qty, 10)
    if (!t || t < 1) errs.total = 'Quantité totale invalide.'
    if (isNaN(q) || q < 0) errs.qty = 'Quantité disponible invalide.'
    else if (!isNaN(t) && q > t) errs.qty = 'La quantité disponible ne peut pas dépasser le total.'
    setErrors(errs)
    if (Object.keys(errs).length) return
    let image = currentImage
    if (picked) {
      const controller = new AbortController()
      uploadAbort.current = controller
      setUploading(true); setProgress(0); setImageError(null)
      try {
        image = await uploadMaterialImage(picked.file, { onProgress: setProgress, signal: controller.signal })
      } catch (error) {
        if (!error.aborted) { setImageError(error.message); toast.error("L'image n'a pas pu être envoyée", { description: error.message }) }
        return
      } finally {
        uploadAbort.current = null
        setUploading(false)
      }
    }
    const saved = await actions.saveMaterial({ name: name.trim(), category, description: desc.trim(), total: t, quantity: q, ...(picked && { imagePublicId: image.publicId }) }, editing ? material.id : null, {
      onFieldErrors: (fields) => {
        setErrors({ name: fields.name, total: fields.total, qty: fields.quantity, image: fields.image })
        if (fields.image || fields.imagePublicId) setImageError(fields.image || fields.imagePublicId)
      },
    })
    // The previous image is removed by the API; only an upload that ended up unused is discarded here.
    if (picked && !saved) discardUploadedImage(image)
  }
  const imageHint = !editing ? "Obligatoire — elle illustre le matériel dans l'inventaire et le catalogue." : currentImage ? "Sans nouvelle image, l'image actuelle est conservée." : 'Aucune image associée pour le moment — ajoutez-en une pour illustrer le catalogue.'
  return (
    <Modal open={open} onClose={onClose} size="lg" title={editing ? 'Modifier le matériel' : 'Ajouter un matériel'} description={editing ? 'Les demandes existantes restent associées à cette référence.' : 'La référence sera immédiatement visible dans le catalogue des collaborateurs.'} footer={<><Button variant="secondary" disabled={!!busyAction} onClick={onClose}>Annuler</Button><Button variant="primary" icon={editing ? 'check' : 'plus'} loading={uploading || busyAction === `material:${material?.id || 'new'}`} loadingLabel={uploading ? "Téléversement de l'image" : 'Enregistrement'} onClick={submit}>{editing ? 'Enregistrer les modifications' : 'Ajouter le matériel'}</Button></>}>
      <div className="space-y-4">
        <Field label="Image du matériel" required={!editing} error={imageError || errors.image} hint={imageHint}>
          <ImageDropzone
            previewUrl={picked ? picked.url : currentImage ? currentImage.url : null}
            badge={picked ? (currentImage ? 'Nouvelle image' : 'Aperçu') : 'Image actuelle'}
            fileInfo={picked ? { name: picked.file.name, meta: `${picked.width} × ${picked.height} px · ${fmtFileSize(picked.file.size)}` } : null}
            onSelect={pickImage}
            onClear={picked ? () => { setPicked(null); setImageError(null) } : undefined}
            clearLabel={currentImage ? 'Rétablir' : 'Retirer'}
            clearIcon={currentImage ? 'rotate-ccw' : 'x'}
            error={imageError || errors.image}
            uploading={uploading}
            progress={progress}
            disabled={!!busyAction}
          />
        </Field>
        <Field label="Nom" required error={errors.name}><Input value={name} autoFocus onChange={(e) => setName(e.target.value)} placeholder="Ex. : Écran 27″ 4K" /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Catégorie"><Select value={category} onChange={(e) => setCategory(e.target.value)}>{Object.keys({ Informatique: true, Audiovisuel: true, Mobilier: true, Réseau: true }).map((cat) => <option key={cat} value={cat}>{cat}</option>)}</Select></Field>
          <Field label="Description courte" hint="Affichée dans le catalogue."><Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Ex. : 4K, USB-C, pied réglable" /></Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Quantité totale" required error={errors.total}><Input type="number" min="0" value={total} onChange={(e) => setTotal(e.target.value)} className="tnum" /></Field>
          <Field label="Disponible" required error={errors.qty}><Input type="number" min="0" value={qty} onChange={(e) => setQty(e.target.value)} className="tnum" /></Field>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"><span className="text-[13px] font-medium text-slate-500">Statut résultant</span><StockBadge level={level} size="sm" /></div>
      </div>
    </Modal>
  )
}
