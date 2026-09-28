import mongoose from 'mongoose';
import { Material } from '../../models/Material.js';
import { Request } from '../../models/Request.js';
import { serializeMaterial, serializeRequest } from '../../utils/serializers.js';
import { conflict, notFound } from '../../utils/http-error.js';

export async function listRequests(_request, response) {
  const requests = await Request.find().sort({ createdAt: -1 });
  response.json({ requests: requests.map(serializeRequest) });
}

async function findPending(code) {
  const request = await Request.findOne({ code });
  if (!request) throw notFound('Cette demande est introuvable.');
  if (request.status !== 'pending') throw conflict('Cette demande a déjà été traitée.', { code: 'ALREADY_PROCESSED' });
  return request;
}

export async function approveRequest(request, response) {
  const { code } = request.valid.params;
  const pending = await findPending(code);

  // Stock is only taken if enough units remain, in a single atomic update.
  // trusted(): server-built operator, exempt from the global sanitizeFilter.
  const material = await Material.findOneAndUpdate(
    { _id: pending.material, archivedAt: null, quantity: mongoose.trusted({ $gte: pending.quantity }) },
    { $inc: { quantity: -pending.quantity } },
    { new: true },
  );
  if (!material) throw conflict('Stock insuffisant pour approuver cette demande.', { code: 'INSUFFICIENT_STOCK' });

  const now = new Date();
  const approved = await Request.findOneAndUpdate(
    { code, status: 'pending' },
    { $set: { status: 'approved' }, $push: { history: { at: now, label: `Approuvée par ${request.user.name}`, kind: 'approved' } } },
    { new: true },
  );
  if (!approved) {
    // Someone processed it concurrently: give the stock back.
    const restored = await Material.findByIdAndUpdate(material._id, { $inc: { quantity: pending.quantity } }, { new: true });
    throw conflict('Cette demande a déjà été traitée.', { code: 'ALREADY_PROCESSED', details: { material: serializeMaterial(restored) } });
  }
  response.json({ request: serializeRequest(approved), material: serializeMaterial(material) });
}

// Undo of an approval (the "Annuler" action of the confirmation toast).
export async function reopenRequest(request, response) {
  const { code } = request.valid.params;
  const current = await Request.findOne({ code, status: 'approved' });
  if (!current) throw conflict('Cette approbation ne peut plus être annulée.', { code: 'NOT_APPROVED' });

  const lastApproval = current.history.map((entry) => entry.kind).lastIndexOf('approved');
  const history = current.history.filter((_entry, index) => index !== lastApproval);
  const reopened = await Request.findOneAndUpdate({ code, status: 'approved' }, { $set: { status: 'pending', history } }, { new: true });
  if (!reopened) throw conflict('Cette approbation ne peut plus être annulée.', { code: 'NOT_APPROVED' });

  const material = await Material.findByIdAndUpdate(current.material, { $inc: { quantity: current.quantity } }, { new: true });
  response.json({ request: serializeRequest(reopened), material: material ? serializeMaterial(material) : null });
}

export async function rejectRequest(request, response) {
  const { code } = request.valid.params;
  await findPending(code);
  const rejected = await Request.findOneAndUpdate(
    { code, status: 'pending' },
    { $set: { status: 'rejected', rejectionReason: request.body.reason }, $push: { history: { at: new Date(), label: `Refusée par ${request.user.name}`, kind: 'rejected' } } },
    { new: true },
  );
  if (!rejected) throw conflict('Cette demande a déjà été traitée.', { code: 'ALREADY_PROCESSED' });
  response.json({ request: serializeRequest(rejected) });
}
