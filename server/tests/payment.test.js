import { createApp } from '../server.js';
import request from 'supertest';
import { __resetStore, __storeSize, getOrder } from '../store/orderStore.js';
import { generateVerificationHash } from '../utils/hashGenerator.js';

const VALID_ITEM = 'm1'; // Cold Coffee, 50 INR

beforeEach(() => __resetStore());

async function createAndPay(app, items = [{ id: VALID_ITEM, qty: 2 }], secret = 'test-secret-2026') {
  const create = await request(app).post('/api/order/create').send({ items });
  const pay = await request(app)
    .post('/api/order/pay')
    .send({ orderId: create.body.orderId });
  return { create, pay };
}

describe('POST /api/order/pay', () => {
  let app;
  beforeEach(() => {
    app = createApp().app;
  });

  it('marks a pending order as paid and returns a verificationHash', async () => {
    const { create, pay } = await createAndPay(app);
    expect(pay.statusCode).toBe(200);
    expect(pay.body.success).toBe(true);
    expect(typeof pay.body.verificationHash).toBe('string');
    expect(pay.body.verificationHash.startsWith('CANTEEN-')).toBe(true);

    const order = getOrder(create.body.orderId);
    expect(order.status).toBe('PAID');
    expect(order.verificationHash).toBe(pay.body.verificationHash);
    expect(order.paidAt).not.toBeNull();
  });

  it('generates the verification code using the configured server secret', async () => {
    const { create, pay } = await createAndPay(app);
    const expected = generateVerificationHash({
      orderId: create.body.orderId,
      amount: create.body.totalAmount,
      timestamp: getOrder(create.body.orderId).paidAt,
      secret: 'test-secret-2026'
    });
    expect(pay.body.verificationHash).toBe(expected);
  });

  it('rejects payment for an unknown order id', async () => {
    const res = await request(app).post('/api/order/pay').send({ orderId: 'ORD_DOES_NOT_EXIST' });
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('rejects a duplicate payment attempt', async () => {
    const { create } = await createAndPay(app);
    const dup = await request(app)
      .post('/api/order/pay')
      .send({ orderId: create.body.orderId });
    expect(dup.statusCode).toBe(400);
    expect(dup.body.error).toMatch(/already processed/i);
  });

  it('rejects payment when orderId is missing', async () => {
    const res = await request(app).post('/api/order/pay').send({});
    expect(res.statusCode).toBe(400);
  });

  it('does not allow concurrent payment to produce multiple PAID states', async () => {
    const create = await request(app)
      .post('/api/order/create')
      .send({ items: [{ id: VALID_ITEM, qty: 1 }] });

    const [a, b] = await Promise.all([
      request(app).post('/api/order/pay').send({ orderId: create.body.orderId }),
      request(app).post('/api/order/pay').send({ orderId: create.body.orderId })
    ]);

    const statuses = [a.statusCode, b.statusCode];
    expect(statuses.filter(s => s === 200).length).toBe(1);
    expect(statuses.filter(s => s === 409 || s === 400).length).toBe(1);

    const order = getOrder(create.body.orderId);
    expect(order.status).toBe('PAID');
    expect(order.verificationHash).not.toBeNull();
  });

  it('does not expose the secret to the client', async () => {
    const { pay } = await createAndPay(app);
    expect(JSON.stringify(pay.body)).not.toContain('test-secret-2026');
  });
});