import { createApp } from '../server.js';
import request from 'supertest';
import { __resetStore } from '../store/orderStore.js';
import { existsSync } from 'node:fs';
import path from 'node:path';

beforeEach(() => __resetStore());

describe('GET /api/order/:orderId (status recovery)', () => {
  it('returns the current order status after a payment', async () => {
    const { app } = createApp();
    const create = await request(app).post('/api/order/create').send({ items: [{ id: 'm1', qty: 2 }] });
    await request(app).post('/api/order/pay').send({ orderId: create.body.orderId });

    const res = await request(app).get(`/api/order/${create.body.orderId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('PAID');
    expect(res.body.verificationHash).not.toBeNull();
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  it('returns 404 for an unknown order id', async () => {
    const { app } = createApp();
    const res = await request(app).get('/api/order/ORD_DOES_NOT_EXIST');
    expect(res.statusCode).toBe(404);
  });
});

describe('Vendor dashboard', () => {
  it('serves the vendor dashboard HTML at /vendor-dashboard.html', () => {
    const { app } = createApp();
    const htmlPath = path.join(process.cwd(), 'views', 'vendor-dashboard.html');
    expect(existsSync(htmlPath)).toBe(true);
  });

  it('returns the dashboard file content via HTTP', async () => {
    const { app } = createApp();
    const res = await request(app).get('/vendor-dashboard.html');
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('Kitchen Display System');
    expect(res.text).toContain('socket.io');
  });
});