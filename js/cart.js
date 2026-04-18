/* ═══════════════════════════════════════════════════════
   CONFIG — Lê do admin (localStorage) ou usa padrão
   ═══════════════════════════════════════════════════════ */
const ADMIN_STORAGE = 'acaihouse_admin_v1';

function loadAdminConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem(ADMIN_STORAGE));
    if (saved && saved.products) return saved;
  } catch (e) {}
  return null;
}

const adminConfig = loadAdminConfig();

const PRODUCTS = adminConfig ? adminConfig.products : [
  { id: 'acai-p', emoji: '🍧', name: 'Açaí P', description: 'Açaí cremoso batido na hora', price: 15 },
  { id: 'acai-m', emoji: '🍧', name: 'Açaí M', description: 'Açaí cremoso batido na hora', price: 20 },
  { id: 'acai-g', emoji: '🍧', name: 'Açaí G', description: 'Açaí cremoso batido na hora', price: 24 },
  { id: 'acai-gg', emoji: '🍧', name: 'Açaí Gg', description: 'O maior e mais completo', price: 28 },
];

const VARIATIONS = adminConfig ? adminConfig.variations : [
  { id: 'colher', name: 'Colher', min: 1, max: 1, type: 'radio', options: [
    { id: 'colher-sim', name: 'Sim', price: 0 },
    { id: 'colher-nao', name: 'Não', price: 0 },
  ]},
  { id: 'dentro-separado', name: 'Dentro ou Separado', min: 1, max: 1, type: 'radio', options: [
    { id: 'dentro', name: 'Dentro', price: 0 },
    { id: 'separado', name: 'Separado', price: 0 },
  ]},
];

const WHATSAPP_NUMBER = adminConfig?.settings?.whatsapp || '5579999049167';
const HORARIO = adminConfig?.settings?.horario || '13h às 21h';

const STORAGE_KEY = 'acaihouse_cart_v2';

const state = loadState();
let currentProduct = null; // produto sendo personalizado

const productGrid = document.getElementById('productGrid');
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

// Modal elements
const customModal = document.getElementById('customModal');
const customOverlay = document.getElementById('customOverlay');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');
const modalTotal = document.getElementById('modalTotal');
const modalAddBtn = document.getElementById('modalAddBtn');
const modalCloseBtn = document.getElementById('modalClose');

init();

function init() {
  renderProducts();
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

  modalCloseBtn.addEventListener('click', closeModal);
  customOverlay.addEventListener('click', closeModal);
  modalAddBtn.addEventListener('click', addCustomizedToCart);

  orderButton.addEventListener('click', sendOrderToWhatsApp);

  applyDynamicConfig();
  renderCart();
}

/* ═══════════════ DYNAMIC CONFIG ═══════════════ */
function applyDynamicConfig() {
  // Update hero badge
  const badge = document.getElementById('heroBadge');
  if (badge) badge.textContent = `🕐 Aberto todos os dias ${HORARIO}`;

  // Update contact section
  const contactWa = document.getElementById('contactWhatsapp');
  if (contactWa) {
    contactWa.innerHTML = `<a href="https://wa.me/${WHATSAPP_NUMBER}" target="_blank" rel="noopener">${formatPhone(WHATSAPP_NUMBER)}</a>`;
  }
  const contactHorario = document.getElementById('contactHorario');
  if (contactHorario) contactHorario.textContent = `Domingo a domingo`;
  const contactHorarioHora = document.getElementById('contactHorarioHora');
  if (contactHorarioHora) contactHorarioHora.textContent = HORARIO;
  const contactWaBtn = document.getElementById('contactWaBtn');
  if (contactWaBtn) contactWaBtn.href = `https://wa.me/${WHATSAPP_NUMBER}`;

  // Update floating WhatsApp
  const waFloat = document.getElementById('whatsappFloat');
  if (waFloat) waFloat.href = `https://wa.me/${WHATSAPP_NUMBER}`;
}

function formatPhone(num) {
  // 5579999049167 -> (79) 9 9904-9167
  if (num.length === 13 && num.startsWith('55')) {
    const ddd = num.slice(2, 4);
    const p1 = num.slice(4, 5);
    const p2 = num.slice(5, 9);
    const p3 = num.slice(9, 13);
    return `(${ddd}) ${p1} ${p2}-${p3}`;
  }
  return num;
}

