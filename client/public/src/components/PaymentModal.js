/**
 * Displays payment QR code modal overlay
 * @param {HTMLElement} overlayEl 
 * @param {HTMLElement} modalEl 
 * @param {string} qrDataUrl 
 * @param {number} amount 
 * @param {Function} onSimulatePay 
 * @param {Function} onClose 
 */
export function showPaymentModal(overlayEl, modalEl, qrDataUrl, amount, onSimulatePay, onClose) {
  modalEl.innerHTML = `
    <h2>Scan to Pay</h2>
    <p style="color: var(--text-muted); font-size: 14px;">Total Amount: <strong>₹${amount}</strong></p>
    <img src="${qrDataUrl}" alt="Payment QR Code" class="qr-image" />
    <button id="sim-pay-btn" class="btn">Simulate Payment Success</button>
    <button id="close-modal-btn" class="btn btn-secondary">Cancel</button>
  `;

  overlayEl.style.display = 'flex';

  document.getElementById('sim-pay-btn').onclick = onSimulatePay;
  document.getElementById('close-modal-btn').onclick = () => {
    overlayEl.style.display = 'none';
    if (onClose) onClose();
  };
}

export function hidePaymentModal(overlayEl) {
  overlayEl.style.display = 'none';
}