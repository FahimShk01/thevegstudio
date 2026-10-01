// ============================\n// MENU PAGE & SEARCH FIX
      // ============================
      function renderMenu() {
        const pills = document.getElementById("catPills");
        const main = document.getElementById("menuMain");
        if (!pills || !main) return;
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
        const jainBadgeHtml = isJainItem ? `<span class="badge badge-jain">Jain Available</span>` : "";
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
        const HORIZONTAL_CATS = ['Shakes & Frappe', 'Mocktails', 'Cold Coffee', 'Hot Beverages'];
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
        if (
          n.includes("garlic bread") ||
          n.includes("bread") ||
          n.includes("bun")
        )
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
        if (
          n.includes("lava") ||
          n.includes("chocolate") ||
          n.includes("nutella")
        )
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
        if (cat === "all") {
          // Reset search and scroll top
          const searchInput = document.getElementById("menuSearch");
          if (searchInput && searchInput.value) {
            searchInput.value = "";
            toggleSearchClear(searchInput);
          }
          const sections = document.querySelectorAll(".menu-section");
          sections.forEach((sec) => {
            sec.style.display = "";
            sec
              .querySelectorAll(".item-card")
              .forEach((c) => (c.style.display = ""));
          });
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }
        const el = document.getElementById(
          "section-" + cat.replace(/\s+/g, "_"),
        );
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
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
            sec
              .querySelector(".menu-section-title")
              ?.textContent.toLowerCase() || "";
          const cards = sec.querySelectorAll(".item-card");
          let visibleCount = 0;

          cards.forEach((card) => {
            const name =
              card.querySelector(".item-name")?.textContent.toLowerCase() || "";
            const desc =
              card.querySelector(".item-desc")?.textContent.toLowerCase() || "";

            // Match in item name, description, or category
            if (
              q === "" ||
              name.includes(q) ||
              desc.includes(q) ||
              catTitle.includes(q)
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
                  card
                    .querySelector(".badge")
                    .textContent.includes("Bestseller");
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
