// ============================
// GOOGLE SHEETS INTEGRATION CONFIG
// ============================
// Paste your Google Apps Script Web App URL below
const GOOGLE_SHEETS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyl7wapwjSj9jp-L0tj7sJApszPAljgZgvtO-ztJLoUTko6JMWuJQuZDW3tWIyr0_Ky-Q/exec";
// CART & MODAL STATE
let cart = [];
let currentItem = null;
let modalQty = 1;
let modalExtraPieces = 0;
let selectedCustomOption = "";
let appliedDiscount = 0;
let deliveryFee = 40;
let _activePage = "home"; // tracks current page for session save

// ============================
// SESSION PERSISTENCE
// ============================
const SESSION_KEY = "tvs_session";

function saveSession() {
  try {
    const data = {
      cart,
      appliedDiscount,
      ts: Date.now(),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(data));
  } catch (e) {
    /* storage unavailable — silent fail */
  }
}

function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (e) {}
}

function restoreSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (!data || Date.now() - (data.ts || 0) > 6 * 60 * 60 * 1000) {
      clearSession();
      return false;
    }
    if (Array.isArray(data.cart) && data.cart.length > 0) {
      cart = data.cart;
    }
    if (data.appliedDiscount > 0) appliedDiscount = data.appliedDiscount;
    return true;
  } catch (e) {
    return false;
  }
}

// ============================
// PAGE NAVIGATION
// ============================
function showPage(pageId, scrollToTop = true) {
  const el = document.getElementById("page-" + pageId);
  if (!el) return;

  // Always ensure target page content is rendered before display
  if (pageId === "home") renderHome();
  if (pageId === "menu") renderMenu();
  if (pageId === "checkout") renderCheckout();

  const isSamePage = _activePage === pageId;
  if (isSamePage) {
    if (scrollToTop) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    closeMobileMenu();
    updateNavActive(pageId);
    return;
  }

  // Activate target page FIRST so document height never collapses to 0
  el.classList.add("active");
  document
    .querySelectorAll(".page")
    .forEach((p) => {
      if (p !== el) p.classList.remove("active");
    });

  if (scrollToTop) {
    window.scrollTo(0, 0);
  }

  _activePage = pageId;
  closeMobileMenu();
  updateNavActive(pageId);
  saveSession();
}

function toggleMenu() {
  const navLinks = document.getElementById("navLinks");
  const hamburger = document.getElementById("hamburger");
  let backdrop = document.getElementById("navBackdrop");

  const isOpen = navLinks.classList.toggle("mobile-open");
  if (hamburger) hamburger.classList.toggle("open", isOpen);

  if (!backdrop) {
    backdrop = document.createElement("div");
    backdrop.id = "navBackdrop";
    backdrop.className = "nav-backdrop";
    backdrop.onclick = closeMobileMenu;
    document.body.appendChild(backdrop);
  }
  backdrop.classList.toggle("show", isOpen);
}

function closeMobileMenu() {
  const navLinks = document.getElementById("navLinks");
  const hamburger = document.getElementById("hamburger");
  const backdrop = document.getElementById("navBackdrop");
  if (navLinks) navLinks.classList.remove("mobile-open");
  if (hamburger) hamburger.classList.remove("open");
  if (backdrop) backdrop.classList.remove("show");
}

// Pre-warm primary page assets in background for instant mobile transitions
window.addEventListener("DOMContentLoaded", () => {
  const warmImages = ["founder_chef_studio.jpg", "veg_studio_logo_hq.jpg"];
  warmImages.forEach((src) => {
    const img = new Image();
    img.src = src;
  });
});

function setActiveBottomNav(el) {
  document
    .querySelectorAll(".bottom-nav-item")
    .forEach((b) => b.classList.remove("active"));
  el.classList.add("active");
}

// ============================
// HOME PAGE
// ============================
let _homeRendered = false;
function renderHome() {
  // Only build DOM once — avoids layout thrash on every page revisit
  const catGrid = document.getElementById("homeCatGrid");
  const featured = document.getElementById("homeFeatured");
  if (!catGrid || !featured) return;

  if (_homeRendered && catGrid.children.length > 0) {
    // Already built — just refresh add-buttons in case cart changed
    if (cart.length > 0) updateMenuCards();
    return;
  }
  _homeRendered = true;

  // Category grid
  const cats = Object.keys(menuData);

  catGrid.innerHTML = cats
    .map((cat, i) => {
      const num = String(i + 1).padStart(2, "0");
      const data = menuData[cat] || {};
      const items = data.items || [];
      const count = items.length;
      const prices = items
        .map((it) => Number(it.price) || 0)
        .filter((p) => p > 0);
      const minPrice = prices.length ? Math.min(...prices) : null;

      return `
    <div class="cat-card" onclick="scrollToCategory('${cat}')">
      <div class="cat-card-fill"></div>
      <div class="cat-card-inner">
        <div class="cat-card-top">
          <span class="cat-num">#${num}</span>
        </div>
        <div class="cat-card-content">
          <h3 class="cat-name">${cat}</h3>
          <div class="cat-meta-row">
            <span class="cat-count-pill">${count} ${count === 1 ? "Creation" : "Creations"}</span>
            ${minPrice ? `<span class="cat-price-pill">From ₹${minPrice}</span>` : ""}
          </div>
        </div>
        <div class="cat-card-footer">
          <div class="cat-bar"></div>
          <span class="cat-explore-link">Explore <span class="cat-arrow">&rarr;</span></span>
        </div>
      </div>
    </div>
  `;
    })
    .join("");

  // Featured — bestsellers across categories
  let featuredItems = [];
  for (const cat in menuData) {
    menuData[cat].items.forEach((item) => {
      if (item.badge === "bestseller") featuredItems.push({ ...item, cat });
    });
  }
  // Pick 6 diverse ones
  const picks = featuredItems.slice(0, 6);
  featured.innerHTML = picks
    .map((item) => buildItemCard(item, item.cat))
    .join("");
}

// ============================
// MENU PAGE & SEARCH FIX
// ============================
let _menuRendered = false;
function renderMenu() {
  const pills = document.getElementById("catPills");
  const main = document.getElementById("menuMain");
  if (!pills || !main) return;

  if (_menuRendered && main.children.length > 0) {
    if (cart.length > 0) updateMenuCards();
    return;
  }
  _menuRendered = true;

  const cats = Object.keys(menuData);
  pills.innerHTML =
    '<button class="cat-pill active" onclick="scrollToCategory(\'all\');setActivePill(this)" data-cat="all">All Items</button>' +
    cats
      .map(
        (cat) =>
          `<button class="cat-pill" onclick="scrollToCategory('${cat}');setActivePill(this)" data-cat="${cat}">${cat}</button>`,
      )
      .join("");

  main.innerHTML = cats
    .map(
      (cat) => `
    <div class="menu-section" id="section-${cat.replace(/\s+/g, "_")}">
      <div class="menu-section-header">
        <h2 class="menu-section-title">${cat}</h2>
        <div class="menu-section-line"></div>
      </div>
      ${menuData[cat].jainNote ? `<div class="jain-category-note">${menuData[cat].jainNote}</div>` : ""}
      <div class="menu-grid">${menuData[cat].items.map((item) => buildItemCard(item, cat)).join("")}</div>
    </div>
  `,
    )
    .join("");

  // Re-apply any active search filter if text exists
  const searchInput = document.getElementById("menuSearch");
  if (searchInput && searchInput.value.trim() !== "") {
    filterMenu();
  }
}

