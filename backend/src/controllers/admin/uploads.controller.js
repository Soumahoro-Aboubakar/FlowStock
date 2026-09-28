import { Material } from '../../models/Material.js';
import { deleteImage, isValidPublicId, saveImage } from '../../services/image-storage.js';
import { HttpError, badRequest, conflict } from '../../utils/http-error.js';

export async function uploadImage(request, response) {
  if (!Buffer.isBuffer(request.body)) {
    throw new HttpError(415, 'Format non pris en charge — utilisez une image JPG, PNG ou WebP.', { code: 'UNSUPPORTED_MEDIA' });
  }
  const image = await saveImage(request.params.folder, request.body);
  response.status(201).json(image);
}

// Removes an uploaded image that ended up unused (e.g. the material could not be saved).
export async function discardUpload(request, response) {
  const publicId = `${request.params.folder}/${request.params.fileName}`;
  if (!isValidPublicId(publicId)) throw badRequest("Identifiant d'image invalide.");
  if (await Material.exists({ 'image.publicId': publicId })) throw conflict('Cette image est utilisée par un matériel.');
  await deleteImage(publicId);
  response.status(204).end();
}
