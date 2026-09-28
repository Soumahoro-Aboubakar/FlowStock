export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024

export const fmtFileSize = (bytes) =>
  bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Mo` : `${Math.max(1, Math.round(bytes / 1024))} Ko`

export function validateImageFile(file) {
  if (!file) return 'Aucun fichier sélectionné.'
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return 'Format non pris en charge — utilisez une image JPG, PNG ou WebP.'
  if (file.size > MAX_IMAGE_BYTES) return `Image trop lourde (${fmtFileSize(file.size)}) — la taille maximale est de ${fmtFileSize(MAX_IMAGE_BYTES)}.`
  return null
}

// Resolves when the browser can actually decode the file, so corrupt files are caught before upload.
export function readImageDimensions(url) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight })
    image.onerror = () => reject(new Error('unreadable'))
    image.src = url
  })
}

const UPLOAD_ERRORS = {
  0: "Serveur d'images injoignable. Vérifiez que l'API est démarrée, puis réessayez.",
  401: 'Votre session a expiré. Reconnectez-vous puis réessayez.',
  403: "Seuls les administrateurs peuvent ajouter des images.",
  413: `Image trop lourde — la taille maximale est de ${fmtFileSize(MAX_IMAGE_BYTES)}.`,
  415: 'Format non pris en charge — utilisez une image JPG, PNG ou WebP.',
}

export function uploadMaterialImage(file, { onProgress, signal } = {}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const fail = (status) => reject(Object.assign(new Error(UPLOAD_ERRORS[status] || "Le téléversement de l'image a échoué. Réessayez dans un instant."), { status }))
    xhr.open('POST', '/api/admin/uploads/materials')
    xhr.setRequestHeader('Content-Type', file.type)
    xhr.responseType = 'json'
    xhr.upload.onprogress = (event) => { if (event.lengthComputable && onProgress) onProgress(Math.round((event.loaded / event.total) * 100)) }
    xhr.onload = () => {
      const body = xhr.response
      if (xhr.status === 201 && body && body.url) resolve({ url: body.url, publicId: body.publicId })
      else fail(xhr.status)
    }
    xhr.onerror = () => fail(0)
    xhr.onabort = () => reject(Object.assign(new Error('Téléversement annulé.'), { aborted: true }))
    if (signal) signal.addEventListener('abort', () => xhr.abort(), { once: true })
    xhr.send(file)
  })
}

// Removes an upload that ended up unused (the material could not be saved). The API refuses
// to delete an image still referenced by a material; replaced images are cleaned up server-side.
export function discardUploadedImage(image) {
  if (!image || !image.publicId) return Promise.resolve()
  return fetch(`/api/admin/uploads/${image.publicId}`, { method: 'DELETE', credentials: 'same-origin' }).catch(() => {})
}