function isMomoItem(item) {
  if (!item || !item.name) return false;
  return item.name.toLowerCase().includes("momo");
}

function buildItemCard(item, cat) {
  const badgeHtml =
    item.badge === "bestseller"
      ? `<div class="badge">Bestseller</div>`
      : item.badge === "new"
        ? `<div class="badge badge-new">New</div>`
        : "";

  const isJainItem = item.isJain === true;
  const jainBadgeHtml = isJainItem
    ? `<span class="badge badge-jain">Jain Available</span>`
    : "";
  const isMomo = isMomoItem(item);
  const hasCustom =
    isMomo ||
    (item.customizationOptions &&
      item.customizationOptions.choices &&
      item.customizationOptions.choices.length > 0);
  const inCartItems = cart.filter((c) => c.name === item.name);
  const totalInCart = inCartItems.reduce((s, c) => s + c.qty, 0);

  // If item has required customization/extra pieces or is not yet in cart, clicking opens modal
  let qtySection = "";
  if (hasCustom || totalInCart === 0) {
    qtySection = `<button class="add-btn" onclick="event.stopPropagation();openModal(${JSON.stringify(item).replace(/"/g, "&quot;")})">${totalInCart > 0 ? `Add (${totalInCart}) +` : "Add +"}</button>`;
  } else {
    qtySection = `<div class="qty-ctrl">
            <button class="qty-btn" onclick="event.stopPropagation();changeCartQtyByCartKey('${item.name}', -1)">−</button>
            <span class="qty-num">${totalInCart}</span>
            <button class="qty-btn" onclick="event.stopPropagation();changeCartQtyByCartKey('${item.name}', 1)">+</button>
          </div>`;
  }

  // Horizontal card layout for drinks (tall portrait images)
  const HORIZONTAL_CATS = [
    "Shakes & Frappe",
    "Mocktails",
    "Cold Coffee",
    "Hot Beverages",
  ];
  if (item.image && cat && HORIZONTAL_CATS.includes(cat)) {
    return `
    <div class="item-card item-card--photo item-card--horiz" onclick="openModal(${JSON.stringify(item).replace(/"/g, "&quot;")})">
      <div class="item-card-img-wrap item-card-img-wrap--side">
        <img class="item-card-img" src="${item.image}" alt="${item.name}" loading="lazy" onerror="this.onerror=null;this.src='assets/images/menu/placeholder-food.jpg'" />
        <div class="item-card-img-badges">
          <div class="veg-dot"></div>
          ${badgeHtml}
          ${jainBadgeHtml}
        </div>
      </div>
      <div class="item-card-body">
        <div class="item-name">${item.name}</div>
        <div class="item-desc">${item.desc}</div>
        <div class="item-card-footer">
          <div class="item-price"><span class="item-price-sym">&#8377;</span>${item.price}</div>
          ${qtySection}
        </div>
      </div>
    </div>
  `;
  }

  // Image card layout (for items with a photo)
  if (item.image) {
    return `
    <div class="item-card item-card--photo" onclick="openModal(${JSON.stringify(item).replace(/"/g, "&quot;")})">
      <div class="item-card-img-wrap">
        <img class="item-card-img" src="${item.image}" alt="${item.name}" loading="lazy" onerror="this.onerror=null;this.src='assets/images/menu/placeholder-food.jpg'" />
        <div class="item-card-img-overlay"></div>
        <div class="item-card-img-badges">
          <div class="veg-dot"></div>
          ${badgeHtml}
          ${jainBadgeHtml}
          ${isMomo ? `<span class="badge" style="background:rgba(200,149,42,0.12);color:var(--gold);border-color:rgba(200,149,42,0.3);">+₹20 / extra pc</span>` : ""}
          ${hasCustom && !isMomo ? `<span class="badge" style="background:rgba(45,80,22,0.1);color:var(--green-deep);border-color:rgba(45,80,22,0.25);">Customisable</span>` : ""}
        </div>
      </div>
      <div class="item-card-body">
        <div class="item-name">${item.name}</div>
        <div class="item-desc">${item.desc}</div>
        <div class="item-card-footer">
          <div class="item-price"><span class="item-price-sym">&#8377;</span>${item.price}</div>
          ${qtySection}
        </div>
      </div>
    </div>
  `;
  }

  return `
    <div class="item-card" onclick="openModal(${JSON.stringify(item).replace(/"/g, "&quot;")})">
      <div class="item-card-body">
        <div class="item-card-meta">
          <div class="veg-dot"></div>
          ${badgeHtml}
          ${jainBadgeHtml}
          ${isMomo ? `<span class="badge" style="background:rgba(200,149,42,0.12);color:var(--gold);border-color:rgba(200,149,42,0.3);">+₹20 / extra pc</span>` : ""}
          ${hasCustom && !isMomo ? `<span class="badge" style="background:rgba(45,80,22,0.1);color:var(--green-deep);border-color:rgba(45,80,22,0.25);">Customisable</span>` : ""}
        </div>
        <div class="item-name">${item.name}</div>
        <div class="item-desc">${item.desc}</div>
        <div class="item-card-footer">
          <div class="item-price"><span class="item-price-sym">&#8377;</span>${item.price}</div>
          ${qtySection}
        </div>
      </div>
    </div>
  `;
}

function getItemEmoji(name) {
  const n = name.toLowerCase();
  if (n.includes("pizza")) return "🍕";
  if (n.includes("burger")) return "🍔";
  if (n.includes("wrap")) return "🌯";
  if (n.includes("pasta")) return "🍝";
  if (n.includes("momo")) return "🥟";
  if (n.includes("maggi") || n.includes("ramen") || n.includes("noodle"))
    return "🍜";
  if (n.includes("sandwich") || n.includes("sub") || n.includes("toast"))
    return "🥪";
  if (n.includes("garlic bread") || n.includes("bread") || n.includes("bun"))
    return "🧄";
  if (n.includes("fries")) return "🍟";
  if (n.includes("nacho")) return "🫔";
  if (n.includes("salad") || n.includes("bowl") || n.includes("detox"))
    return "🥗";
  if (n.includes("chaat") || n.includes("chat")) return "🍲";
  if (n.includes("shake") || n.includes("frappe")) return "🥤";
  if (
    n.includes("coffee") ||
    n.includes("brew") ||
    n.includes("matcha") ||
    n.includes("biscoff")
  )
    return "☕";
  if (n.includes("tea") || n.includes("chai")) return "🍵";
  if (
    n.includes("mojito") ||
    n.includes("mocktail") ||
    n.includes("lemonade") ||
    n.includes("soda") ||
    n.includes("lagoon") ||
    n.includes("guava") ||
    n.includes("strawberry") ||
    n.includes("lemon")
  )
    return "🍹";
  if (n.includes("avocado")) return "🥑";
  if (n.includes("corn")) return "🌽";
  if (n.includes("falafel") || n.includes("hummus")) return "🫘";
  if (n.includes("churro") || n.includes("croissant")) return "🥐";
  if (n.includes("lava") || n.includes("chocolate") || n.includes("nutella"))
    return "🍫";
  if (n.includes("ice cream")) return "🍦";
  if (n.includes("paneer")) return "🧀";
  if (n.includes("mushroom")) return "🍄";
  return "🍽️";
}

