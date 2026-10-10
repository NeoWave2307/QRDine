import { createApp } from '../server.js';
import request from 'supertest';
import { __resetStore } from '../store/orderStore.js';

beforeEach(() => __resetStore());

describe('GET /api/menu', () => {
  let app;
  beforeEach(() => {
    app = createApp().app;
  });

  it('returns the authoritative menu payload', async () => {
    const res = await request(app).get('/api/menu');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.menu)).toBe(true);
    expect(res.body.menu.length).toBeGreaterThan(0);
  });

  it('exposes id, name, price, and available for every item', async () => {
    const res = await request(app).get('/api/menu');
    for (const item of res.body.menu) {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('price');
      expect(typeof item.price).toBe('number');
      expect(item).toHaveProperty('available');
    }
  });

  it('includes a mix of snacks, meals, beverages, and desserts', async () => {
    const res = await request(app).get('/api/menu');
    const categories = new Set(res.body.menu.map(i => i.category));
    expect(categories.has('Snacks')).toBe(true);
    expect(categories.has('Meals')).toBe(true);
    expect(categories.has('Beverages')).toBe(true);
    expect(categories.has('Desserts')).toBe(true);
  });
});