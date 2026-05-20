export function showToast(message, variant = 'info', duration = 3000) {
  window.dispatchEvent(new CustomEvent('show-toast', { detail: { message, variant, duration } }));
}
