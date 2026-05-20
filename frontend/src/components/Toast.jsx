import { useEffect, useState } from 'react';

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const show = (e) => {
      const id = Date.now() + Math.random();
      setToasts(t => [...t, { id, ...e.detail }]);
      setTimeout(() => {
        setToasts(t => t.filter(x => x.id !== id));
      }, (e.detail.duration || 3000));
    };
    window.addEventListener('show-toast', show);
    return () => window.removeEventListener('show-toast', show);
  }, []);

  return (
    <div className="toast-container" aria-live="polite" aria-atomic="true">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.variant || 'info'}`} role="status">
          {t.message}
        </div>
      ))}
    </div>
  );
}
