// ============================\n// MODAL: CUSTOMIZATION & QUANTITIES
      // ============================
      function updateModalPriceDisplay() {
        if (!currentItem) return;
        const plateTotal = currentItem.price * modalQty;
        const extraTotal = modalExtraPieces * 20;
        const grandModalTotal = plateTotal + extraTotal;

        const priceEl = document.getElementById("modalPrice");
        if (priceEl) {
          priceEl.textContent = "₹" + grandModalTotal;
        }

        const addBtn = document.getElementById("modalAddBtn");
        if (addBtn) {
          addBtn.innerHTML = `Add to Cart • ₹${grandModalTotal} &rarr;`;
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

        updateModalPriceDisplay();
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

      function changeModalExtraPieces(delta) {
        modalExtraPieces = Math.max(0, modalExtraPieces + delta);
        const countEl = document.getElementById("modalExtraPiecesCount");
        if (countEl) countEl.textContent = modalExtraPieces;
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
        addToCart(
          currentItem,
          modalQty,
          note,
          selectedCustomOption,
          modalExtraPieces,
        );
        closeModal();

        const customText = selectedCustomOption
          ? ` (${selectedCustomOption})`
          : "";
        const extraText =
          modalExtraPieces > 0 ? ` + ${modalExtraPieces} Extra Pcs` : "";
        showToast(
          `✓ Added ${modalQty} × ${currentItem.name}${customText}${extraText}!`,
        );
        updateMenuCards();
      }

      // ============================
