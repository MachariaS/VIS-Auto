export default function ToastViewport({ toasts, onDismiss }) {
  if (!toasts.length) return null;

  return (
    <section className="toast-viewport" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <article className={`toast-card ${toast.type || 'info'}`} key={toast.id}>
          <div className="toast-copy">
            <strong>{toast.title || 'Notice'}</strong>
            <p>{toast.message}</p>
          </div>
          <button
            className="toast-dismiss"
            type="button"
            aria-label="Dismiss notification"
            onClick={() => onDismiss(toast.id)}
          >
            ×
          </button>
        </article>
      ))}
    </section>
  );
}
