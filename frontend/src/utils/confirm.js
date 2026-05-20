export function showConfirm(message) {
  return new Promise((resolve) => {
    const handler = (e) => {
      resolve(Boolean(e.detail));
      window.removeEventListener('confirm-response', handler);
    };
    window.addEventListener('confirm-response', handler);
    window.dispatchEvent(new CustomEvent('show-confirm', { detail: { message } }));
  });
}
