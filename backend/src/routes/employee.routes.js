import { Router } from 'express';
import { listCatalog } from '../controllers/employee/catalog.controller.js';
import { cancelMyRequest, createRequest, listMyRequests } from '../controllers/employee/requests.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createRequestSchema, requestCodeParams } from '../validation/schemas.js';

const router = Router();

// Every route below is reserved to employees and only ever touches the current user's data.
router.use(requireAuth, requireRole('employee'));

router.get('/materials', listCatalog);
router.get('/requests', listMyRequests);
router.post('/requests', validate(createRequestSchema), createRequest);
router.post('/requests/:code/cancel', validate(requestCodeParams, 'params'), cancelMyRequest);

export default router;
