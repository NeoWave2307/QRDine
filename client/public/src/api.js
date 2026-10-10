// Local IP of Server machine (Developer 1)
// UPDATE THIS to Developer 1's LAN IP when testing on mobile devices over Wi-Fi
const BASE_URL = 'http://localhost:3000/api';

/**
 * Fetch active menu from backend
 */
export async function fetchMenu() {
  try {
    const res = await fetch(`${BASE_URL}/menu`);
    if (!res.ok) throw new Error('Failed to fetch menu');
    return await res.json();
  } catch (error) {
    console.error('API Error [fetchMenu]:', error);
    return { success: false, menu: [] };
  }
}

/**
 * Create order and request server-generated QR code
 * @param {Array<{id: string, qty: number}>} items 
 */
export async function createOrder(items) {
  try {
    const res = await fetch(`${BASE_URL}/order/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items })
    });
    if (!res.ok) throw new Error('Failed to create order');
    return await res.json();
  } catch (error) {
    console.error('API Error [createOrder]:', error);
    return { success: false };
  }
}

/**
 * Simulate payment trigger
 * @param {string} orderId 
 */
export async function triggerPayment(orderId) {
  try {
    const res = await fetch(`${BASE_URL}/order/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId })
    });
    if (!res.ok) throw new Error('Payment processing failed');
    return await res.json();
  } catch (error) {
    console.error('API Error [triggerPayment]:', error);
    return { success: false };
  }
}