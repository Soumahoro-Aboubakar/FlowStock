import { assertEnv, env, r2Configured, r2PublicBase, r2PublicUrlRejected } from './config/env.js';
import { createApp } from './app.js';
import { connectDatabase } from './config/database.js';
import { Material } from './models/Material.js';
import { syncStoredImageUrls } from './services/image-storage.js';
import { verifyMailer } from './services/mailer.js';

function describeStorage() {
  if (!r2Configured) return 'local disk, served on /media (R2 not configured)';
  return r2PublicBase ? `Cloudflare R2 (${env.r2.bucket}), public URL ${r2PublicBase}` : `Cloudflare R2 (${env.r2.bucket}), served by the API on /media`;
}

try {
  assertEnv();
  await connectDatabase(env.mongodbUri);
  if (r2PublicUrlRejected) {
    console.warn(`R2_PUBLIC_URL (${env.r2.publicUrl}) is the private S3 API endpoint and cannot be used by browsers. `
      + 'Images are served through /media instead; set R2_PUBLIC_URL to the bucket r2.dev URL or a custom domain to serve them from Cloudflare directly.');
  }
  const fixed = await syncStoredImageUrls(Material);
  if (fixed) console.info(`Updated the stored URL of ${fixed} image(s) to match the storage configuration.`);
  createApp().listen(env.port, () => {
    console.info(`Flowstock API listening on port ${env.port}.`);
    console.info(`Image storage: ${describeStorage()}.`);
  });
  await verifyMailer();
} catch (error) {
  console.error('Failed to start Flowstock API:', error.message);
  process.exit(1);
}
