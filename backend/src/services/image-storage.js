import { randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, stat, unlink, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import mongoose from 'mongoose';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { env, r2Configured, r2PublicBase } from '../config/env.js';
import { HttpError } from '../utils/http-error.js';

export const UPLOAD_ROOT = fileURLToPath(new URL('../../uploads/', import.meta.url));
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const EXTENSIONS = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const FOLDERS = new Set(['materials']);
const PUBLIC_ID = /^materials\/[0-9a-f-]{36}\.(jpg|png|webp)$/;

let client = null;
function r2() {
  if (!client) {
    client = new S3Client({
      region: 'auto',
      endpoint: env.r2.endpoint || `https://${env.r2.accountId}.r2.cloudflarestorage.com`,
      forcePathStyle: Boolean(env.r2.endpoint),
      credentials: { accessKeyId: env.r2.accessKeyId, secretAccessKey: env.r2.secretAccessKey },
    });
  }
  return client;
}

// The declared Content-Type is client-controlled, so the real format is read from the file signature.
function sniffImageType(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return null;
}

export const storageDriver = () => (r2Configured ? 'cloudflare-r2' : 'local');

// Public URL of a stored image. R2 objects go straight to the public bucket domain when one is
// configured; otherwise (private bucket, or local disk) they are served by the API under /media.
export const publicUrlFor = (publicId) => (r2PublicBase ? `${r2PublicBase}/${publicId}` : `/media/${publicId}`);

export async function saveImage(folder, buffer) {
  if (!FOLDERS.has(folder)) throw new HttpError(404, 'Dossier de stockage inconnu.');
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) throw new HttpError(400, 'Aucune image reçue.');

  const type = sniffImageType(buffer);
  if (!type) throw new HttpError(415, 'Format non pris en charge — utilisez une image JPG, PNG ou WebP.', { code: 'UNSUPPORTED_MEDIA' });

  const publicId = `${folder}/${randomUUID()}.${EXTENSIONS[type]}`;

  if (r2Configured) {
    await r2().send(new PutObjectCommand({
      Bucket: env.r2.bucket,
      Key: publicId,
      Body: buffer,
      ContentType: type,
      CacheControl: 'public, max-age=31536000, immutable',
    }));
    return { url: publicUrlFor(publicId), publicId };
  }

  await mkdir(path.join(UPLOAD_ROOT, folder), { recursive: true });
  await writeFile(path.join(UPLOAD_ROOT, publicId), buffer, { flag: 'wx' });
  return { url: publicUrlFor(publicId), publicId };
}

export async function deleteImage(publicId) {
  // Bundled demo images have no publicId; anything else must match the exact generated shape.
  if (!publicId || !PUBLIC_ID.test(publicId)) return;

  if (r2Configured) {
    await r2().send(new DeleteObjectCommand({ Bucket: env.r2.bucket, Key: publicId }));
    return;
  }
  try {
    await unlink(path.join(UPLOAD_ROOT, publicId));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

export const isValidPublicId = (publicId) => typeof publicId === 'string' && PUBLIC_ID.test(publicId);

// The stored URL is always rebuilt server-side, so clients can never inject an arbitrary image URL.
export function imageFromPublicId(publicId) {
  if (!isValidPublicId(publicId)) throw new HttpError(400, "Identifiant d'image invalide.");
  return { url: publicUrlFor(publicId), publicId };
}

// Opens a stored image for the /media route: { body (stream), contentType, contentLength, etag } or null.
export async function openImage(publicId) {
  if (!isValidPublicId(publicId)) return null;

  if (r2Configured) {
    try {
      const object = await r2().send(new GetObjectCommand({ Bucket: env.r2.bucket, Key: publicId }));
      return { body: object.Body, contentType: object.ContentType, contentLength: object.ContentLength, etag: object.ETag };
    } catch (error) {
      if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) return null;
      throw error;
    }
  }

  const filePath = path.join(UPLOAD_ROOT, publicId);
  try {
    const info = await stat(filePath);
    const extension = path.extname(publicId).slice(1);
    const contentType = Object.entries(EXTENSIONS).find(([, ext]) => ext === extension)?.[0];
    return { body: createReadStream(filePath), contentType, contentLength: info.size, etag: `"${info.size.toString(16)}-${info.mtimeMs.toString(16)}"` };
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

// Rewrites stored URLs of uploaded images that no longer match the storage configuration
// (e.g. saved while R2_PUBLIC_URL pointed at the private S3 endpoint). Demo images are untouched.
export async function syncStoredImageUrls(Material) {
  const materials = await Material.find({ 'image.publicId': mongoose.trusted({ $type: 'string' }) }, { image: 1 }).lean();
  const updates = materials
    .filter((material) => isValidPublicId(material.image.publicId) && material.image.url !== publicUrlFor(material.image.publicId))
    .map((material) => ({ updateOne: { filter: { _id: material._id }, update: { $set: { 'image.url': publicUrlFor(material.image.publicId) } }, timestamps: false } }));
  if (updates.length) await Material.bulkWrite(updates);
  return updates.length;
}
