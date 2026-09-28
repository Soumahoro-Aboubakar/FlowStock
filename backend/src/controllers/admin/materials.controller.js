import { Material } from '../../models/Material.js';
import { deleteImage, imageFromPublicId } from '../../services/image-storage.js';
import { serializeMaterial } from '../../utils/serializers.js';
import { badRequest, notFound } from '../../utils/http-error.js';

const discardImage = (image) => {
  if (image?.publicId) deleteImage(image.publicId).catch((error) => console.error('Image cleanup failed:', error.message));
};

export async function listMaterials(_request, response) {
  const materials = await Material.find({ archivedAt: null }).sort({ updatedAt: -1 });
  response.json({ materials: materials.map(serializeMaterial) });
}

export async function createMaterial(request, response) {
  const { imagePublicId, ...fields } = request.body;
  if (!imagePublicId) throw badRequest('Ajoutez une image : elle est obligatoire pour une nouvelle référence.', { code: 'VALIDATION_ERROR', details: { fields: { image: 'Image obligatoire.' } } });
  const material = await Material.create({ ...fields, description: fields.description || 'Aucune description.', image: imageFromPublicId(imagePublicId) });
  response.status(201).json({ material: serializeMaterial(material) });
}

export async function updateMaterial(request, response) {
  const material = await Material.findOne({ _id: request.valid.params.id, archivedAt: null });
  if (!material) throw notFound('Ce matériel n’existe plus.');

  const { imagePublicId, ...fields } = request.body;
  const previousImage = material.image;
  const replacingImage = imagePublicId && imagePublicId !== previousImage?.publicId;

  Object.assign(material, fields, { description: fields.description || 'Aucune description.' });
  if (replacingImage) material.image = imageFromPublicId(imagePublicId);
  await material.save();

  if (replacingImage) discardImage(previousImage);
  response.json({ material: serializeMaterial(material) });
}

export async function archiveMaterial(request, response) {
  const material = await Material.findOneAndUpdate({ _id: request.valid.params.id, archivedAt: null }, { archivedAt: new Date() });
  if (!material) throw notFound('Ce matériel n’existe plus.');
  response.status(204).end();
}

export async function restoreMaterial(request, response) {
  const material = await Material.findOneAndUpdate({ _id: request.valid.params.id }, { archivedAt: null }, { new: true });
  if (!material) throw notFound('Ce matériel n’existe plus.');
  response.json({ material: serializeMaterial(material) });
}
