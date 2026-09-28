import { isValidPublicId, publicUrlFor } from '../services/image-storage.js';

// API payloads keep the shape the frontend already renders (ids as strings, dates as timestamps).

// Uploaded images get their URL from the current storage configuration, so a corrected
// R2_PUBLIC_URL (or a private bucket served via /media) applies to every existing material.
const imageUrl = (image) => (isValidPublicId(image.publicId) ? publicUrlFor(image.publicId) : image.url);

const ms = (date) => (date ? new Date(date).getTime() : null);
const cap = (value) => value.charAt(0).toUpperCase() + value.slice(1);

export function serializeUser(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    team: user.team,
    status: user.status,
    joinedAt: ms(user.createdAt),
    lastLoginAt: ms(user.lastLoginAt),
    joined: cap(new Date(user.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })),
  };
}

export function serializeMaterial(material) {
  return {
    id: String(material._id),
    name: material.name,
    category: material.category,
    description: material.description,
    quantity: material.quantity,
    total: material.total,
    image: material.image ? { url: imageUrl(material.image), publicId: material.image.publicId } : null,
    archived: Boolean(material.archivedAt),
    updatedAt: ms(material.updatedAt),
  };
}

export function serializeRequest(request) {
  return {
    id: request.code,
    userId: String(request.user._id || request.user),
    materialId: String(request.material._id || request.material),
    quantity: request.quantity,
    dateNeeded: ms(request.dateNeeded),
    createdAt: ms(request.createdAt),
    updatedAt: ms(request.updatedAt),
    status: request.status,
    justification: request.justification,
    note: request.note,
    rejectionReason: request.rejectionReason,
    history: request.history.map((entry) => ({ at: ms(entry.at), label: entry.label, kind: entry.kind })),
  };
}
