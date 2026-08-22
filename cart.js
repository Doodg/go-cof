/**
 * Tesla Coffee — shared cart engine (localStorage-based, no backend).
 * Included on every page so the cart persists across navigation.
 */
(function () {
  const CART_KEY = 'tesla_cart_v1';
  window.WHATSAPP_NUMBER = '201117180333';
  window.FREE_SHIPPING_THRESHOLD = 700;
  window.SHIPPING_FEE = 70; // رسوم شحن ثابتة للقاهرة والجيزة تحت حد الشحن المجاني
  window.FREE_SHIPPING_GOVS = ['cairo', 'giza']; // الشحن المجاني متاح بس للقاهرة والجيزة

  function getCart() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      const cart = raw ? JSON.parse(raw) : [];
      return Array.isArray(cart) ? cart : [];
    } catch (e) {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadge();
  }

  // مفتاح فريد لكل تركيبة منتج + خيارات، عشان لو المستخدم ضاف نفس المنتج
  // بنفس الاختيارات تاني، نزوّد الكمية بدل ما نعمل سطر مكرر في السلة.
  function cartItemKey(item) {
    return [item.category, item.name, JSON.stringify(item.options || {})].join('|');
  }

  function addToCart(item) {
    const cart = getCart();
    const key = cartItemKey(item);
    const existing = cart.find(i => cartItemKey(i) === key);
    if (existing) {
      existing.qty = Math.min(20, existing.qty + item.qty);
    } else {
      cart.push(item);
    }
    saveCart(cart);
    return cart;
  }

  function removeFromCart(index) {
    const cart = getCart();
    cart.splice(index, 1);
    saveCart(cart);
    return cart;
  }

  function updateCartQty(index, qty) {
    const cart = getCart();
    if (cart[index]) {
      cart[index].qty = Math.max(1, Math.min(20, parseInt(qty) || 1));
    }
    saveCart(cart);
    return cart;
  }

  function clearCart() {
    localStorage.removeItem(CART_KEY);
    updateCartBadge();
  }

  function cartCount() {
    return getCart().reduce((sum, i) => sum + i.qty, 0);
  }

  function cartSubtotal() {
    return getCart().reduce((sum, i) => sum + i.qty * i.unitPrice, 0);
  }

  // بترجع رقم (رسوم الشحن) لو المحافظة القاهرة أو الجيزة، أو null لو المحافظة غيرهم
  // (يعني الرسوم لسه مش معروفة وهيتم تأكيدها مع العميل بعدين على واتساب).
  function shippingFee(subtotal, govCode) {
    if (subtotal <= 0) return 0;
    if (window.FREE_SHIPPING_GOVS.indexOf(govCode) === -1) return null;
    return subtotal >= window.FREE_SHIPPING_THRESHOLD ? 0 : window.SHIPPING_FEE;
  }

  function formatEGP(n) {
    return 'LE ' + Number(n).toFixed(2);
  }

  function updateCartBadge() {
    const count = cartCount();
    document.querySelectorAll('.cart-badge').forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? 'flex' : 'none';
    });
  }

  // توست بسيط لتأكيد "تمت الإضافة للسلة" من غير ما نحتاج نعرّفه في كل صفحة
  function ensureToastStyles() {
    if (document.getElementById('cartToastStyle')) return;
    const style = document.createElement('style');
    style.id = 'cartToastStyle';
    style.textContent = `
      .cart-toast {
        position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(20px);
        background: #1a1a1a; color: #F5F0E8; border: 1px solid rgba(201,168,76,0.4);
        padding: 14px 24px; border-radius: 50px; font-family: 'Tajawal', sans-serif;
        font-size: 0.92rem; font-weight: 700; z-index: 200;
        box-shadow: 0 12px 40px rgba(0,0,0,0.5);
        opacity: 0; pointer-events: none; transition: opacity .3s ease, transform .3s ease;
        display: flex; align-items: center; gap: 10px; white-space: nowrap;
      }
      .cart-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); pointer-events: auto; }
      .cart-toast a { color: #C9A84C; text-decoration: underline; }
      @media (max-width: 480px) {
        .cart-toast { bottom: 148px; font-size: 0.85rem; padding: 12px 18px; white-space: normal; text-align: center; }
      }
    `;
    document.head.appendChild(style);
  }

  function showToast(message, withCartLink, linkText) {
    ensureToastStyles();
    let toast = document.getElementById('cartToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'cartToast';
      toast.className = 'cart-toast';
      document.body.appendChild(toast);
    }
    toast.innerHTML = message + (withCartLink ? ' — <a href="cart.html">' + (linkText || 'اذهب للسلة') + '</a>' : '');
    // إعادة تشغيل الأنيميشن لو التوست ظاهر بالفعل
    toast.classList.remove('show');
    void toast.offsetWidth;
    toast.classList.add('show');
    clearTimeout(window.__cartToastTimeout);
    window.__cartToastTimeout = setTimeout(() => toast.classList.remove('show'), 3200);
  }

  function getAdSource() {
    const params = new URLSearchParams(window.location.search);
    const utmId = params.get('utm_id');
    const utmSource = params.get('utm_source');
    const utmCampaign = params.get('utm_campaign');
    if (utmId || utmSource || utmCampaign) {
      return [utmSource, utmCampaign, utmId].filter(Boolean).join(' | ');
    }
    const ref = document.referrer;
    if (!ref || ref.includes(window.location.hostname)) return 'مباشر';
    return ref;
  }

  window.getAdSource = getAdSource;
  window.getCart = getCart;
  window.addToCart = addToCart;
  window.removeFromCart = removeFromCart;
  window.updateCartQty = updateCartQty;
  window.clearCart = clearCart;
  window.cartCount = cartCount;
  window.cartSubtotal = cartSubtotal;
  window.shippingFee = shippingFee;
  window.formatEGP = formatEGP;
  window.updateCartBadge = updateCartBadge;
  window.showCartToast = showToast;

  document.addEventListener('DOMContentLoaded', updateCartBadge);
})();
