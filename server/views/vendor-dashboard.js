/**
 * server/views/vendor-dashboard.js
 * Vendor Kitchen Display System (KDS) controller.
 * Connects to the Socket.IO server, joins vendor_main, and renders
 * newly paid orders with their verification codes.
 */

const SERVER_URL = window.location.origin;
const socket = window.io(SERVER_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000
});

const statusEl = document.getElementById('status');
const ordersEl = document.getElementById('orders');
const emptyStateEl = document.getElementById('empty-state');
const errorBannerEl = document.getElementById('error-banner');

const seenOrderIds = new Set();

// --- Connection status indicators ---
function setStatus(state, text) {
  statusEl.dataset.state = state;
  statusEl.querySelector('.status-text').textContent = text;
}

socket.on('connect', () => {
  setStatus('connected', 'Connected');
  errorBannerEl.hidden = true;
  socket.emit('join_vendor_room');
});

socket.on('disconnect', () => {
  setStatus('disconnected', 'Disconnected');
});

socket.on('connect_error', () => {
  setStatus('error', 'Connection error');
  errorBannerEl.hidden = false;
});

socket.on('reconnecting', (attempt) => {
  setStatus('connecting', `Reconnecting (${attempt})...`);
});

// --- Order rendering ---
socket.on('new_order_alert', (payload) => {
  // The vendor screen may receive either a single order object or a batch
  // array (seeded on join). Normalize both.
  const orders = Array.isArray(payload) ? payload : [payload];

  orders.forEach((order) => {
    if (!order || !order.orderId) return;
    if (seenOrderIds.has(order.orderId)) return; // avoid duplicates
    seenOrderIds.add(order.orderId);

    if (emptyStateEl) emptyStateEl.style.display = 'none';
    renderOrderCard(order);
  });
});

function renderOrderCard(order) {
  const card = document.createElement('article');
  card.className = 'order-card';
  card.dataset.orderId = order.orderId;

  const itemsHtml = (order.items || [])
    .map((it) => `<li><span>${escapeHtml(it.name)}</span><strong>${it.qty}x</strong></li>`)
    .join('');

  const time = formatTime(order.paidAt);

  card.innerHTML = `
    <div class="order-head">
      <span class="order-id">${escapeHtml(order.orderId)}</span>
      <span class="order-time">${time}</span>
    </div>

    <ul class="order-items">${itemsHtml}</ul>

    <div class="order-foot">
      <span class="order-total">Total: ₹${Number(order.totalAmount).toFixed(2)}</span>
      <span class="verification-code">${escapeHtml(order.verificationHash || '—')}</span>
    </div>

    <p class="order-hint">Compare this code with the student's receipt before handing over the order.</p>
  `;

  ordersEl.appendChild(card);
}

// --- Helpers ---
function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatTime(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}