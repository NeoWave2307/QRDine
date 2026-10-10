/**
 * server/routes/menuRoutes.js
 * GET /api/menu — returns the authoritative active menu.
 */

import express from 'express';
import { getMenu } from '../controllers/menuController.js';

const router = express.Router();

router.get('/', getMenu);

export default router;