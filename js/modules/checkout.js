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
    if (paySub) paySub.textContent = "Pay via Cash, UPI, or Card at your table or counter";
    if (payNote) payNote.textContent = "Our staff will serve your freshly prepared dishes directly to your table.";
    if (prepTime) prepTime.innerHTML = "Fresh preparation to your table: <strong>10–20 min</strong>";
    if (coDelLabel) coDelLabel.textContent = "Dine-in Service";
  } else {
    if (delBtn) delBtn.classList.add("active");
    if (dineBtn) dineBtn.classList.remove("active");
    if (addressCard) addressCard.style.display = "block";
    if (tableGroup) tableGroup.style.display = "none";
    if (custHeading) custHeading.textContent = "Customer Details";
    if (instLabel) instLabel.textContent = "Cooking / Delivery Notes";
    if (payLabel) payLabel.textContent = "Cash on Delivery";
    if (paySub) paySub.textContent = "Pay in cash when order arrives at your doorstep";
    if (payNote) payNote.textContent = "Please keep exact cash ready for the delivery partner at the time of delivery.";
    if (prepTime) prepTime.innerHTML = "Preparation & fulfillment: <strong>20–35 min</strong>";
    if (coDelLabel) coDelLabel.textContent = "Delivery Fee";
  }

  renderCheckout();
}

function renderCheckout() {
  const subtotal = getCartSubtotal();
  const activeDeliveryFee = currentOrderType === "dinein" ? 0 : deliveryFee;
  const total = subtotal + activeDeliveryFee - appliedDiscount;
  document.getElementById("coSubtotal").textContent = "₹" + subtotal;
  const coDel = document.getElementById("coDelivery");
  if (coDel) {
    coDel.textContent = currentOrderType === "dinein" ? "Free" : "₹" + activeDeliveryFee;
  }
  document.getElementById("coTotal").textContent = "₹" + total;
  if (appliedDiscount > 0) {
    document.getElementById("coDiscountRow").style.display = "flex";
    document.getElementById("coDiscount").textContent =
      "-₹" + appliedDiscount;
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
            const customStr = item.customization
              ? ` (${item.customization})`
              : "";
            const extraStr =
              item.extraPieces > 0 ? ` + ${item.extraPieces} extra pcs` : "";
            return `
    <div class="summary-item">
      <span>
        ${item.name}${customStr}${extraStr ? `<strong style="color:var(--gold);"> [${extraStr.trim()}]</strong>` : ""} • ${item.qty}
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
          const tableNo =
            document.getElementById("tableNumber")?.value.trim() || "";
          check(tableNo.length >= 1, "tableNumber", "err-tableNumber");
        } else {
          // Validate Delivery Address
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
          showToast("✗ Invalid coupon code");
        }
      }

      // ============================
      // GOOGLE SHEETS ORDER SYNC
      // ============================
      async function syncOrderToGoogleSheet(orderPayload) {
        if (
          !GOOGLE_SHEETS_SCRIPT_URL ||
          GOOGLE_SHEETS_SCRIPT_URL.trim() === ""
        ) {
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
          showToast("⚠️ Your cart is empty! Please add dishes to order.");
          return;
        }

        if (!validateCheckout()) {
          showToast("⚠️ Please fill in all required details correctly.");
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
        document.getElementById("receiptOrderId").textContent =
          "#TVS-" + orderId;
        document.getElementById("receiptDateTime").textContent = orderDateStr;
        document.getElementById("receiptCustName").textContent = fn + " " + ln;
        document.getElementById("receiptCustPhone").textContent = "+91 " + ph;
        document.getElementById("receiptCustEmail").textContent = em;

        const flat = document.getElementById("flat")?.value.trim() || "";
        const street = document.getElementById("street")?.value.trim() || "";
        const city = document.getElementById("city")?.value.trim() || "";
        const pin = document.getElementById("pincode")?.value.trim() || "";
        const landmark =
          document.getElementById("landmark")?.value.trim() || "";
        const formattedAddress = isDineIn
          ? `Dine-in at Café (Table: ${tableNo})`
          : `${flat}, ${street}, ${landmark ? landmark + ", " : ""}${city} - ${pin}`;

        document.getElementById("receiptType").textContent = isDineIn
          ? "🍽️ Order at Table"
          : "🛵 Home Delivery";
        document.getElementById("receiptAddress").textContent = isDineIn
          ? `Table: ${tableNo}`
          : formattedAddress;

        const paymentMethodStr = isDineIn
          ? "💳 Pay at Table / Counter"
          : "💵 Cash on Delivery (Pay on arrival)";
        document.getElementById("receiptPayMethod").textContent =
          paymentMethodStr;

        // Financials
        const subtotal = getCartSubtotal();
        const activeDeliveryFee = isDineIn ? 0 : deliveryFee;
        const total = subtotal + activeDeliveryFee - appliedDiscount;

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
        document.getElementById("receiptTax").textContent = "₹" + tax;

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
                  ${item.customization ? `<span style="color:var(--green-mid);font-weight:700;"> [${item.customization}]</span>` : ""}
                  ${item.extraPieces > 0 ? `<span style="color:var(--gold);font-weight:700;"> (+${item.extraPieces} Extra Pcs)</span>` : ""}
                  ${item.note ? `<span style="font-size:0.75rem;color:var(--brown-mid);display:block;">Note: ${item.note}</span>` : ""}
                  • ${item.qty}
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
            if (i.customization && i.customization !== "Standard") {
              itemText += ` (${i.customization})`;
            }
            itemText += ` • ${i.qty}`;
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
          deliveryType: "Home Delivery",
          address: formattedAddress,
          paymentMethod: "Cash on Delivery",
          items: sheetItemsSummary,
          itemsDetail: cart.map((i) => ({
            name: i.name,
            customization: i.customization || "Standard",
            quantity: i.qty,
            extraPieces: i.extraPieces || 0,
            unitPrice: i.price,
            lineTotal: getItemLineTotal(i),
            note: i.note || "",
          })),
          subtotal: Number(subtotal),
          deliveryFee: Number(deliveryFee),
          tax: Number(tax),
          discount: Number(appliedDiscount),
          totalPaid: Number(total),
          specialInstructions: instructions || "None",
        };

        // Sync to Google Sheet
        syncOrderToGoogleSheet(googleSheetOrderPayload);

        // Reset cart & state
        cart = [];
        appliedDiscount = 0;
        updateCartUI();

        showToast("🎉 Order placed successfully!");
        showPage("confirmation");
      }

      // ============================
