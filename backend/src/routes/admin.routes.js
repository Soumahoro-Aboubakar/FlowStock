import express, { Router } from 'express';
import { archiveMaterial, createMaterial, listMaterials, restoreMaterial, updateMaterial } from '../controllers/admin/materials.controller.js';
import { approveRequest, listRequests, rejectRequest, reopenRequest } from '../controllers/admin/requests.controller.js';
import { discardUpload, uploadImage } from '../controllers/admin/uploads.controller.js';
import { changeRole, inviteUser, listUsers } from '../controllers/admin/users.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_BYTES } from '../services/image-storage.js';
import { changeRoleSchema, idParams, inviteUserSchema, materialSchema, rejectRequestSchema, requestCodeParams } from '../validation/schemas.js';

const router = Router();

// Every route below is reserved to administrators.
router.use(requireAuth, requireRole('admin'));

router.get('/materials', listMaterials);
router.post('/materials', validate(materialSchema), createMaterial);
router.put('/materials/:id', validate(idParams, 'params'), validate(materialSchema), updateMaterial);
router.delete('/materials/:id', validate(idParams, 'params'), archiveMaterial);
router.post('/materials/:id/restore', validate(idParams, 'params'), restoreMaterial);

router.get('/requests', listRequests);
router.post('/requests/:code/approve', validate(requestCodeParams, 'params'), approveRequest);
router.post('/requests/:code/reopen', validate(requestCodeParams, 'params'), reopenRequest);
router.post('/requests/:code/reject', validate(requestCodeParams, 'params'), validate(rejectRequestSchema), rejectRequest);

router.get('/users', listUsers);
router.post('/users/invitations', validate(inviteUserSchema), inviteUser);
router.patch('/users/:id/role', validate(idParams, 'params'), validate(changeRoleSchema), changeRole);

// The file is sent as the raw request body (Content-Type: image/*), which avoids a multipart parser.
router.post('/uploads/:folder', express.raw({ type: ACCEPTED_IMAGE_TYPES, limit: MAX_IMAGE_BYTES }), uploadImage);
router.delete('/uploads/:folder/:fileName', discardUpload);

export default router;
