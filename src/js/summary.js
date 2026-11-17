import { formatPrice } from './data.js';
import { applyPromo, clearPromo } from './cart.js';
import { toast } from './toast.js';

export function summaryMarkup(t, { cta = true } = {}) {
  return `
    <dl class="totals">
      <div><dt>Subtotal (${t.count} ${t.count === 1 ? 'item' : 'items'})</dt><dd>${formatPrice(t.subtotal)}</dd></div>
      ${t.discount ? `<div class="totals__disc"><dt>Discount <span class="pill">${t.promo.code}</span></dt><dd>−${formatPrice(t.discount)}</dd></div>` : ''}
      <div><dt>Shipping</dt><dd>${t.shipping === 0 ? 'Free' : formatPrice(t.shipping)}</dd></div>
      <div class="totals__grand"><dt>Total</dt><dd>${formatPrice(t.total)}</dd></div>
    </dl>
    <form class="promo" data-promo novalidate>
      ${
        t.promo
          ? `<p class="promo__on"><i data-lucide="check"></i>${t.promo.label}<button type="button" class="text-link" data-promo-remove>Remove</button></p>`
          : `<label class="sr-only" for="promo">Promo code</label><div class="field-inline"><input id="promo" placeholder="Promo code, try NEX10" autocomplete="off" /><button class="btn btn--ghost btn--sm" type="submit">Apply</button></div><p class="form-msg" data-promo-msg></p>`
      }
    </form>
    ${cta ? `<a class="btn btn--primary btn--lg btn--block" href="checkout.html"><i data-lucide="lock"></i>Checkout</a>` : ''}
    <p class="summary__note"><i data-lucide="shield-check"></i>Demo store. No payment is taken.</p>`;
}

export function bindPromo(container) {
  container.addEventListener('submit', (e) => {
    if (!e.target.matches('[data-promo]')) return;
    e.preventDefault();
    const input = e.target.querySelector('input');
    if (applyPromo(input.value)) toast('Promo code applied', 'check');
    else {
      const msg = e.target.querySelector('[data-promo-msg]');
      msg.textContent = `“${input.value || 'That code'}” isn’t a valid code. Try NEX10.`;
      msg.className = 'form-msg is-error';
    }
  });
  container.addEventListener('click', (e) => {
    if (e.target.closest('[data-promo-remove]')) clearPromo();
  });
}

