function SectionSkeleton({ variant = 'panel' }) {
  const rows = variant === 'grid' ? 4 : variant === 'form' ? 5 : 3;

  return (
    <div className={`section-skeleton ${variant}`}>
      {Array.from({ length: rows }).map((_, index) => (
        <span className="section-skeleton-block" key={`${variant}-${index}`} />
      ))}
    </div>
  );
}

export default function SectionState({
  loading,
  error,
  onRetry,
  skeleton = 'panel',
  title = 'Unable to load this section.',
  description,
  children,
}) {
  if (loading) {
    return (
      <section className="section-shell">
        <div className="section-state-card loading">
          <strong>Loading section...</strong>
          <SectionSkeleton variant={skeleton} />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="section-shell">
        <div className="section-state-card error">
          <strong>{title}</strong>
          <p>{error || description || 'Please try again.'}</p>
          {onRetry ? (
            <button className="secondary-cta" type="button" onClick={onRetry}>
              Retry section
            </button>
          ) : null}
        </div>
      </section>
    );
  }

  return children;
}
