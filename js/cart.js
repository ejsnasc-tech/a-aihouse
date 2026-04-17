const PRODUCTS = [
  { id: 'acai-300', emoji: '🍧', name: 'Açaí Pequeno 300ml', description: 'Açaí cremoso batido na hora', price: 12 },
  { id: 'acai-500', emoji: '🍧', name: 'Açaí Médio 500ml', description: 'Açaí cremoso batido na hora', price: 18 },
  { id: 'acai-700', emoji: '🍧', name: 'Açaí Grande 700ml', description: 'Açaí cremoso batido na hora', price: 24 },
  { id: 'acai-1l', emoji: '🍧', name: 'Açaí GG 1 Litro', description: 'Açaí cremoso batido na hora', price: 32 },
  { id: 'acai-2l', emoji: '🍧', name: 'Açaí 2 Litros', description: 'Ideal para família', price: 55 },
  { id: 'combo-casal', emoji: '💜', name: 'Combo Casal', description: '2x 500ml + 4 adicionais', price: 40 },
];

const EXTRAS = [
  { id: 'granola', name: 'Granola', price: 2 },
  { id: 'ninho', name: 'Leite Ninho', price: 2 },
  { id: 'banana', name: 'Banana', price: 2 },
  { id: 'morango', name: 'Morango', price: 2 },
  { id: 'nutella', name: 'Nutella', price: 3 },
  { id: 'pacoca', name: 'Paçoca', price: 2 },
  { id: 'bis', name: 'Bis', price: 3 },
  { id: 'condensado', name: 'Leite Condensado', price: 2 },
  { id: 'mel', name: 'Mel', price: 2 },
  { id: 'coco', name: 'Coco Ralado', price: 2 },
];

const STORAGE_KEY = 'acaihouse_cart_v1';

const state = loadState();

const productGrid = document.getElementById('productGrid');
const extrasGrid = document.getElementById('extrasGrid');
const cartItemsEl = document.getElementById('cartItems');
const cartCountEl = document.getElementById('cartCount');
const cartTotalEl = document.getElementById('cartTotal');
const notesEl = document.getElementById('orderNotes');

const menuToggle = document.getElementById('menuToggle');
const mainNav = document.getElementById('mainNav');

const openCartBtn = document.getElementById('openCart');
const closeCartBtn = document.getElementById('closeCart');
const cartDrawer = document.getElementById('cartDrawer');
const cartOverlay = document.getElementById('cartOverlay');
const orderButton = document.getElementById('orderButton');

init();

function init() {
  renderProducts();
  renderExtras();
  notesEl.value = state.notes || '';
  notesEl.addEventListener('input', () => {
    state.notes = notesEl.value.trim();
    persistState();
  });

  menuToggle.addEventListener('click', () => {
    mainNav.classList.toggle('open');
  });

  mainNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => mainNav.classList.remove('open'));
  });

  openCartBtn.addEventListener('click', openCart);
  closeCartBtn.addEventListener('click', closeCart);
  cartOverlay.addEventListener('click', closeCart);

  orderButton.addEventListener('click', sendOrderToWhatsApp);

  renderCart();
}

function renderProducts() {
  productGrid.innerHTML = PRODUCTS.map(
    (product) => `
      <article class="product-card">
        <span class="product-emoji">${product.emoji}</span>
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <span class="product-price">${formatCurrency(product.price)}</span>
        <button class="add-btn" data-product-id="${product.id}">Adicionar ao carrinho</button>
      </article>
    `
  ).join('');

  productGrid.querySelectorAll('.add-btn').forEach((button) => {
    button.addEventListener('click', () => {
      addToCart(button.dataset.productId);
      button.classList.add('added');
      setTimeout(() => button.classList.remove('added'), 350);
    });
  });
}

function renderExtras() {
  extrasGrid.innerHTML = EXTRAS.map((extra) => {
    const checked = state.extras.some((item) => item.id === extra.id) ? 'checked' : '';
    return `
      <label class="extra-item">
        <input type="checkbox" data-extra-id="${extra.id}" ${checked}>
        <span>${extra.name} - ${formatCurrency(extra.price)}</span>
      </label>
    `;
  }).join('');

  extrasGrid.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
      toggleExtra(checkbox.dataset.extraId, checkbox.checked);
    });
  });
}

function addToCart(productId) {
  const product = PRODUCTS.find((item) => item.id === productId);
  if (!product) return;

  const existing = state.items.find((item) => item.id === product.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    state.items.push({ id: product.id, name: product.name, price: product.price, quantity: 1 });
  }

  persistState();
  renderCart();
}

function toggleExtra(extraId, isChecked) {
  const extra = EXTRAS.find((item) => item.id === extraId);
  if (!extra) return;

  if (isChecked) {
    if (!state.extras.some((item) => item.id === extra.id)) {
      state.extras.push(extra);
    }
  } else {
    state.extras = state.extras.filter((item) => item.id !== extra.id);
  }

  persistState();
  renderCart();
}

