import { Material } from '../../models/Material.js';
import { Request, nextRequestCode } from '../../models/Request.js';
import { serializeRequest } from '../../utils/serializers.js';
import { badRequest, conflict, notFound } from '../../utils/http-error.js';

export async function listMyRequests(request, response) {
  const requests = await Request.find({ user: request.user._id }).sort({ createdAt: -1 });
  response.json({ requests: requests.map(serializeRequest) });
}

export async function createRequest(request, response) {
  const { materialId, quantity, dateNeeded, justification, note } = request.body;
  const material = await Material.findOne({ _id: materialId, archivedAt: null });
  if (!material) throw notFound("Ce matériel n'est plus disponible au catalogue.");
  if (quantity > material.quantity) {
    throw badRequest(`Seulement ${material.quantity} unité(s) disponible(s).`, { code: 'INSUFFICIENT_STOCK', details: { fields: { qty: `Seulement ${material.quantity} unité(s) disponible(s).` } } });
  }

  const now = new Date();
  const created = await Request.create({
    code: await nextRequestCode(),
    user: request.user._id,
    material: material._id,
    quantity,
    dateNeeded: new Date(dateNeeded),
    justification,
    note: note || null,
    history: [{ at: now, label: `Demande créée par ${request.user.name}`, kind: 'created' }],
  });
  response.status(201).json({ request: serializeRequest(created) });
}

export async function cancelMyRequest(request, response) {
  const { code } = request.valid.params;
  // The user filter guarantees an employee can only touch their own requests.
  const cancelled = await Request.findOneAndUpdate(
    { code, user: request.user._id, status: 'pending' },
    { $set: { status: 'cancelled' }, $push: { history: { at: new Date(), label: `Annulée par ${request.user.name}`, kind: 'cancelled' } } },
    { new: true },
  );
  if (!cancelled) {
    const exists = await Request.exists({ code, user: request.user._id });
    if (!exists) throw notFound('Cette demande est introuvable.');
    throw conflict('Cette demande a déjà été traitée.', { code: 'ALREADY_PROCESSED' });
  }
  response.json({ request: serializeRequest(cancelled) });
}
