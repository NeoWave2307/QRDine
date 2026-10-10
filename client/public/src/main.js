import { fetchMenu, createOrder, triggerPayment } from './api.js';
import { socket, joinOrderSession } from './socket.js';
import { renderMenuList } from './components/MenuList.js';
import { renderCart } from './components/Cart.js';
import { showPaymentModal, hidePaymentModal } from './components/PaymentModal.js';
import { showReceiptCard } from './components/ReceiptCard.js';

// Application State
let cart = [];
let currentOrderId = null;

// DOM Selectors
const menuContainer = document.getElementById('menu-container');
const cartContainer = document.getElementById('cart-container');
const modalOverlay = document.getElementById('payment-modal-overlay');
const paymentModal = document.getElementById('payment-modal');
const receiptContainer = document.getElementById('receipt-container');

/**
 * Initialize application
 */
async function init() {
  const menuResponse = await fetchMenu();
  
  if (menuResponse.success && menuResponse.menu) {
    renderMenuList(menuContainer, menuResponse.menu, handleAddToCart);
  } else {
    menuContainer.innerHTML = '<p style="color: red;">Unable to connect to server. Ensure server is running.</p>';
  }

  updateCartView();
  setupSocketListeners();
}

/**
 * Handle adding items to cart
 */
function handleAddToCart(item) {
  const existingItem = cart.find(c => c.id === item.id);
  if (existingItem) {
    existingItem.qty += 1;
  } else {
    cart.push({ id: item.id, name: item.name, price: item.price, qty: 1 });
  }
  updateCartView();
}

/**
 * Update Cart View & attach checkout trigger
 */
function updateCartView() {
  renderCart(cartContainer, cart, handleCheckout);
}

/**
 * Handle checkout button click
 */
async function handleCheckout() {
  if (cart.length === 0) return;

  const orderPayload = cart.map(item => ({ id: item.id, qty: item.qty }));
  const res = await createOrder(orderPayload);

  if (res.success && res.orderId) {
    currentOrderId = res.orderId;

    // Join dedicated socket room for this order
    joinOrderSession(currentOrderId);

    // Show Payment QR Modal
    showPaymentModal(
      modalOverlay,
      paymentModal,
      res.qrDataUrl,
      res.totalAmount,
      async () => {
        // Trigger payment simulation
        await triggerPayment(currentOrderId);
      }
    );
  } else {
    alert('Failed to initialize order. Please try again.');
  }
}

/**
 * Setup global Socket.IO event listeners
 */
function setupSocketListeners() {
  socket.on('payment_verified', (data) => {
    // Hide modal, cart, and menu
    hidePaymentModal(modalOverlay);
    cartContainer.style.display = 'none';
    menuContainer.style.display = 'none';

    // Show verified receipt
    showReceiptCard(receiptContainer, data);
  });
}

// Boot application
init();