/* ═══════════════ RENDER PRODUCTS ═══════════════ */
function renderProducts() {
  productGrid.innerHTML = PRODUCTS.map(
    (product) => `
      <article class="product-card">
        <span class="product-emoji">${product.emoji}</span>
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <span class="product-price">${formatCurrency(product.price)}</span>
        <button class="add-btn" data-product-id="${product.id}">Montar Açaí</button>
      </article>
    `
  ).join('');

  productGrid.querySelectorAll('.add-btn').forEach((button) => {
    button.addEventListener('click', () => {
      openCustomModal(button.dataset.productId);
    });
  });
}

/* ═══════════════ CUSTOMIZATION MODAL ═══════════════ */
function openCustomModal(productId) {
  const product = PRODUCTS.find((p) => p.id === productId);
  if (!product) return;

  currentProduct = {
    ...product,
    selections: {},
  };

  // Initialize selections
  VARIATIONS.forEach((v) => {
    currentProduct.selections[v.id] = [];
  });

  modalTitle.textContent = `Montar ${product.name} — ${formatCurrency(product.price)}`;
  renderModalBody();
  updateModalTotal();

  customModal.classList.add('open');
  customOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  customModal.classList.remove('open');
  customOverlay.classList.remove('open');
  document.body.style.overflow = '';
  currentProduct = null;
}

function renderModalBody() {
  const activeVariations = VARIATIONS.filter((v) => v.options.length > 0);

  if (activeVariations.length === 0) {
    modalBody.innerHTML = `
      <div class="modal-empty">
        <p>Nenhuma personalização disponível no momento.</p>
        <p class="modal-empty-sub">Clique em "Adicionar ao Carrinho" para continuar.</p>
      </div>
    `;
    return;
  }

  modalBody.innerHTML = activeVariations
    .map((variation) => {
      const minMaxText = variation.min > 0
        ? `Escolha de ${variation.min} até ${variation.max}`
        : `Opcional — até ${variation.max}`;

      const required = variation.min > 0 ? '<span class="var-required">obrigatório</span>' : '';

      const optionsHTML = variation.options
        .map((opt) => {
          const inputType = variation.type === 'radio' ? 'radio' : 'checkbox';
          const inputName = variation.type === 'radio' ? `var-${variation.id}` : `var-${variation.id}-${opt.id}`;
          const priceLabel = opt.price > 0 ? ` (+${formatCurrency(opt.price)})` : '';

          return `
            <label class="var-option">
              <input
                type="${inputType}"
                name="${inputName}"
                data-var-id="${variation.id}"
                data-opt-id="${opt.id}"
                data-opt-price="${opt.price}"
              >
              <span class="var-option-name">${opt.name}${priceLabel}</span>
            </label>
          `;
        })
        .join('');

      return `
        <div class="var-group" data-var-group="${variation.id}">
          <div class="var-header">
            <h4>${variation.name} ${required}</h4>
            <span class="var-hint">${minMaxText}</span>
          </div>
          <div class="var-options">${optionsHTML}</div>
        </div>
      `;
    })
    .join('');

  // Add event listeners
  modalBody.querySelectorAll('input').forEach((input) => {
    input.addEventListener('change', handleVariationChange);
  });
}

function handleVariationChange(e) {
  const varId = e.target.dataset.varId;
  const optId = e.target.dataset.optId;
  const optPrice = parseFloat(e.target.dataset.optPrice);
  const variation = VARIATIONS.find((v) => v.id === varId);
  if (!variation) return;

  if (variation.type === 'radio') {
    currentProduct.selections[varId] = [{ id: optId, price: optPrice }];
  } else {
    if (e.target.checked) {
      const currentCount = currentProduct.selections[varId].length;
      if (currentCount >= variation.max) {
        e.target.checked = false;
        return;
      }
      currentProduct.selections[varId].push({ id: optId, price: optPrice });
    } else {
      currentProduct.selections[varId] = currentProduct.selections[varId].filter(
        (s) => s.id !== optId
      );
    }
  }

  updateModalTotal();
}

function getModalExtrasTotal() {
  let total = 0;
  Object.values(currentProduct.selections).forEach((selected) => {
    selected.forEach((s) => {
      total += s.price;
    });
  });
  return total;
}

function updateModalTotal() {
  if (!currentProduct) return;
  const total = currentProduct.price + getModalExtrasTotal();
  modalTotal.textContent = formatCurrency(total);
}

function validateSelections() {
  const activeVariations = VARIATIONS.filter((v) => v.options.length > 0);
  for (const variation of activeVariations) {
    const count = currentProduct.selections[variation.id].length;
    if (count < variation.min) {
      return `Selecione pelo menos ${variation.min} opção(ões) em "${variation.name}"`;
    }
  }
  return null;
}

