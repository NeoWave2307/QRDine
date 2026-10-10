import { createApp } from '../server.js';
import request from 'supertest';
import { __resetStore, __storeSize } from '../store/orderStore.js';

const VALID_ITEM = 'm1'; // Cold Coffee, available, 50 INR
const VALID_ITEM_2 = 'm2'; // Masala Dosa, available, 80 INR

beforeEach(() => __resetStore());

async function createOrder(app, items = [{ id: VALID_ITEM, qty: 2 }]) {
  return request(app).post('/api/order/create').send({ items });
}

describe('POST /api/order/create', () => {
  let app;
  beforeEach(() => {
    app = createApp().app;
  });

  it('creates an order and returns orderId, totalAmount, and qrDataUrl', async () => {
    const res = await createOrder(app);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.orderId).toBe('string');
    expect(res.body.orderId.startsWith('ORD_')).toBe(true);
    expect(res.body.totalAmount).toBe(100); // 2 x 50
    expect(typeof res.body.qrDataUrl).toBe('string');
    expect(res.body.qrDataUrl.startsWith('data:image/png;base64,')).toBe(true);
    expect(__storeSize()).toBe(1);
  });

  it('recalculates the total server-side, ignoring any client-supplied total', async () => {
    const res = await request(app)
      .post('/api/order/create')
      .send({ items: [{ id: VALID_ITEM, qty: 3 }], totalAmount: 99999 });
    expect(res.body.totalAmount).toBe(150); // 3 x 50
  });

  it('supports multiple items and quantities', async () => {
    const res = await createOrder(app, [
      { id: VALID_ITEM, qty: 2 },   // 100
      { id: VALID_ITEM_2, qty: 1 }  // 80
    ]);
    expect(res.body.totalAmount).toBe(180);
  });

  it('rejects an empty order', async () => {
    const res = await request(app).post('/api/order/create').send({ items: [] });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(__storeSize()).toBe(0);
  });

  it('rejects an unknown item id', async () => {
    const res = await createOrder(app, [{ id: 'nope', qty: 1 }]);
    expect(res.statusCode).toBe(400);
    expect(__storeSize()).toBe(0);
  });

  it('rejects an invalid quantity (zero)', async () => {
    const res = await createOrder(app, [{ id: VALID_ITEM, qty: 0 }]);
    expect(res.statusCode).toBe(400);
    expect(__storeSize()).toBe(0);
  });

  it('rejects an invalid quantity (negative)', async () => {
    const res = await createOrder(app, [{ id: VALID_ITEM, qty: -5 }]);
    expect(res.statusCode).toBe(400);
  });

  it('rejects an unavailable item (m11 Cold Drink)', async () => {
    const res = await createOrder(app, [{ id: 'm11', qty: 1 }]);
    expect(res.statusCode).toBe(400);
    expect(__storeSize()).toBe(0);
  });

  it('rejects a malformed request body', async () => {
    const res = await request(app).post('/api/order/create').send({});
    expect(res.statusCode).toBe(400);
  });
});