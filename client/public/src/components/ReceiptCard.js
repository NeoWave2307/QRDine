/**
 * Displays verified receipt with unique token
 * @param {HTMLElement} container 
 * @param {Object} data 
 */
export function showReceiptCard(container, data) {
  container.style.display = 'block';
  
  const itemsList = data.items ? data.items.map(i => `<li>${i.qty}x ${i.name}</li>`).join('') : '';

  container.innerHTML = `
    <div class="receipt-box">
      <h2 class="receipt-title">Payment Confirmed!</h2>
      <p style="font-size: 14px; color: var(--text-muted);">Show this code at the pick-up counter:</p>
      
      <div class="verification-badge">${data.verificationHash}</div>
      
      <p style="font-size: 13px; color: #475569;"><strong>Order ID:</strong> ${data.orderId}</p>
      <p style="font-size: 13px; color: #475569;"><strong>Total Paid:</strong> ₹${data.totalAmount}</p>
      <ul style="list-style: none; margin-top: 12px; font-size: 14px; color: #334155;">
        ${itemsList}
      </ul>
      <p style="font-size: 11px; color: #94a3b8; margin-top: 16px;">Synced with Vendor Kitchen Display</p>
    </div>
  `;
}