function updateQuantity(itemId, nextQuantity) {
  state.items = state.items
    .map((item) => (item.id === itemId ? { ...item, quantity: nextQuantity } : item))
    .filter((item) => item.quantity > 0);

  persistState();
  renderCart();
}

function removeItem(itemId) {
  state.items = state.items.filter((item) => item.id !== itemId);
  persistState();
  renderCart();
}

function removeExtra(extraId) {
  state.extras = state.extras.filter((item) => item.id !== extraId);
  persistState();
  renderExtras();
  renderCart();
}

function renderCart() {
  const hasProducts = state.items.length > 0;
  const hasExtras = state.extras.length > 0;

  if (!hasProducts && !hasExtras) {
    cartItemsEl.innerHTML = '<p class="empty-cart">Seu carrinho está vazio.</p>';
  } else {
    const productHTML = state.items
      .map(
        (item) => `
          <article class="cart-item">
            <div class="cart-item-head">
              <strong>${item.name}</strong>
              <button class="remove-btn" data-remove-item="${item.id}">✕</button>
            </div>
            <small>${formatCurrency(item.price)} cada</small>
            <div class="item-controls">
              <button data-minus-item="${item.id}">-</button>
              <span>${item.quantity}</span>
              <button data-plus-item="${item.id}">+</button>
              <strong>${formatCurrency(item.price * item.quantity)}</strong>
            </div>
          </article>
        `
      )
      .join('');

    const extraHTML = state.extras
      .map(
        (item) => `
          <article class="cart-item">
            <div class="cart-item-head">
              <strong>+ ${item.name}</strong>
              <button class="remove-btn" data-remove-extra="${item.id}">✕</button>
            </div>
            <small>${formatCurrency(item.price)}</small>
          </article>
        `
      )
      .join('');

    cartItemsEl.innerHTML = `${productHTML}${extraHTML}`;
  }

  cartItemsEl.querySelectorAll('[data-plus-item]').forEach((button) => {
    button.addEventListener('click', () => {
      const item = state.items.find((entry) => entry.id === button.dataset.plusItem);
      if (!item) return;
      updateQuantity(item.id, item.quantity + 1);
    });
  });

  cartItemsEl.querySelectorAll('[data-minus-item]').forEach((button) => {
    button.addEventListener('click', () => {
      const item = state.items.find((entry) => entry.id === button.dataset.minusItem);
      if (!item) return;
      updateQuantity(item.id, item.quantity - 1);
    });
  });

  cartItemsEl.querySelectorAll('[data-remove-item]').forEach((button) => {
    button.addEventListener('click', () => removeItem(button.dataset.removeItem));
  });

  cartItemsEl.querySelectorAll('[data-remove-extra]').forEach((button) => {
    button.addEventListener('click', () => removeExtra(button.dataset.removeExtra));
  });

  const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0) + state.extras.length;
  const total = getTotal();

  cartCountEl.textContent = String(totalItems);
  cartCountEl.classList.remove('bump');
  window.requestAnimationFrame(() => cartCountEl.classList.add('bump'));
  cartTotalEl.textContent = formatCurrency(total);
}

function getTotal() {
  const productsTotal = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const extrasTotal = state.extras.reduce((sum, item) => sum + item.price, 0);
  return productsTotal + extrasTotal;
}

function sendOrderToWhatsApp() {
  if (state.items.length === 0 && state.extras.length === 0) {
    alert('Adicione itens ao carrinho antes de fazer o pedido.');
    return;
  }

  const lines = [];
  state.items.forEach((item) => {
    lines.push(`- ${item.name} x${item.quantity} - ${formatCurrency(item.price * item.quantity)}`);
  });

  if (state.extras.length) {
    lines.push('');
    lines.push('🫐 *Adicionais:*');
    state.extras.forEach((item) => lines.push(`- ${item.name} - ${formatCurrency(item.price)}`));
  }

  const notes = state.notes ? state.notes : 'Sem observações';

  const message = [
    '🍇 *PEDIDO - Açaí House*',
    '',
    '🛒 *Itens:*',
    ...lines,
    '',
    `💰 *Total: ${formatCurrency(getTotal())}*`,
    '',
    `📝 *Observações:* ${notes}`,
    '',
    'Obrigado! 😊',
  ].join('\n');

  const url = `https://wa.me/5579999049167?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}

function openCart() {
  cartDrawer.classList.add('open');
  cartOverlay.classList.add('open');
}

function closeCart() {
  cartDrawer.classList.remove('open');
  cartOverlay.classList.remove('open');
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return {
      items: Array.isArray(saved.items) ? saved.items : [],
      extras: Array.isArray(saved.extras) ? saved.extras : [],
      notes: typeof saved.notes === 'string' ? saved.notes : '',
    };
  } catch (error) {
    console.warn('Não foi possível carregar carrinho salvo.', error);
    return { items: [], extras: [], notes: '' };
  }
}

function persistState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function formatCurrency(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
