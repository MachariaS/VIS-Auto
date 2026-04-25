import { futureCustomerModules } from '../../../shared/constants';

export default function CustomerOverview({ onNewRequest }) {
  return (
    <section className="dashboard-panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Overview</p>
          <h3>Clean entry point</h3>
        </div>
        <button className="primary-cta" type="button" onClick={onNewRequest}>
          New roadside request
        </button>
      </div>

      <div className="hero-grid">
        <article className="spotlight-card">
          <span>Roadside</span>
          <strong>Fast request flow</strong>
          <p>Fuel, towing, battery, tire change, and lockout.</p>
        </article>
        <article className="spotlight-card alt">
          <span>Vehicle profile</span>
          <strong>Data foundation</strong>
          <p>Save your car once and build maintenance history over time.</p>
        </article>
      </div>

      <div className="module-grid">
        {futureCustomerModules.map((module) => (
          <article className="module-card" key={module.title}>
            <span>{module.meta}</span>
            <strong>{module.title}</strong>
            <p>{module.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
