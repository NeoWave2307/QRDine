/**
 * server/controllers/menuController.js
 * Handles retrieval of the active menu from the authoritative config.
 */

import { buildMenuPayload } from '../config/menuData.js';

export function getMenu(req, res) {
  try {
    res.json(buildMenuPayload());
  } catch (err) {
    console.error('[menuController] getMenu error:', err);
    res.status(500).json({ success: false, error: 'Failed to load menu' });
  }
}