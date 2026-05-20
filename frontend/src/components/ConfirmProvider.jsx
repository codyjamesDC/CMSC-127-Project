import { useEffect, useState } from 'react';
import Modal from './Modal';

export default function ConfirmProvider() {
  const [pending, setPending] = useState(null);

  useEffect(() => {
    const show = (e) => {
      setPending({ id: Date.now(), message: e.detail.message });
    };
    window.addEventListener('show-confirm', show);
    return () => window.removeEventListener('show-confirm', show);
  }, []);

  const respond = (val) => {
    window.dispatchEvent(new CustomEvent('confirm-response', { detail: val }));
    setPending(null);
  };

  if (!pending) return null;

  return (
    <Modal title="Confirm action" onClose={() => respond(false)}
      footer={(
        <>
          <button className="btn btn-secondary" onClick={() => respond(false)}>Cancel</button>
          <button className="btn btn-danger" onClick={() => respond(true)}>Delete</button>
        </>
      )}>
      <div style={{ padding: 8 }}>{pending.message}</div>
    </Modal>
  );
}
