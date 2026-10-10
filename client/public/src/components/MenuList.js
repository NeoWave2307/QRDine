/**
 * Renders the active menu items
 * @param {HTMLElement} container 
 * @param {Array} items 
 * @param {Function} onSelectItem 
 */
export function renderMenuList(container, items, onSelectItem) {
  container.innerHTML = '<h2>Select Items</h2>';

  if (!items || items.length === 0) {
    container.innerHTML += '<p style="color: var(--text-muted);">No menu items currently available.</p>';
    return;
  }

  items.forEach(item => {
    if (!item.available) return;

    const itemEl = document.createElement('div');
    itemEl.className = 'menu-item';
    itemEl.innerHTML = `
      <div class="item-info">
        <span class="item-name">${item.name}</span>
        <span class="item-price">₹${item.price}</span>
      </div>
      <button class="btn btn-add" data-id="${item.id}">+ Add</button>
    `;

    itemEl.querySelector('.btn-add').onclick = () => onSelectItem(item);
    container.appendChild(itemEl);
  });
}