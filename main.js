const menuBtn = document.getElementById("menu-btn");
const navLinks = document.getElementById("nav-links");
const menuBtnIcon = menuBtn.querySelector("i");

menuBtn.addEventListener("click", (e) => {
  navLinks.classList.toggle("open");

  const isOpen = navLinks.classList.contains("open");
  menuBtnIcon.setAttribute("class", isOpen ? "ri-close-line" : "ri-menu-line");
});

navLinks.addEventListener("click", (e) => {
  navLinks.classList.remove("open");
  menuBtnIcon.setAttribute("class", "ri-menu-line");
});

const scrollRevealOption = {
  distance: "50px",
  origin: "bottom",
  duration: 1000,
};

ScrollReveal().reveal(".header__image img", {
  ...scrollRevealOption,
  origin: "right",
});
ScrollReveal().reveal(".header__content h2", {
  ...scrollRevealOption,
  delay: 500,
});
ScrollReveal().reveal(".header__content h1", {
  ...scrollRevealOption,
  delay: 1000,
});

ScrollReveal().reveal(".order__card", {
  ...scrollRevealOption,
  interval: 500,
});

ScrollReveal().reveal(".event__content", {
  duration: 1000,
});

const cartCountBadges = document.querySelectorAll("[data-cart-count]");
const addToCartButtons = document.querySelectorAll("[data-add-to-cart]");
const cartStorageKey = "vocCartItems";
const cartPanel = document.getElementById("cart");
const cartContent = document.querySelector(".cart-content");
const cartTotal = document.querySelector(".total-price");
const minimumOrderKg = 25;
const cartProducts = new Map();

document.querySelectorAll(".spices-box").forEach((product) => {
  const id = product.dataset.productId;
  cartProducts.set(id, {
    id,
    name: product.querySelector(".spices-title").textContent.trim(),
    image: product.querySelector(".spices-image").getAttribute("src"),
    price: Number(product.dataset.pricePerKg),
    minQuantity: Number(product.dataset.minQuantity) || minimumOrderKg,
  });
});

document
  .querySelectorAll("[data-product-name][data-product-id][data-price-per-kg]")
  .forEach((button) => {
  cartProducts.set(button.dataset.productId, {
    id: button.dataset.productId,
    name: button.dataset.productName,
    image: button.dataset.productImage,
    price: Number(button.dataset.pricePerKg),
    minQuantity: Number(button.dataset.minQuantity) || minimumOrderKg,
  });
});

const normalizeQuantity = (quantity, minimum = minimumOrderKg) =>
  Math.max(
    minimum,
    Math.ceil((Number.parseInt(quantity, 10) || minimum) / minimum) * minimum,
  );

let cartItems = JSON.parse(localStorage.getItem(cartStorageKey) || "[]").map(
  (item) => {
    const product = cartProducts.get(item.id);
    return {
      ...item,
      price: product?.price ?? item.price,
      minQuantity: product?.minQuantity ?? minimumOrderKg,
      quantity: normalizeQuantity(item.quantity, product?.minQuantity),
    };
  },
);

const formatWon = (amount) => `₩${amount.toLocaleString("ko-KR")}`;

const saveCart = () => {
  localStorage.setItem(cartStorageKey, JSON.stringify(cartItems));
  renderCart();
};

const renderCart = () => {
  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  cartCountBadges.forEach((badge) => {
    badge.textContent = itemCount;
  });

  if (!cartContent || !cartTotal) return;

  cartContent.replaceChildren();
  if (cartItems.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "cart-empty";
    emptyMessage.textContent = "Your cart is empty.";
    cartContent.append(emptyMessage);
  }

  cartItems.forEach((item) => {
    const row = document.createElement("div");
    row.className = "cart-box";

    const image = document.createElement("img");
    image.className = "cart-img";
    image.src = item.image;
    image.alt = item.name;

    const details = document.createElement("div");
    details.className = "detail-box";

    const title = document.createElement("div");
    title.className = "cart-product-title";
    title.textContent = item.name;

    const prices = document.createElement("div");
    prices.className = "price-box";

    const unitPrice = document.createElement("div");
    unitPrice.className = "cart-price";
    unitPrice.textContent = `${formatWon(item.price)}/KG`;

    const amount = document.createElement("div");
    amount.className = "cart-amt";
    amount.textContent = formatWon(item.price * item.quantity);

    prices.append(unitPrice, amount);

    const quantity = document.createElement("input");
    quantity.className = "cart-quantity";
    quantity.type = "number";
    quantity.min = String(item.minQuantity || minimumOrderKg);
    quantity.step = String(item.minQuantity || minimumOrderKg);
    quantity.value = item.quantity;
    quantity.setAttribute("aria-label", `Quantity of ${item.name}`);
    quantity.addEventListener("change", () => {
      item.quantity = normalizeQuantity(quantity.value, item.minQuantity);
      saveCart();
    });

    details.append(title, prices, quantity);

    const removeButton = document.createElement("button");
    removeButton.className = "cart-remove fa fa-trash";
    removeButton.type = "button";
    removeButton.setAttribute("aria-label", `Remove ${item.name}`);
    removeButton.addEventListener("click", () => {
      cartItems = cartItems.filter((cartItem) => cartItem.id !== item.id);
      saveCart();
    });

    row.append(image, details, removeButton);
    cartContent.append(row);
  });

  const total = cartItems.reduce(
    (amount, item) => amount + item.price * item.quantity,
    0,
  );
  cartTotal.textContent = formatWon(total);
};

const setCartOpen = (isOpen) => {
  if (!cartPanel) return;
  cartPanel.classList.toggle("cart-active", isOpen);
  cartPanel.setAttribute("aria-hidden", String(!isOpen));
};

document.querySelector("[data-cart-toggle]")?.addEventListener("click", () => {
  setCartOpen(!cartPanel.classList.contains("cart-active"));
});

document.querySelector(".cart-close")?.addEventListener("click", () => {
  setCartOpen(false);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setCartOpen(false);
});

addToCartButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const product = button.closest(".spices-box");
    const productId = button.dataset.productId || product?.dataset.productId;
    const cartProduct = cartProducts.get(productId);
    const quantityInput = button
      .closest(".single-pro-details")
      ?.querySelector("[data-product-quantity]");
    const quantity = quantityInput
      ? normalizeQuantity(quantityInput.value, cartProduct.minQuantity)
      : cartProduct.minQuantity;

    if (quantityInput) quantityInput.value = quantity;

    const existingItem = cartItems.find((item) => item.id === productId);

    if (existingItem) {
      existingItem.price = cartProduct.price;
      existingItem.quantity =
        normalizeQuantity(existingItem.quantity, cartProduct.minQuantity) + quantity;
    } else {
      cartItems.push({
        ...cartProduct,
        quantity,
      });
    }

    saveCart();
  });
});

document.querySelector(".btn-buy")?.addEventListener("click", () => {
  if (!cartItems.length) {
    window.alert("Your cart is empty.");
    return;
  }

  const totalQuantity = cartItems.reduce((total, item) => total + item.quantity, 0);
  if (totalQuantity > 1000) {
    window.alert(
      "For orders above 1,000 kg, please contact our export team for a customized quotation.",
    );
    return;
  }

  window.alert("Checkout is not connected to an ordering service yet.");
});

window.addEventListener("storage", (event) => {
  if (event.key === cartStorageKey) {
    cartItems = JSON.parse(event.newValue || "[]");
    renderCart();
  }
});

renderCart();
