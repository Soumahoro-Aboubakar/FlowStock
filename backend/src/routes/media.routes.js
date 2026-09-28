import { Router } from 'express';
import { pipeline } from 'node:stream/promises';
import { openImage } from '../services/image-storage.js';
import { notFound } from '../utils/http-error.js';

const router = Router();

// Streams uploaded images (Cloudflare R2 or local disk) for <img> tags. Object names are random
// UUIDs that never change, so responses can be cached for a year.
router.get('/:folder/:fileName', async (request, response) => {
  const image = await openImage(`${request.params.folder}/${request.params.fileName}`);
  if (!image) throw notFound('Image introuvable.');

  if (image.etag && request.get('if-none-match') === image.etag) {
    image.body.destroy?.();
    return response.status(304).end();
  }
  response.set({
    'Content-Type': image.contentType || 'application/octet-stream',
    'Cache-Control': 'public, max-age=31536000, immutable',
    'X-Content-Type-Options': 'nosniff',
    ...(image.contentLength && { 'Content-Length': String(image.contentLength) }),
    ...(image.etag && { ETag: image.etag }),
  });
  await pipeline(image.body, response);
});

export default router;
