/**
 * server/controllers/orderController.js
 * Order creation, price recalculation, QR generation, and simulated payment.
 *
 * Prices are ALWAYS recalculated server-side from config/menuData.js.
 * The client-supplied totals are ignored entirely.
 */

import QRCode from 'qrcode';
import { menuById } from '../config/menuData.js';
import { createOrder, getOrder, markPaid, ORDER_STATUS } from '../store/orderStore.js';
import { generateVerificationHash } from '../utils/hashGenerator.js';

const VALID_QTY = { min: 1, max: 50 };

function error(res, status, message) {
  res.status(status).json({ success: false, error: message });
}

/**
 * POST /api/order/create
 * Body: { items: [{ id: string, qty: number }] }
 */
export async function createOrderHandler(req, res) {
  try {
    const { items } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      return error(res, 400, 'Order must contain at least one item');
    }

    // Validate each line item against the authoritative menu.
    const normalized = [];
    for (const raw of items) {
      if (!raw || typeof raw !== 'object') {
        return error(res, 400, 'Invalid item entry in order');
      }
      const id = String(raw.id || '').trim();
      const qty = Number(raw.qty);

      if (!id) return error(res, 400, 'Missing item id');
      if (!Number.isInteger(qty) || qty < VALID_QTY.min || qty > VALID_QTY.max) {
        return error(res, 400, `Invalid quantity for ${id}. Must be between ${VALID_QTY.min} and ${VALID_QTY.max}`);
      }

      const MenuItem = menuById[id];
      if (!MenuItem) return error(res, 400, `Unknown item id: ${id}`);
      if (!MenuItem.available) return error(res, 400, `Item not available: ${MenuItem.name}`);

      normalized.push({
        id: MenuItem.id,
        name: MenuItem.name,
        unitPrice: MenuItem.price,
        qty
      });
    }

    // Server-side price recalculation. Client totals are ignored.
    const totalAmount = normalized.reduce((sum, it) => sum + it.unitPrice * it.qty, 0);

    const order = createOrder(normalized);

    // Generate a QR code Data URL the student can scan (simulated payment).
    const qrDataUrl = await QRCode.toDataURL(
      `QRDINE|orderId=${order.orderId}|amount=${order.totalAmount}`,
      { errorCorrectionLevel: 'M', margin: 1, width: 256 }
    );

    res.json({
      success: true,
      orderId: order.orderId,
      totalAmount: order.totalAmount,
      qrDataUrl
    });
  } catch (err) {
    console.error('[orderController] createOrder error:', err);
    error(res, 500, 'Failed to create order');
  }
}

/**
 * POST /api/order/pay
 * Body: { orderId: string }
 */
export async function payOrderHandler(req, res) {
  try {
    const { orderId } = req.body || {};
    if (!orderId || typeof orderId !== 'string') {
      return error(res, 400, 'orderId is required');
    }

    const order = getOrder(orderId.trim());
    if (!order) {
      return error(res, 404, 'Unknown order id');
    }
    if (order.status !== ORDER_STATUS.PENDING_PAYMENT) {
      if (order.status === ORDER_STATUS.PAID) {
        return error(res, 400, 'Order already processed');
      }
      return error(res, 400, 'Order cannot be paid in current state');
    }

    const paidAt = Date.now();
    const verificationHash = generateVerificationHash({
      orderId: order.orderId,
      amount: order.totalAmount,
      timestamp: paidAt,
      secret: process.env.HASH_SECRET
    });

    const updated = markPaid(orderId, { verificationHash, paidAt });
    if (!updated) {
      // Race: another concurrent request won the transition.
      return error(res, 409, 'Order already processed');
    }

    const io = req.io;
    if (io) {
      const payload = {
        orderId: updated.orderId,
        verificationHash: updated.verificationHash,
        items: updated.items.map(it => ({ id: it.id, name: it.name, qty: it.qty })),
        totalAmount: updated.totalAmount,
        paidAt: updated.paidAt
      };

      // Student private room.
      io.to(`order_${updated.orderId}`).emit('payment_verified', payload);

      // Vendor KDS room.
      io.to('vendor_main').emit('new_order_alert', payload);
    }

    res.json({ success: true, verificationHash: updated.verificationHash });
  } catch (err) {
    console.error('[orderController] payOrder error:', err);
    error(res, 500, 'Payment processing failed');
  }
}