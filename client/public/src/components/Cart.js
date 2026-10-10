/**
 * Renders the student's cart summary
 * @param {HTMLElement} container 
 * @param {Array} cartItems 
 * @param {Function} onCheckout 
 */
export function renderCart(container, cartItems, onCheckout) {
  container.innerHTML = '<h2>Your Cart</h2>';

  if (!cartItems || cartItems.length === 0) {
    container.innerHTML += '<p style="color: var(--text-muted);">Your cart is empty.</p>';
    return;
  }

  let totalAmount = 0;

  cartItems.forEach(item => {
    const itemSubtotal = item.price * item.qty;
    totalAmount += itemSubtotal;

    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = `
      <span>${item.qty}x ${item.name}</span>
      <span>₹${itemSubtotal}</span>
    `;
    container.appendChild(row);
  });

  const totalEl = document.createElement('div');
  totalEl.className = 'cart-total';
  totalEl.innerHTML = `
    <span>Total:</span>
    <span>₹${totalAmount}</span>
  `;
  container.appendChild(totalEl);

  const checkoutBtn = document.createElement('button');
  checkoutBtn.className = 'btn';
  checkoutBtn.style.marginTop = '16px';
  checkoutBtn.innerText = 'Generate Payment QR';
  checkoutBtn.onclick = onCheckout;

  container.appendChild(checkoutBtn);
}