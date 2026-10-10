import { createApp } from '../server.js';
import request from 'supertest';
import { io as ioClient } from 'socket.io-client';
import { __resetStore } from '../store/orderStore.js';

beforeEach(() => __resetStore());

let app, httpServer, io, clientUrl;

async function startServer() {
  ({ app, server: httpServer, io } = createApp());
  await new Promise((resolve) => {
    httpServer.listen(0, () => {
      const port = httpServer.address().port;
      clientUrl = `http://localhost:${port}`;
      resolve();
    });
  });
}

function stopServer() {
  return new Promise((resolve) => {
    io.close();
    httpServer.close(() => resolve());
  });
}

function connectClient() {
  return ioClient(clientUrl, { transports: ['websocket'] });
}

function waitFor(event, client, timeout = 3000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timed out waiting for ${event}`));
    }, timeout);
    client.once(event, (data) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

describe('Socket.IO integration', () => {
  let client, vendor;

  afterEach(async () => {
    if (client) { client.disconnect(); client = null; }
    if (vendor) { vendor.disconnect(); vendor = null; }
  });

  afterAll(async () => {
    await stopServer();
  });

  it('vendor receives new_order_alert with the same verification code the student receives', async () => {
    await startServer();
    client = connectClient();
    vendor = connectClient();

    // Student creates an order and joins the private room.
    const create = await request(app).post('/api/order/create').send({ items: [{ id: 'm1', qty: 2 }] });
    const orderId = create.body.orderId;

    client.emit('join_order_room', orderId);
    await waitFor('order_status', client);

    // Vendor joins the kitchen display room.
    vendor.emit('join_vendor_room');

    // Set up listeners BEFORE triggering payment.
    const studentPromise = waitFor('payment_verified', client);
    const vendorPromise = waitFor('new_order_alert', vendor);

    // Simulate payment.
    const pay = await request(app).post('/api/order/pay').send({ orderId });
    expect(pay.body.success).toBe(true);

    const studentEvent = await studentPromise;
    const vendorEvent = await vendorPromise;

    // Both sides must carry the same verification code.
    expect(studentEvent.verificationHash).toBe(pay.body.verificationHash);
    expect(vendorEvent.verificationHash).toBe(pay.body.verificationHash);
    expect(studentEvent.verificationHash).toBe(vendorEvent.verificationHash);

    // Vendor payload must include order id, items, total, and timestamp.
    expect(vendorEvent.orderId).toBe(orderId);
    expect(vendorEvent.totalAmount).toBe(100);
    expect(Array.isArray(vendorEvent.items)).toBe(true);
    expect(vendorEvent.paidAt).not.toBeNull();
  });

  it('student receives order_status on join for reconnect recovery', async () => {
    await startServer();
    client = connectClient();

    const create = await request(app).post('/api/order/create').send({ items: [{ id: 'm2', qty: 1 }] });
    const pay = await request(app).post('/api/order/pay').send({ orderId: create.body.orderId });

    client.emit('join_order_room', create.body.orderId);
    const status = await waitFor('order_status', client);

    expect(status.orderId).toBe(create.body.orderId);
    expect(status.status).toBe('PAID');
    expect(status.verificationHash).toBe(pay.body.verificationHash);
  });

  it('rejects an unknown order room join', async () => {
    await startServer();
    client = connectClient();

    client.emit('join_order_room', 'ORD_GARBAGE');
    const err = await waitFor('order_error', client);
    expect(err.error).toMatch(/unknown/i);
  });

  it('prevents one student from subscribing to another student private order', async () => {
    await startServer();
    // Client A: the actual student who placed the order
    const clientA = connectClient();
    // Client B: a different student trying to snoop
    const clientB = connectClient();

    // Client A creates an order and joins the room (claims ownership).
    const create = await request(app).post('/api/order/create').send({ items: [{ id: 'm1', qty: 1 }] });
    const orderId = create.body.orderId;

    clientA.emit('join_order_room', orderId);
    await waitFor('order_status', clientA);

    // Client B tries to join the same order room -> should be rejected.
    clientB.emit('join_order_room', orderId);
    const err = await waitFor('order_error', clientB);
    expect(err.error).toMatch(/access denied/i);

    clientA.disconnect();
    clientB.disconnect();
  });
});