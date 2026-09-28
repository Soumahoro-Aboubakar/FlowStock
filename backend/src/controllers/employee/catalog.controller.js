import mongoose from 'mongoose';
import { Material } from '../../models/Material.js';
import { Request } from '../../models/Request.js';
import { serializeMaterial } from '../../utils/serializers.js';

// Active catalogue, plus archived materials still referenced by the employee's own requests
// so their history keeps a name and an image.
export async function listCatalog(request, response) {
  const referenced = await Request.distinct('material', { user: request.user._id });
  const materials = await Material.find({ $or: [{ archivedAt: null }, { _id: mongoose.trusted({ $in: referenced }) }] }).sort({ name: 1 });
  response.json({ materials: materials.map(serializeMaterial) });
}