function addCustomizedToCart() {
  if (!currentProduct) return;

  const error = validateSelections();
  if (error) {
    alert(error);
    return;
  }

  // Build readable selections
  const details = {};
  VARIATIONS.forEach((v) => {
    const selected = currentProduct.selections[v.id];
    if (selected.length > 0) {
      details[v.name] = selected.map((s) => {
        const opt = v.options.find((o) => o.id === s.id);
        return opt ? opt.name : s.id;
      });
    }
  });

  const extrasTotal = getModalExtrasTotal();
  const itemId = `${currentProduct.id}-${Date.now()}`;

  state.items.push({
    id: itemId,
    productId: currentProduct.id,
    name: currentProduct.name,
    basePrice: currentProduct.price,
    extrasTotal: extrasTotal,
    price: currentProduct.price + extrasTotal,
    quantity: 1,
    details: details,
  });

  persistState();
  renderCart();
  closeModal();

  // Feedback visual
  const btn = document.querySelector(`[data-product-id="${currentProduct?.id}"]`);
  if (btn) {
    btn.classList.add('added');
    setTimeout(() => btn.classList.remove('added'), 350);
  }
}

/* ═══════════════ CART ═══════════════ */
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

function renderCart() {
  const hasItems = state.items.length > 0;

  if (!hasItems) {
    cartItemsEl.innerHTML = '<p class="empty-cart">Seu carrinho está vazio.</p>';
  } else {
    cartItemsEl.innerHTML = state.items
      .map((item) => {
        const detailsHTML = item.details
          ? Object.entries(item.details)
              .map(
                ([key, values]) =>
                  `<div class="cart-item-detail"><span class="detail-label">${key}:</span> ${values.join(', ')}</div>`
              )
              .join('')
          : '';

        return `
          <article class="cart-item">
            <div class="cart-item-head">
              <strong>${item.name}</strong>
              <button class="remove-btn" data-remove-item="${item.id}">✕</button>
            </div>
            ${detailsHTML}
            <small>${formatCurrency(item.price)} cada</small>
            <div class="item-controls">
              <button data-minus-item="${item.id}">−</button>
              <span>${item.quantity}</span>
              <button data-plus-item="${item.id}">+</button>
              <strong>${formatCurrency(item.price * item.quantity)}</strong>
            </div>
          </article>
        `;
      })
      .join('');
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

  const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const total = getTotal();

  cartCountEl.textContent = String(totalItems);
  cartCountEl.classList.remove('bump');
  window.requestAnimationFrame(() => cartCountEl.classList.add('bump'));
  cartTotalEl.textContent = formatCurrency(total);
}

function getTotal() {
  return state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

/* ═══════════════ WHATSAPP ORDER ═══════════════ */
function sendOrderToWhatsApp() {
  if (state.items.length === 0) {
    alert('Adicione itens ao carrinho antes de fazer o pedido.');
    return;
  }

  const lines = [];
  state.items.forEach((item) => {
    lines.push(`*${item.name}* x${item.quantity} — ${formatCurrency(item.price * item.quantity)}`);
    if (item.details) {
      Object.entries(item.details).forEach(([key, values]) => {
        lines.push(`  ▸ ${key}: ${values.join(', ')}`);
      });
    }
    lines.push('');
  });

  const notes = state.notes ? state.notes : 'Sem observações';

  const message = [
    '🍇 *PEDIDO — Açaí House*',
    '',
    '🛒 *Itens:*',
    ...lines,
    `💰 *Total: ${formatCurrency(getTotal())}*`,
    '',
    `📝 *Observações:* ${notes}`,
    '',
    'Obrigado! 😊',
  ].join('\n');

  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}

/* ═══════════════ CART DRAWER ═══════════════ */
function openCart() {
  cartDrawer.classList.add('open');
  cartOverlay.classList.add('open');
}

function closeCart() {
  cartDrawer.classList.remove('open');
  cartOverlay.classList.remove('open');
}

/* ═══════════════ PERSISTENCE ═══════════════ */
function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return {
      items: Array.isArray(saved.items) ? saved.items : [],
      notes: typeof saved.notes === 'string' ? saved.notes : '',
    };
  } catch (error) {
    console.warn('Não foi possível carregar carrinho salvo.', error);
    return { items: [], notes: '' };
  }
}

function persistState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function formatCurrency(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