function setActivePill(el) {
  document
    .querySelectorAll(".cat-pill")
    .forEach((p) => p.classList.remove("active"));
  el.classList.add("active");
}

function scrollToCategory(cat) {
  const wasOnMenu = _activePage === "menu";
  if (!wasOnMenu) {
    showPage("menu", false);
  }

  function doScroll() {
    if (cat === "all") {
      const searchInput = document.getElementById("menuSearch");
      if (searchInput && searchInput.value) {
        searchInput.value = "";
        toggleSearchClear(searchInput);
      }
      document.querySelectorAll(".menu-section").forEach((sec) => {
        sec.style.display = "";
        sec.querySelectorAll(".item-card").forEach((c) => (c.style.display = ""));
      });
      const pill = document.querySelector('.cat-pill[data-cat="all"]');
      if (pill) setActivePill(pill);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const pill = document.querySelector(`.cat-pill[data-cat="${cat}"]`);
    if (pill) setActivePill(pill);

    const el = document.getElementById("section-" + cat.replace(/\s+/g, "_"));
    if (el) {
      const nav = document.getElementById("mainNav");
      const navHeight = nav ? nav.offsetHeight : 64;
      const targetY = el.getBoundingClientRect().top + window.pageYOffset - navHeight - 16;
      window.scrollTo({ top: Math.max(0, targetY), behavior: "smooth" });
    }
  }

  if (wasOnMenu) {
    // Already on menu — scroll immediately
    requestAnimationFrame(doScroll);
  } else {
    // Cross-page nav — wait two frames for layout to settle
    requestAnimationFrame(() => requestAnimationFrame(doScroll));
  }
}

// Enhanced Search with Instant Multiterm Matching & Reset
function filterMenu() {
  const searchEl = document.getElementById("menuSearch");
  if (!searchEl) return;
  const q = searchEl.value.trim().toLowerCase();
  const sections = document.querySelectorAll(".menu-section");
  let totalMatches = 0;

  sections.forEach((sec) => {
    const catTitle =
      sec.querySelector(".menu-section-title")?.textContent.toLowerCase() || "";
    const cards = sec.querySelectorAll(".item-card");
    let visibleCount = 0;

    const jainNoteText =
      sec.querySelector(".jain-category-note")?.textContent.toLowerCase() || "";

    cards.forEach((card) => {
      const name =
        card.querySelector(".item-name")?.textContent.toLowerCase() || "";
      const desc =
        card.querySelector(".item-desc")?.textContent.toLowerCase() || "";

      // Match in item name, description, category, or jain note
      if (
        q === "" ||
        name.includes(q) ||
        desc.includes(q) ||
        catTitle.includes(q) ||
        (q === "jain" && jainNoteText.includes("jain"))
      ) {
        card.style.display = "";
        visibleCount++;
      } else {
        card.style.display = "none";
      }
    });

    if (visibleCount > 0) {
      sec.style.display = "";
      totalMatches += visibleCount;
    } else {
      sec.style.display = "none";
    }
  });

  // Show empty message if nothing matched
  let noResultsEl = document.getElementById("menuNoResults");
  if (totalMatches === 0 && q !== "") {
    if (!noResultsEl) {
      noResultsEl = document.createElement("div");
      noResultsEl.id = "menuNoResults";
      noResultsEl.style.textAlign = "center";
      noResultsEl.style.padding = "3rem 1rem";
      noResultsEl.style.color = "var(--brown-mid)";
      document.getElementById("menuMain")?.appendChild(noResultsEl);
    }
    noResultsEl.innerHTML = `
            <div style="font-size:2.5rem;margin-bottom:0.5rem;">🔍</div>
            <div style="font-family:'Playfair Display',serif;font-size:1.3rem;font-weight:700;color:var(--green-deep);margin-bottom:0.3rem;">No dishes found</div>
            <div style="font-size:0.85rem;">No items matched "<strong>${searchEl.value}</strong>". Try searching for paneer, momo, sub, shake, or pasta!</div>
            <button class="btn-primary" style="margin-top:1rem;padding:0.5rem 1.2rem;font-size:0.8rem;" onclick="clearMenuSearch()">Clear Search</button>
          `;
    noResultsEl.style.display = "block";
  } else if (noResultsEl) {
    noResultsEl.style.display = "none";
  }
}

function updateQuickTagButtons(activeTerm) {
  const allBtns = document.querySelectorAll(".quick-tag-btn");
  const target = (activeTerm || "").trim().toLowerCase();
  allBtns.forEach((btn) => {
    btn.style.borderColor = "";
    btn.style.color = "";
    btn.style.fontWeight = "";
    const btnText = btn.textContent.trim().toLowerCase();
    if (
      target &&
      (btnText === target ||
        (target === "jain" && btnText.includes("jain")) ||
        (target === "bestseller" && btnText.includes("bestseller")) ||
        btnText.includes(target))
    ) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

function quickSearch(term, btnEl) {
  const input = document.getElementById("menuSearch");
  const allBtns = document.querySelectorAll(".quick-tag-btn");

  // If clicking the already-active button, toggle it off (clear filter)
  if (btnEl && btnEl.classList.contains("active")) {
    allBtns.forEach((b) => {
      b.classList.remove("active");
      b.style.borderColor = "";
      b.style.color = "";
      b.style.fontWeight = "";
    });
    if (input) {
      input.value = "";
      toggleSearchClear(input);
      filterMenu();
    }
    return;
  }

  // Highlight ONLY the chosen button
  allBtns.forEach((b) => {
    b.classList.remove("active");
    b.style.borderColor = "";
    b.style.color = "";
    b.style.fontWeight = "";
  });

  if (btnEl) {
    btnEl.classList.add("active");
  } else {
    updateQuickTagButtons(term);
  }

  if (input) {
    if (term === "Bestseller") {
      input.value = "";
      toggleSearchClear(input);
      const sections = document.querySelectorAll(".menu-section");
      sections.forEach((sec) => {
        const cards = sec.querySelectorAll(".item-card");
        let visible = 0;
        cards.forEach((card) => {
          const isBestseller =
            card.querySelector(".badge") &&
            card.querySelector(".badge").textContent.includes("Bestseller");
          if (isBestseller) {
            card.style.display = "";
            visible++;
          } else card.style.display = "none";
        });
        sec.style.display = visible > 0 ? "" : "none";
      });
      const noRes = document.getElementById("menuNoResults");
      if (noRes) noRes.style.display = "none";
    } else {
      input.value = term;
      filterMenu();
      toggleSearchClear(input);
    }
  }
}

function toggleSearchClear(input) {
  const btn = document.getElementById("menuSearchClear");
  if (btn) btn.style.display = input.value.length > 0 ? "block" : "none";
}

function clearMenuSearch() {
  const input = document.getElementById("menuSearch");
  if (input) {
    input.value = "";
    toggleSearchClear(input);
    filterMenu();
  }
  document.querySelectorAll(".quick-tag-btn").forEach((b) => {
    b.classList.remove("active");
    b.style.borderColor = "";
    b.style.color = "";
    b.style.fontWeight = "";
  });
}

// ============================
// NUMBER & AMOUNT TICKER ANIMATION
// ============================
function animateNumericValue(el, targetValue, options = {}) {
  if (!el) return;
  const prefix = options.prefix !== undefined ? options.prefix : "₹";
  const suffix = options.suffix !== undefined ? options.suffix : "";
  const duration = options.duration || 320;

  // Read previous value from data-anim-value or textContent
  let startValue = 0;
  if (el.dataset && el.dataset.animValue !== undefined) {
    startValue = parseFloat(el.dataset.animValue) || 0;
  } else {
    const matched = (el.textContent || "").match(/[\d.]+/);
    startValue = matched ? parseFloat(matched[0]) : 0;
  }

  if (el.dataset) {
    el.dataset.animValue = targetValue;
  }

  // Cancel previous animation frame if still running
  if (el._animFrameId) {
    cancelAnimationFrame(el._animFrameId);
    el._animFrameId = null;
  }

  // Trigger directional bump animation
  const direction =
    options.direction || (targetValue >= startValue ? "up" : "down");
  el.classList.remove("amount-bump-up", "amount-bump-down");
  void el.offsetWidth; // Force CSS reflow
  el.classList.add(direction === "up" ? "amount-bump-up" : "amount-bump-down");
  el.addEventListener(
    "animationend",
    () => {
      el.classList.remove("amount-bump-up", "amount-bump-down");
    },
    { once: true },
  );

  if (startValue === targetValue) {
    if (options.formatHtml) {
      el.innerHTML = options.formatHtml(targetValue);
    } else {
      el.textContent = `${prefix}${targetValue}${suffix}`;
    }
    return;
  }

  const startTime = performance.now();

  function step(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // easeOutCubic curve for smooth natural deceleration
    const ease = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(startValue + (targetValue - startValue) * ease);

    if (options.formatHtml) {
      el.innerHTML = options.formatHtml(current);
    } else {
      el.textContent = `${prefix}${current}${suffix}`;
    }

    if (progress < 1) {
      el._animFrameId = requestAnimationFrame(step);
    } else {
      el._animFrameId = null;
      if (options.formatHtml) {
        el.innerHTML = options.formatHtml(targetValue);
      } else {
        el.textContent = `${prefix}${targetValue}${suffix}`;
      }
    }
  }

  el._animFrameId = requestAnimationFrame(step);
}

// ============================
// MODAL: CUSTOMIZATION & QUANTITIES
// ============================
function updateModalPriceDisplay(skipAnimation = false) {
  if (!currentItem) return;
  const plateTotal = currentItem.price * modalQty;
  const extraTotal = modalExtraPieces * 20;
  const grandModalTotal = plateTotal + extraTotal;

  // #modalPrice always shows the FIXED base item price — never changes, never animates
  const priceEl = document.getElementById("modalPrice");
  if (priceEl) {
    priceEl.textContent = "₹" + currentItem.price;
  }

  // Only the Add to Cart button shows and animates the running total
  const addBtn = document.getElementById("modalAddBtn");
  if (addBtn) {
    if (skipAnimation) {
      if (addBtn.dataset) addBtn.dataset.animValue = grandModalTotal;
      addBtn.innerHTML = `Add to Cart • ₹${grandModalTotal} &rarr;`;
    } else {
      animateNumericValue(addBtn, grandModalTotal, {
        formatHtml: (val) => `Add to Cart • ₹${val} &rarr;`,
      });
    }
  }

  const summaryEl = document.getElementById("modalExtraPieceSummary");
  if (summaryEl) {
    if (modalExtraPieces > 0) {
      summaryEl.style.display = "block";
      summaryEl.innerHTML = `+${modalExtraPieces} Extra Piece${modalExtraPieces > 1 ? "s" : ""} (+₹${extraTotal}) | Total: ₹${grandModalTotal}`;
    } else {
      summaryEl.style.display = "none";
    }
  }
}

function openModal(item) {
  currentItem = item;
  modalQty = 1;
  modalExtraPieces = 0;
  selectedCustomOption = "";

  document.getElementById("modalName").textContent = item.name;
  document.getElementById("modalDesc").textContent = item.desc;
  document.getElementById("modalNote").value = "";

  const modalImgWrap = document.getElementById("modalImgWrap");
  const modalImg = document.getElementById("modalImg");
  if (modalImgWrap && modalImg) {
    if (item.image) {
      modalImg.src = item.image;
      modalImg.alt = item.name;
      modalImgWrap.style.display = "block";
    } else {
      modalImgWrap.style.display = "none";
    }
  }
  const jainSec = document.getElementById("modalJainSection");
  const jainToggle = document.getElementById("modalJainToggle");
  if (jainSec && jainToggle) {
    if (item.isJain === true) {
      jainSec.style.display = "block";
      jainToggle.checked = false;
    } else {
      jainSec.style.display = "none";
      jainToggle.checked = false;
    }
  }

  // Reset Customization section
  const customSec = document.getElementById("modalCustomSection");
  const customLabel = document.getElementById("modalCustomLabel");
  const customOptions = document.getElementById("modalCustomOptions");
  const customErr = document.getElementById("modalCustomError");
  if (customErr) customErr.classList.remove("show");

  if (
    item.customizationOptions &&
    item.customizationOptions.choices &&
    item.customizationOptions.choices.length > 0
  ) {
    customSec.style.display = "block";
    customLabel.innerHTML = `${item.customizationOptions.label || "Customise"} ${item.customizationOptions.required ? '<span class="required-badge">Required</span>' : ""}`;
    customOptions.innerHTML = item.customizationOptions.choices
      .map(
        (choice) =>
          `<button type="button" class="custom-opt-btn" onclick="selectCustomOption(this, '${choice}')">${choice}</button>`,
      )
      .join("");
  } else {
    customSec.style.display = "none";
    customOptions.innerHTML = "";
  }

  // Reset Quantity pills
  document.querySelectorAll("#qtyPills .qty-pill-btn").forEach((b, i) => {
    b.classList.toggle("active", i === 0);
  });
  const customQtyWrap = document.getElementById("customQtyWrap");
  if (customQtyWrap) customQtyWrap.style.display = "none";
  const customQtyInput = document.getElementById("customQtyInput");
  if (customQtyInput) customQtyInput.value = "";

  // Momo Extra Pieces Section (Only available for Momos @ ₹20 / piece)
  const isMomo = isMomoItem(item);
  const extraSection = document.getElementById("modalExtraPieceSection");
  const qtyTitle = document.getElementById("modalQtyTitle");
  const qtySubtitle = document.getElementById("modalQtySubtitle");

  if (extraSection) {
    extraSection.style.display = isMomo ? "block" : "none";
  }
  const extraCountEl = document.getElementById("modalExtraPiecesCount");
  if (extraCountEl) extraCountEl.textContent = "0";

  if (qtyTitle) {
    qtyTitle.textContent = "Quantity";
  }
  if (qtySubtitle) {
    qtySubtitle.textContent = "Select quantity";
  }

  updateModalPriceDisplay(true);
  document.getElementById("itemModal").classList.add("open");
}

function closeModal() {
  document.getElementById("itemModal").classList.remove("open");
  currentItem = null;
  modalQty = 1;
  modalExtraPieces = 0;
  selectedCustomOption = "";
}

function selectCustomOption(btn, choice) {
  document
    .querySelectorAll("#modalCustomOptions .custom-opt-btn")
    .forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  selectedCustomOption = choice;
  const customErr = document.getElementById("modalCustomError");
  if (customErr) customErr.classList.remove("show");
}

function selectQtyPill(btn, qty) {
  document
    .querySelectorAll("#qtyPills .qty-pill-btn")
    .forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");

  const wrap = document.getElementById("customQtyWrap");
  const input = document.getElementById("customQtyInput");

  if (qty === "custom") {
    wrap.style.display = "flex";
    input.focus();
    modalQty = parseInt(input.value) || 6;
    input.value = modalQty;
  } else {
    wrap.style.display = "none";
    modalQty = parseInt(qty) || 1;
  }
  updateModalPriceDisplay();
}

function onCustomQtyInput(input) {
  let val = parseInt(input.value);
  if (isNaN(val) || val < 1) val = 1;
  if (val > 100) val = 100;
  modalQty = val;
  updateModalPriceDisplay();
}

function toggleModalJain(checkbox) {
  // Visual feedback when toggled
  if (checkbox && checkbox.checked) {
    showToast("🕊️ Jain preparation selected (no onion, garlic, or root veg)");
  }
}

function changeModalExtraPieces(delta) {
  modalExtraPieces = Math.max(0, modalExtraPieces + delta);
  const countEl = document.getElementById("modalExtraPiecesCount");
  if (countEl) {
    countEl.textContent = modalExtraPieces;
    animateQtyNum(countEl, delta > 0 ? "up" : "down");
  }
  updateModalPriceDisplay();
}

function confirmAddToCart() {
  if (!currentItem) return;

  // Customization validation
  if (
    currentItem.customizationOptions &&
    currentItem.customizationOptions.required &&
    !selectedCustomOption
  ) {
    const customErr = document.getElementById("modalCustomError");
    if (customErr) customErr.classList.add("show");
    showToast(
      "⚠️ Please select an option (e.g. Steamed / Grilled) to proceed.",
    );
    return;
  }

  const note = document.getElementById("modalNote").value.trim();
  const isJainSelected =
    document.getElementById("modalJainToggle")?.checked || false;
  addToCart(
    currentItem,
    modalQty,
    note,
    selectedCustomOption,
    modalExtraPieces,
    isJainSelected,
  );
  closeModal();

  const customText = selectedCustomOption ? ` (${selectedCustomOption})` : "";
  const extraText =
    modalExtraPieces > 0 ? ` + ${modalExtraPieces} Extra Pcs` : "";
  const jainText = isJainSelected ? " [🕊️ Jain]" : "";
  showToast(
    `✓ Added ${modalQty} × ${currentItem.name}${customText}${extraText}${jainText}! `,
  );
  updateMenuCards();
}

// ============================
// CART LOGIC WITH CUSTOMIZATION & EXTRA PIECES
// ============================
function getCartKey(name, customization, extraPieces = 0, isJain = false) {
  let key = name;
  if (customization) key += ` [${customization}]`;
  if (extraPieces > 0) key += ` [+${extraPieces}pcs]`;
  if (isJain) key += ` [🕊️ Jain]`;
  return key;
}

function addToCart(
  item,
  qty = 1,
  note = "",
  customization = "",
  extraPieces = 0,
  isJain = false,
) {
  const cartKey = getCartKey(item.name, customization, extraPieces, isJain);
  const idx = cart.findIndex((c) => c.cartKey === cartKey);

  if (idx >= 0) {
    cart[idx].qty += qty;
    if (note) cart[idx].note = note;
  } else {
    cart.push({
      ...item,
      cartKey,
      isJain: isJain || false,
      customization,
      extraPieces: extraPieces || 0,
      qty,
      note,
    });
  }
  updateCartUI("up");
  updateMenuCards();
}

function animateQtyNum(el, direction) {
  // direction: 'up' (increment) or 'down' (decrement)
  el.classList.remove("anim-up", "anim-down", "anim-pop");
  void el.offsetWidth; // force reflow
  el.classList.add(direction === "up" ? "anim-up" : "anim-down");
  el.addEventListener(
    "animationend",
    () => {
      el.classList.remove("anim-up", "anim-down");
    },
    { once: true },
  );
}

function updateBadgesAnimated(direction = "up") {
  const total = cart.reduce((s, c) => s + c.qty, 0);
  const navBadge = document.getElementById("navCartCount");
  const stickyBadge = document.getElementById("stickyCartCount");

  [navBadge, stickyBadge].forEach((el) => {
    if (!el) return;
    el.textContent = total;
    el.classList.remove("bump", "bump-up", "bump-down");
    void el.offsetWidth;
    el.classList.add(direction === "up" ? "bump-up" : "bump-down");
    el.addEventListener(
      "animationend",
      () => {
        el.classList.remove("bump-up", "bump-down");
      },
      { once: true },
    );
  });
}

function changeCartQtyByCartKey(cartKey, delta) {
  const idx = cart.findIndex((c) => c.cartKey === cartKey);
  if (idx < 0) return;

  // ── Item removed completely (qty reaches 0) ──
  if (cart[idx].qty + delta <= 0) {
    // Find matching cart-item in DOM for smooth exit animation
    let targetItemEl = null;
    document.querySelectorAll(".cart-item").forEach((el) => {
      if (el.dataset.cartKey === cartKey) targetItemEl = el;
    });

    cart.splice(idx, 1);

    // Animate totals down immediately
    const newSubtotal = getCartSubtotal();
    const subEl = document.getElementById("cartSubtotal");
    const totEl = document.getElementById("cartTotal");
    if (subEl) animateNumericValue(subEl, newSubtotal, { direction: "down" });
    if (totEl)
      animateNumericValue(
        totEl,
        newSubtotal > 0 ? newSubtotal + deliveryFee : 0,
        { direction: "down" },
      );

    // Animate badge counter down
    updateBadgesAnimated("down");
    updateMenuCards();
    saveSession();

    if (targetItemEl) {
      targetItemEl.classList.add("cart-item-removing");
      setTimeout(() => {
        renderCartBody();
      }, 270);
    } else {
      renderCartBody();
    }
    return;
  }

  // ── Quantity increment / decrement ──
  cart[idx].qty += delta;
  const newQty = cart[idx].qty;
  const item = cart[idx];
  const lineTotal = getItemLineTotal(item);
  const direction = delta > 0 ? "up" : "down";

  // Animate cart item qty-num and line price in-place
  document.querySelectorAll(".cart-item").forEach((itemEl) => {
    if (itemEl.dataset.cartKey === cartKey) {
      const numEl = itemEl.querySelector(".qty-num");
      if (numEl) {
        numEl.textContent = newQty;
        animateQtyNum(numEl, direction);
      }
      const priceEl = itemEl.querySelector(".cart-item-price");
      if (priceEl) {
        animateNumericValue(priceEl, lineTotal, { direction });
      }
    }
  });

  // Update cart subtotal & total in drawer with smooth counting
  const subtotal = getCartSubtotal();
  const subEl = document.getElementById("cartSubtotal");
  const totEl = document.getElementById("cartTotal");
  if (subEl) animateNumericValue(subEl, subtotal, { direction });
  if (totEl)
    animateNumericValue(totEl, subtotal > 0 ? subtotal + deliveryFee : 0, {
      direction,
    });

  // Update badges & menu cards
  updateBadgesAnimated(direction);
  updateMenuCards();
  saveSession();
}

function getItemLineTotal(item) {
  const plateTotal = item.price * item.qty;
  const extraTotal = (item.extraPieces || 0) * 20 * item.qty;
  return plateTotal + extraTotal;
}

function getCartSubtotal() {
  return cart.reduce((s, c) => s + getItemLineTotal(c), 0);
}

function updateCartUI(direction = "up") {
  updateBadgesAnimated(direction);
  renderCartBody();
  saveSession();
}

function renderCartBody() {
  const body = document.getElementById("cartBody");
  const footer = document.getElementById("cartFooter");
  if (!body || !footer) return;

  if (!cart.length) {
    body.innerHTML = `<div class="cart-empty"><div class="cart-empty-icon"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg></div><p>Your cart is empty.<br>Add something delicious!</p></div>`;
    footer.style.display = "none";
    const subEl = document.getElementById("cartSubtotal");
    const totEl = document.getElementById("cartTotal");
    if (subEl) {
      subEl.dataset.animValue = 0;
      subEl.textContent = "₹0";
    }
    if (totEl) {
      totEl.dataset.animValue = 0;
      totEl.textContent = "₹0";
    }
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
    <div class="cart-item" data-cart-key="${item.cartKey.replace(/"/g, "&quot;")}">
      ${thumbHtml}
      <div class="cart-item-info">
        <div class="cart-item-name">
          ${item.name}
          ${item.customization ? `<span style="display:inline-block;background:rgba(45,80,22,0.12);color:var(--green-deep);font-size:0.68rem;padding:0.12rem 0.45rem;border-radius:12px;font-weight:700;margin-left:0.25rem;">${item.customization}</span>` : ""}
          ${item.extraPieces > 0 ? `<span style="display:inline-block;background:rgba(200,149,42,0.15);color:var(--gold);font-size:0.68rem;padding:0.12rem 0.45rem;border-radius:12px;font-weight:700;margin-left:0.25rem;">+${item.extraPieces} extra pcs (+₹${item.extraPieces * 20})</span>` : ""}
          ${item.isJain ? `<span class="cart-item-jain-tag">Jain</span>` : ""}
        </div>
        <div class="cart-item-price" data-anim-value="${lineTotal}">₹${lineTotal}</div>
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
  const total = subtotal > 0 ? subtotal + deliveryFee : 0;
  const subEl = document.getElementById("cartSubtotal");
  const totEl = document.getElementById("cartTotal");
  if (subEl) animateNumericValue(subEl, subtotal);
  if (totEl) animateNumericValue(totEl, total);
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
  // Patch every item-card footer in-place — update add-btn text or qty-ctrl count
  // Works on both home (featured) and menu page cards without rebuilding the DOM
  document.querySelectorAll(".item-card").forEach((card) => {
    const nameEl = card.querySelector(".item-name");
    if (!nameEl) return;
    const itemName = nameEl.textContent.trim();

    // Find matching item in menuData to check customization flags
    let itemObj = null;
    for (const cat in menuData) {
      const found = menuData[cat].items.find((it) => it.name === itemName);
      if (found) { itemObj = found; break; }
    }
    if (!itemObj) return;

    const isMomo = isMomoItem(itemObj);
    const hasCustom = isMomo || (
      itemObj.customizationOptions &&
      itemObj.customizationOptions.choices &&
      itemObj.customizationOptions.choices.length > 0
    );

    const totalInCart = cart.filter((c) => c.name === itemName).reduce((s, c) => s + c.qty, 0);

    const footer = card.querySelector(".item-card-footer");
    if (!footer) return;

    // Remove existing control
    footer.querySelector(".add-btn")?.remove();
    footer.querySelector(".qty-ctrl")?.remove();

    // Build updated control
    if (hasCustom || totalInCart === 0) {
      const label = totalInCart > 0 ? `Add (${totalInCart}) +` : "Add +";
      const btn = document.createElement("button");
      btn.className = "add-btn";
      btn.innerHTML = label;
      btn.onclick = (e) => { e.stopPropagation(); openModal(itemObj); };
      footer.appendChild(btn);
    } else {
      const ctrl = document.createElement("div");
      ctrl.className = "qty-ctrl";
      ctrl.innerHTML = `
        <button class="qty-btn" onclick="event.stopPropagation();changeCartQtyByCartKey('${itemName.replace(/'/g, "\\'")}', -1)">−</button>
        <span class="qty-num">${totalInCart}</span>
        <button class="qty-btn" onclick="event.stopPropagation();changeCartQtyByCartKey('${itemName.replace(/'/g, "\\'")}', 1)">+</button>`;
      footer.appendChild(ctrl);
    }
  });
}

// ============================
// CHECKOUT & ORDER TYPE
// ============================
let currentOrderType = "delivery";

function setOrderType(type) {
  currentOrderType = type;
  const delBtn = document.getElementById("orderTypeDelivery");
  const dineBtn = document.getElementById("orderTypeDineIn");
  const addressCard = document.getElementById("addressCard");
  const tableGroup = document.getElementById("tableNumberGroup");
  const payLabel = document.getElementById("payMethodLabel");
  const paySub = document.getElementById("payMethodSub");
  const payNote = document.getElementById("payMethodNote");
  const prepTime = document.getElementById("checkoutPrepTime");
  const coDelLabel = document.getElementById("coDeliveryLabel");
  const custHeading = document.getElementById("custDetailsHeading");
  const instLabel = document.getElementById("instructionsLabel");

  if (type === "dinein") {
    if (delBtn) delBtn.classList.remove("active");
    if (dineBtn) dineBtn.classList.add("active");
    if (addressCard) addressCard.style.display = "none";
    if (tableGroup) tableGroup.style.display = "block";
    if (custHeading) custHeading.textContent = "Customer & Table Details";
    if (instLabel) instLabel.textContent = "Cooking Instructions (Optional)";
    if (payLabel) payLabel.textContent = "Pay at Table / Counter";
    if (paySub)
      paySub.textContent =
        "Pay via Cash, UPI, or Card at your table or counter";
    if (payNote)
      payNote.textContent =
        "Our staff will serve your freshly prepared dishes directly to your table.";
    if (prepTime)
      prepTime.innerHTML =
        "Fresh preparation to your table: <strong>10–20 min</strong>";
    if (coDelLabel) coDelLabel.textContent = "Dine-in Service";
  } else {
    if (delBtn) delBtn.classList.add("active");
    if (dineBtn) dineBtn.classList.remove("active");
    if (addressCard) addressCard.style.display = "block";
    if (tableGroup) tableGroup.style.display = "none";
    if (custHeading) custHeading.textContent = "Customer Details";
    if (instLabel) instLabel.textContent = "Cooking / Delivery Notes";
    if (payLabel) payLabel.textContent = "Cash on Delivery";
    if (paySub)
      paySub.textContent = "Pay in cash when order arrives at your doorstep";
    if (payNote)
      payNote.textContent =
        "Please keep exact cash ready for the delivery partner at the time of delivery.";
    if (prepTime)
      prepTime.innerHTML =
        "Preparation & fulfillment: <strong>20–35 min</strong>";
    if (coDelLabel) coDelLabel.textContent = "Delivery Fee";
  }

  renderCheckout();
}

function renderCheckout() {
  const subtotal = getCartSubtotal();
  const activeDeliveryFee = currentOrderType === "dinein" ? 0 : deliveryFee;
  const total =
    subtotal > 0
      ? Math.max(0, subtotal + activeDeliveryFee - appliedDiscount)
      : 0;
  const coSub = document.getElementById("coSubtotal");
  const coDel = document.getElementById("coDelivery");
  const coTot = document.getElementById("coTotal");
  if (coSub) animateNumericValue(coSub, subtotal);
  if (coDel) {
    if (currentOrderType === "dinein") {
      coDel.textContent = "Free";
      if (coDel.dataset) coDel.dataset.animValue = 0;
    } else {
      animateNumericValue(coDel, activeDeliveryFee);
    }
  }
  if (coTot) animateNumericValue(coTot, total);
  if (appliedDiscount > 0) {
    document.getElementById("coDiscountRow").style.display = "flex";
    const coDisc = document.getElementById("coDiscount");
    if (coDisc) animateNumericValue(coDisc, appliedDiscount, { prefix: "-₹" });
  } else {
    document.getElementById("coDiscountRow").style.display = "none";
  }

  const itemsEl = document.getElementById("checkoutItems");
  if (!cart.length) {
    itemsEl.innerHTML =
      '<p style="font-size:0.82rem;color:var(--brown-mid);">No items in cart.</p>';
    return;
  }
  itemsEl.innerHTML = cart
    .map((item) => {
      const lineTotal = getItemLineTotal(item);
      const customStr = item.customization ? ` (${item.customization})` : "";
      const extraStr =
        item.extraPieces > 0 ? ` + ${item.extraPieces} extra pcs` : "";
      return `
    <div class="summary-item">
      <span>
        ${item.name}${customStr}${item.isJain ? ` <strong style="color:#206d20;">[Jain Preparation]</strong>` : ""}${extraStr ? `<strong style="color:var(--gold);"> [${extraStr.trim()}]</strong>` : ""} × ${item.qty}
      </span>
      <span>₹${lineTotal}</span>
    </div>
  `;
    })
    .join("");
}

function showError(fieldId, errId) {
  const input = document.getElementById(fieldId);
  const errSpan = document.getElementById(errId);
  if (input) input.classList.add("invalid-field");
  if (errSpan) errSpan.classList.add("show");
}

function clearError(inputEl) {
  if (!inputEl) return;
  inputEl.classList.remove("invalid-field");
  const parent = inputEl.parentElement;
  if (parent) {
    const errSpan = parent.querySelector(".field-error");
    if (errSpan) errSpan.classList.remove("show");
  }
}

function validateCheckout() {
  let isValid = true;
  let firstErrEl = null;

  function check(condition, fieldId, errId) {
    if (!condition) {
      showError(fieldId, errId);
      isValid = false;
      if (!firstErrEl) firstErrEl = document.getElementById(fieldId);
    } else {
      const input = document.getElementById(fieldId);
      if (input) clearError(input);
    }
  }

  // Validate Customer Details
  const fn = document.getElementById("firstName").value.trim();
  const ln = document.getElementById("lastName").value.trim();
  const ph = document.getElementById("phone").value.trim();
  const em = document.getElementById("email").value.trim();

  check(fn.length >= 2, "firstName", "err-firstName");
  check(ln.length >= 2, "lastName", "err-lastName");
  check(/^[6-9]\d{9}$/.test(ph), "phone", "err-phone");
  check(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em), "email", "err-email");

  // Validate Order Type specific fields
  if (currentOrderType === "dinein") {
    // For Order at Table: ONLY Table Number is required!
    const tableNo = document.getElementById("tableNumber")?.value.trim() || "";
    check(tableNo.length >= 1, "tableNumber", "err-tableNumber");
  } else {
    // For Home Delivery: Delivery Address fields are required
    const flat = document.getElementById("flat").value.trim();
    const street = document.getElementById("street").value.trim();
    const city = document.getElementById("city").value.trim();
    const pin = document.getElementById("pincode").value.trim();

    check(flat.length >= 1, "flat", "err-flat");
    check(street.length >= 2, "street", "err-street");
    check(city.length >= 2, "city", "err-city");
    check(/^\d{6}$/.test(pin), "pincode", "err-pincode");
  }

  if (!isValid && firstErrEl) {
    firstErrEl.scrollIntoView({ behavior: "smooth", block: "center" });
    firstErrEl.focus();
  }

  return isValid;
}

function applyCoupon() {
  const code = document
    .getElementById("couponInput")
    .value.trim()
    .toUpperCase();
  const coupons = {
    VEGSTUDIO10: 10,
    PUREVEG: 20,
    FIRSTORDER: 50,
    STUDIO20: 20,
  };
  const subtotal = getCartSubtotal();
  if (coupons[code]) {
    appliedDiscount = Math.round((subtotal * coupons[code]) / 100);
    showToast(`✓ Coupon applied! ₹${appliedDiscount} off`);
    renderCheckout();
  } else {
    showToast("✕ Invalid coupon code");
  }
}

// ============================
// GOOGLE SHEETS ORDER SYNC
// ============================
async function syncOrderToGoogleSheet(orderPayload) {
  if (!GOOGLE_SHEETS_SCRIPT_URL || GOOGLE_SHEETS_SCRIPT_URL.trim() === "") {
    console.info(
      "Google Sheets integration: GOOGLE_SHEETS_SCRIPT_URL is not set.",
    );
    return;
  }

  try {
    await fetch(GOOGLE_SHEETS_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(orderPayload),
    });
    console.log(
      "Order synced to Google Sheets successfully:",
      orderPayload.orderId,
    );
  } catch (err) {
    console.error("Google Sheets sync error:", err);
  }
}

function placeOrder() {
  if (!cart.length) {
    showToast("Your cart is empty! Please add dishes to order.");
    return;
  }

  if (!validateCheckout()) {
    showToast("Please fill in all required details correctly.");
    return;
  }

  const fn = document.getElementById("firstName").value.trim();
  const ln = document.getElementById("lastName").value.trim();
  const ph = document.getElementById("phone").value.trim();
  const em = document.getElementById("email").value.trim();
  const instructions =
    document.getElementById("instructions")?.value.trim() || "";
  const isDineIn = currentOrderType === "dinein";
  const tableNo = isDineIn
    ? document.getElementById("tableNumber")?.value.trim() || ""
    : "";

  const orderId = Math.floor(100000 + Math.random() * 900000);
  const orderDateStr = new Date().toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  // Fill receipt
  document.getElementById("receiptOrderId").textContent = "#TVS-" + orderId;
  document.getElementById("receiptDateTime").textContent = orderDateStr;
  document.getElementById("receiptCustName").textContent = fn + " " + ln;
  document.getElementById("receiptCustPhone").textContent = "+91 " + ph;
  document.getElementById("receiptCustEmail").textContent = em;

  const flat = document.getElementById("flat")?.value.trim() || "";
  const street = document.getElementById("street")?.value.trim() || "";
  const city = document.getElementById("city")?.value.trim() || "";
  const pin = document.getElementById("pincode")?.value.trim() || "";
  const landmark = document.getElementById("landmark")?.value.trim() || "";
  const formattedAddress = isDineIn
    ? `Dine-in at Café (Table: ${tableNo})`
    : `${flat}, ${street}, ${landmark ? landmark + ", " : ""}${city} - ${pin}`;

  document.getElementById("receiptType").textContent = isDineIn
    ? "Order at Table (Dine-in)"
    : "Home Delivery";
  document.getElementById("receiptAddress").textContent = isDineIn
    ? `Table: ${tableNo}`
    : formattedAddress;

  const paymentMethodStr = isDineIn
    ? "Pay at Table / Counter"
    : "Cash on Delivery (Pay on arrival)";
  document.getElementById("receiptPayMethod").textContent = paymentMethodStr;

  // Financials
  const subtotal = getCartSubtotal();
  const activeDeliveryFee = isDineIn ? 0 : deliveryFee;
  const total = Math.max(0, subtotal + activeDeliveryFee - appliedDiscount);

  document.getElementById("receiptSubtotal").textContent = "₹" + subtotal;
  const receiptDelLabel = document.getElementById("receiptDeliveryLabel");
  if (receiptDelLabel) {
    receiptDelLabel.textContent = isDineIn
      ? "Dine-in Service"
      : "Delivery Charges";
  }
  document.getElementById("receiptDeliveryFee").textContent = isDineIn
    ? "Free"
    : "₹" + deliveryFee;

  if (appliedDiscount > 0) {
    document.getElementById("receiptDiscountRow").style.display = "flex";
    document.getElementById("receiptDiscount").textContent =
      "-₹" + appliedDiscount;
  } else {
    document.getElementById("receiptDiscountRow").style.display = "none";
  }

  document.getElementById("receiptTotalPaid").textContent = "₹" + total;

  // Render ordered items list in receipt with Customization & Extra Pieces Details
  document.getElementById("receiptItemsList").innerHTML = cart
    .map((item) => {
      const lineTotal = getItemLineTotal(item);
      return `
              <div style="display: flex; justify-content: space-between; font-size: 0.85rem; padding: 0.35rem 0; border-bottom: 1px solid var(--cream);">
                <span>
                  <strong>${item.name}</strong>
                  ${item.isJain ? `<span style="color:#206d20;font-weight:700;"> [Jain Preparation]</span>` : ""}
                  ${item.customization ? `<span style="color:var(--green-mid);font-weight:700;"> [${item.customization}]</span>` : ""}
                  ${item.extraPieces > 0 ? `<span style="color:var(--gold);font-weight:700;"> (+${item.extraPieces} Extra Pcs)</span>` : ""}
                  ${item.note ? `<span style="font-size:0.75rem;color:var(--brown-mid);display:block;">Note: ${item.note}</span>` : ""}
                  × ${item.qty}
                </span>
                <span style="font-weight: 700; color: var(--green-deep);">₹${lineTotal}</span>
              </div>
            `;
    })
    .join("");

  // Construct Google Sheet Payload with clean structured items
  const sheetItemsSummary = cart
    .map((i, idx) => {
      let itemText = `${idx + 1}. ${i.name}`;
      if (i.isJain) itemText += " [JAIN FOOD]";
      if (i.customization && i.customization !== "Standard") {
        itemText += ` (${i.customization})`;
      }
      itemText += ` × ${i.qty}`;
      if (i.extraPieces > 0) {
        itemText += ` [+${i.extraPieces} extra pcs]`;
      }
      itemText += ` = ₹${getItemLineTotal(i)}`;
      if (i.note) {
        itemText += ` [Note: ${i.note}]`;
      }
      return itemText;
    })
    .join("\n");

  const googleSheetOrderPayload = {
    orderId: "#TVS-" + orderId,
    orderDate: orderDateStr,
    customerName: fn + " " + ln,
    phone: "+91 " + ph,
    email: em || "N/A",
    deliveryType: isDineIn ? `Order at Table (${tableNo})` : "Home Delivery",
    address: formattedAddress,
    paymentMethod: isDineIn ? "Pay at Table / Counter" : "Cash on Delivery",
    items: sheetItemsSummary,
    itemsDetail: cart.map((i) => ({
      name: i.name,
      isJain: i.isJain || false,
      customization: i.customization || "Standard",
      quantity: i.qty,
      extraPieces: i.extraPieces || 0,
      unitPrice: i.price,
      lineTotal: getItemLineTotal(i),
      note: i.note || "",
    })),
    subtotal: Number(subtotal),
    deliveryFee: Number(activeDeliveryFee),
    discount: Number(appliedDiscount),
    totalPaid: Number(total),
    specialInstructions:
      instructions || (isDineIn ? `Table: ${tableNo}` : "None"),
  };

  // Sync to Google Sheet
  syncOrderToGoogleSheet(googleSheetOrderPayload);

  // Reset cart & state
  cart = [];
  appliedDiscount = 0;
  updateCartUI();
  clearSession(); // Order placed — start fresh next visit

  showToast("🎉 Order placed successfully!");
  showPage("confirmation");
}

// ============================
// TOAST
// ============================
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2800);
}

