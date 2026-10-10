// Jest per-test reset. Runs after each test, so the Jest globals (beforeEach)
// are available in this context.
import { __resetStore } from '../store/orderStore.js';

beforeEach(() => {
  __resetStore();
});