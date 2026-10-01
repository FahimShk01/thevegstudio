// ============================\n// PAGE NAVIGATION
      // ============================
      function showPage(pageId) {
        document
          .querySelectorAll(".page")
          .forEach((p) => p.classList.remove("active"));
        const el = document.getElementById("page-" + pageId);
        if (el) {
          el.classList.add("active");
          window.scrollTo(0, 0);
        }
        if (pageId === "menu") renderMenu();
        if (pageId === "checkout") renderCheckout();
        if (pageId === "home") renderHome();
        // Close mobile menu
        closeMobileMenu();
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
        const warmImages = [
          "founder_chef_studio.jpg",
          "veg_studio_logo_hq.jpg",
        ];
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
      function renderHome() {
        // Category grid
        const catGrid = document.getElementById("homeCatGrid");
        if (!catGrid) return;
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
    <div class="cat-card" onclick="showPage('menu'); scrollToCategory('${cat}')">
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
        const featured = document.getElementById("homeFeatured");
        if (!featured) return;
        let featuredItems = [];
        for (const cat in menuData) {
          menuData[cat].items.forEach((item) => {
            if (item.badge === "bestseller")
              featuredItems.push({ ...item, cat });
          });
        }
        // Pick 6 diverse ones
        const picks = featuredItems.slice(0, 6);
        featured.innerHTML = picks.map((item) => buildItemCard(item)).join("");
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
      }

      // ============================
