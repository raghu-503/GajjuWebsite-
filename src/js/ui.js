export function stars(rating) {
  return `<span class="stars" aria-label="${rating} out of 5 stars">${[1, 2, 3, 4, 5]
    .map((i) => `<span class="${rating >= i - 0.25 ? 'on' : 'off'}"><i data-lucide="star"></i></span>`)
    .join('')}</span>`;
}
