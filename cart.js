// Cart functionality for MetaFV Store
// Stores cart in localStorage and renders a floating cart panel

const CART_STORAGE_KEY = 'MetaFVStore_Cart';

function formatPrice(value) {
  if (typeof value !== 'number') value = Number(value) || 0;
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
}

function loadCart() {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

function getCart() {
  return loadCart();
}

function setCart(cart) {
  saveCart(cart);
  renderCart();
}

function getProductInfo(card) {
  const titleEl = card.querySelector('h3');
  const nameRaw = titleEl ? titleEl.textContent.trim() : 'Sản phẩm';
  const [namePart, pricePart] = nameRaw.split(/\s*-\s*/).map(s => s.trim());
  const name = namePart || nameRaw;

  const priceMatch = pricePart ? pricePart.match(/[\d.,]+/g) : (nameRaw.match(/[\d.,]+/g) || []);
  const rawPrice = priceMatch ? priceMatch[0] : null;
  const price = rawPrice ? Number(rawPrice.replace(/[.,]/g, '')) : 0;

  const imgEl = card.querySelector('img');
  const image = imgEl ? imgEl.src : '';

  const id = card.dataset.productId || `${name}-${price}`;

  return { id, name, price, image };
}

function addToCart(product) {
  const cart = getCart();
  const existing = cart.find(item => item.id === product.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }
  setCart(cart);
  showToast(`Đã thêm ${product.name} vào giỏ hàng`);
}

function removeFromCart(id) {
  const cart = getCart().filter(item => item.id !== id);
  setCart(cart);
}

function clearCart() {
  setCart([]);
}

function getCartTotal() {
  return getCart().reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

function renderCart() {
  const cart = getCart();
  const countEl = document.getElementById('cartCount');
  const itemsEl = document.getElementById('cartItems');
  const totalEl = document.getElementById('cartTotal');

  if (countEl) {
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    countEl.textContent = totalCount;
    countEl.style.display = totalCount > 0 ? 'inline-flex' : 'none';
  }

  if (!itemsEl) return;

  itemsEl.innerHTML = '';

  if (cart.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'cart-empty';
    empty.textContent = 'Giỏ hàng trống';
    itemsEl.appendChild(empty);
  }

  cart.forEach(item => {
    const row = document.createElement('div');
    row.className = 'cart-item';

    const img = document.createElement('img');
    img.src = item.image || '';
    img.alt = item.name;
    img.className = 'cart-item-img';

    const info = document.createElement('div');
    info.className = 'cart-item-info';

    const title = document.createElement('div');
    title.className = 'cart-item-title';
    title.textContent = item.name;

    const qty = document.createElement('div');
    qty.className = 'cart-item-qty';
    qty.textContent = `Số lượng: ${item.quantity}`;

    const price = document.createElement('div');
    price.className = 'cart-item-price';
    price.textContent = formatPrice(item.price * item.quantity);

    const remove = document.createElement('button');
    remove.className = 'cart-item-remove';
    remove.type = 'button';
    remove.textContent = 'Xóa';
    remove.addEventListener('click', () => removeFromCart(item.id));

    info.appendChild(title);
    info.appendChild(qty);
    info.appendChild(price);
    info.appendChild(remove);

    row.appendChild(img);
    row.appendChild(info);

    itemsEl.appendChild(row);
  });

  if (totalEl) {
    totalEl.textContent = formatPrice(getCartTotal());
  }
}

function toggleCartPanel() {
  const panel = document.getElementById('cartPanel');
  if (!panel) return;
  panel.classList.toggle('open');
}

function setupCartUI() {
  if (document.getElementById('cartWidget')) return;

  const widget = document.createElement('div');
  widget.id = 'cartWidget';
  widget.className = 'cart-widget';

  const toggle = document.createElement('button');
  toggle.id = 'cartToggle';
  toggle.className = 'cart-toggle';
  toggle.type = 'button';
  toggle.setAttribute('aria-label', 'Xem giỏ hàng');
  toggle.innerHTML = '🛒 <span id="cartCount" class="cart-count">0</span>';
  toggle.addEventListener('click', toggleCartPanel);

  widget.appendChild(toggle);
  document.body.appendChild(widget);

  const panel = document.createElement('aside');
  panel.id = 'cartPanel';
  panel.className = 'cart-panel';
  panel.setAttribute('aria-hidden', 'true');

  panel.innerHTML = `
    <div class="cart-header">
      <h3>Giỏ hàng</h3>
      <button id="cartClose" class="cart-close" type="button" aria-label="Đóng">✕</button>
    </div>
    <div id="cartItems" class="cart-items"></div>
    <div class="cart-footer">
      <div class="cart-total">Tổng: <span id="cartTotal">0đ</span></div>
      <button id="cartClear" class="btn-buy" type="button">Xóa giỏ hàng</button>
    </div>
  `;

  document.body.appendChild(panel);

  document.getElementById('cartClose').addEventListener('click', toggleCartPanel);
  document.getElementById('cartClear').addEventListener('click', () => {
    clearCart();
    toggleCartPanel();
  });

  // Close panel when clicking outside
  document.addEventListener('click', (event) => {
    if (!panel.classList.contains('open')) return;
    const target = event.target;
    if (panel.contains(target) || toggle.contains(target)) return;
    toggleCartPanel();
  });
}

function setupProductCartButtons() {
  document.querySelectorAll('.product-card').forEach(card => {
    if (card.querySelector('.cart-btn')) return; // already inserted

    card.style.position = 'relative';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cart-btn';
    btn.title = 'Thêm vào giỏ hàng';
    btn.innerHTML = '🛒';

    btn.addEventListener('click', (event) => {
      event.stopPropagation();
      const product = getProductInfo(card);
      addToCart(product);
    });

    card.appendChild(btn);

    const buyButton = card.querySelector('.btn-buy');
    if (buyButton) {
      buyButton.addEventListener('click', (event) => {
        event.preventDefault();
        const product = getProductInfo(card);
        addToCart(product);
      });
    }
  });
}

function showToast(message) {
  const toastId = 'cart-toast';
  let toast = document.getElementById(toastId);
  if (!toast) {
    toast = document.createElement('div');
    toast.id = toastId;
    toast.className = 'cart-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('visible');
  window.clearTimeout(toast._timeout);
  toast._timeout = window.setTimeout(() => {
    toast.classList.remove('visible');
  }, 2200);
}

function initCart() {
  setupCartUI();
  setupProductCartButtons();
  renderCart();
}

document.addEventListener('DOMContentLoaded', initCart);