// ============================
// NAV ACTIVE STATE
// ============================
function updateNavActive(page) {
  document
    .querySelectorAll(".nav-links a:not(.cart-btn)")
    .forEach((a) => a.classList.remove("nav-active"));
  const t = document.getElementById("nav-" + page);
  if (t) t.classList.add("nav-active");

  // Keep mobile bottom navigation tabs in sync (using textContent to avoid layout thrash)
  document.querySelectorAll(".bottom-nav-item").forEach((b) => {
    const text = (b.textContent || "").trim().toLowerCase();
    if (text === page || text.includes(page)) {
      b.classList.add("active");
    } else {
      b.classList.remove("active");
    }
  });
}

// ============================
// INIT — Always start clean at home
// ============================
(function initApp() {
  restoreSession();
  renderHome();
  showPage("home", false);
  updateNavActive("home");

  if (cart.length > 0) {
    updateCartUI();
    updateMenuCards();
  }
})();

// Save scroll position on scroll (throttled to every 500ms)
let _scrollSaveTimer = null;
window.addEventListener(
  "scroll",
  () => {
    if (_scrollSaveTimer) return;
    _scrollSaveTimer = setTimeout(() => {
      saveSession();
      _scrollSaveTimer = null;
    }, 500);
  },
  { passive: true },
);

// Close modal on overlay click
document.getElementById("itemModal").addEventListener("click", function (e) {
  if (e.target === this) closeModal();
});

// ================================================
// PAGE LOADER CONTROLLER — The Veg Studio
// Smooth, fast dissolve on first load
// ================================================
(function () {
  var loader = document.getElementById("page-loader");
  var dismissed = false;

  function exitLoader() {
    if (dismissed) return;
    dismissed = true;
    if (!loader) return;

    loader.classList.add("fade-out");
    setTimeout(function () {
      loader.classList.add("gone");
    }, 450);
  }

  // Dismiss cleanly on load
  if (document.readyState === "complete") {
    setTimeout(exitLoader, 250);
  } else {
    window.addEventListener("load", function () {
      setTimeout(exitLoader, 250);
    });
  }

  // Guaranteed fallback so loader never hangs
  setTimeout(exitLoader, 1500);

  // Early dismiss on tap
  ["touchstart", "pointerdown", "click"].forEach(function (evt) {
    window.addEventListener(evt, exitLoader, { passive: true, once: true });
  });
})();

