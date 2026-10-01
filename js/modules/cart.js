// ============================\n// CART LOGIC WITH CUSTOMIZATION & EXTRA PIECES
      // ============================
      function getCartKey(name, customization, extraPieces = 0) {
        let key = name;
        if (customization) key += ` [${customization}]`;
        if (extraPieces > 0) key += ` [+${extraPieces}pcs]`;
        return key;
      }

      function addToCart(
        item,
        qty = 1,
        note = "",
        customization = "",
        extraPieces = 0,
      ) {
        const cartKey = getCartKey(item.name, customization, extraPieces);
        const idx = cart.findIndex((c) => c.cartKey === cartKey);

        if (idx >= 0) {
          cart[idx].qty += qty;
          if (note) cart[idx].note = note;
        } else {
          cart.push({
            ...item,
            cartKey,
            customization,
            extraPieces: extraPieces || 0,
            qty,
            note,
          });
        }
        updateCartUI();
      }

      function changeCartQtyByCartKey(cartKey, delta) {
        const idx = cart.findIndex((c) => c.cartKey === cartKey);
        if (idx < 0) return;
        cart[idx].qty += delta;
        if (cart[idx].qty <= 0) cart.splice(idx, 1);
        updateCartUI();
        updateMenuCards();
        renderCartBody();
      }

      function getItemLineTotal(item) {
        const plateTotal = item.price * item.qty;
        const extraTotal = (item.extraPieces || 0) * 20 * item.qty;
        return plateTotal + extraTotal;
      }

      function getCartSubtotal() {
        return cart.reduce((s, c) => s + getItemLineTotal(c), 0);
      }

      function updateCartUI() {
        const total = cart.reduce((s, c) => s + c.qty, 0);
        document.getElementById("navCartCount").textContent = total;
        document.getElementById("stickyCartCount").textContent = total;
        renderCartBody();
      }

      function renderCartBody() {
        const body = document.getElementById("cartBody");
        const footer = document.getElementById("cartFooter");
        if (!cart.length) {
          body.innerHTML = `<div class="cart-empty"><div class="cart-empty-icon"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg></div><p>Your cart is empty.<br>Add something delicious!</p></div>`;
          footer.style.display = "none";
          return;
        }
        footer.style.display = "";
        body.innerHTML = cart
          .map((item) => {
            const lineTotal = getItemLineTotal(item);
            const thumbHtml = item.image
              ? `<div class="cart-item-img-wrap"><img class="cart-item-thumb" src="${item.image}" alt="${item.name}"></div>`
              : `<div class="cart-item-veg-dot"><span class="veg-dot"></span></div>`;
            return `
    <div class="cart-item">
      ${thumbHtml}
      <div class="cart-item-info">
        <div class="cart-item-name">
          ${item.name}
          ${item.customization ? `<span style="display:inline-block;background:rgba(45,80,22,0.12);color:var(--green-deep);font-size:0.68rem;padding:0.12rem 0.45rem;border-radius:12px;font-weight:700;margin-left:0.25rem;">${item.customization}</span>` : ""}
          ${item.extraPieces > 0 ? `<span style="display:inline-block;background:rgba(200,149,42,0.15);color:var(--gold);font-size:0.68rem;padding:0.12rem 0.45rem;border-radius:12px;font-weight:700;margin-left:0.25rem;">+${item.extraPieces} extra pcs (+₹${item.extraPieces * 20})</span>` : ""}
          ${item.isJain ? `<span class="cart-item-jain-tag">Jain</span>` : ""}
        </div>
        <div class="cart-item-price">₹${lineTotal}</div>
        ${item.note ? `<div class="cart-item-note">Note: ${item.note}</div>` : ""}
      </div>
      <div class="cart-item-ctrl">
        <div class="qty-ctrl">
          <button class="qty-btn" onclick="changeCartQtyByCartKey('${item.cartKey.replace(/'/g, "\\'")}',-1)">−</button>
          <span class="qty-num">${item.qty}</span>
          <button class="qty-btn" onclick="changeCartQtyByCartKey('${item.cartKey.replace(/'/g, "\\'")}',1)">+</button>
        </div>
      </div>
    </div>
  `;
          })
          .join("");
        const subtotal = getCartSubtotal();
        document.getElementById("cartSubtotal").textContent = "₹" + subtotal;
        document.getElementById("cartTotal").textContent =
          "₹" + (subtotal + deliveryFee);
      }

      function openCart() {
        document.getElementById("cartOverlay").classList.add("open");
        document.getElementById("cartDrawer").classList.add("open");
        renderCartBody();
      }

      function closeCart() {
        document.getElementById("cartOverlay").classList.remove("open");
        document.getElementById("cartDrawer").classList.remove("open");
      }

      function goToCheckout() {
        closeCart();
        showPage("checkout");
      }

      function updateMenuCards() {
        // Refresh card add buttons on menu page
        if (document.getElementById("page-menu").classList.contains("active")) {
          renderMenu();
        }
        if (document.getElementById("page-home").classList.contains("active")) {
          renderHome();
        }
      }

      // ============================
