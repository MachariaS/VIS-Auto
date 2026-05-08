import { useEffect, useState } from 'react';
import { futureProviderModules, serviceTypeOptions, vehicleBrandConfig } from '../../../shared/constants';
import { formatCurrency, getServiceImageUrl, request } from '../../../shared/helpers';
import { useApp } from '../../../context/AppContext';

function AvailabilityToggle({ user, token }) {
  const { setUser } = useApp();
  const [toggling, setToggling] = useState(false);
  const isOnline = user?.isOnline ?? false;

  async function toggle() {
    setToggling(true);
    try {
      const updated = await request('/users/me/availability', undefined, 'PATCH', token);
      setUser(updated);
    } catch { /* non-fatal */ } finally {
      setToggling(false);
    }
  }

  return (
    <div className={`availability-toggle-card ${isOnline ? 'availability-toggle-card--online' : 'availability-toggle-card--offline'}`}>
      <div className="availability-toggle-info">
        <div className="availability-toggle-dot-wrap">
          <span className={`availability-toggle-dot ${isOnline ? 'availability-toggle-dot--on' : ''}`} />
        </div>
        <div>
          <strong>{isOnline ? 'You are online' : 'You are offline'}</strong>
          <p>
            {isOnline
              ? 'Customers can see and request your services.'
              : 'You are hidden from the customer catalog. Go online to receive jobs.'}
          </p>
        </div>
      </div>
      <button
        type="button"
        className={isOnline ? 'ghost-button danger' : 'primary-cta'}
        onClick={toggle}
        disabled={toggling}
      >
        {toggling ? 'Updating…' : isOnline ? 'Go offline' : 'Go online'}
      </button>
    </div>
  );
}

const TAB_STATUSES = {
  All: null,
  Ongoing: ['provider_assigned', 'in_progress'],
  Pending: ['searching'],
  Completed: ['completed'],
  Cancelled: ['cancelled'],
};

export default function ProviderOverview({
  user,
  token,
  requests,
  providerServices,
  onAddService,
  onManageServices,
}) {
  const [stats, setStats] = useState(null);
  const [orderTab, setOrderTab] = useState('All');

  useEffect(() => {
    if (!token) return;
    request('/users/me/provider-stats', undefined, 'GET', token)
      .then(setStats)
      .catch(() => {});
  }, [token]);

  const completedRequests = requests.filter((item) => item.status === 'completed');
  const activeRequests = requests.filter(
    (item) =>
      item.status === 'searching' ||
      item.status === 'provider_assigned' ||
      item.status === 'in_progress',
  );
  const cancelledRequests = requests.filter((item) => item.status === 'cancelled');
  const uniqueCustomers = new Set(requests.map((item) => item.userId).filter(Boolean)).size;
  const completedRevenue = completedRequests.reduce(
    (total, item) => total + Number(item.estimatedPriceKsh || 0),
    0,
  );

  const dashboardStatCards = [
    { value: String(uniqueCustomers), label: 'Unique Customers', icon: '◉', tone: 'violet' },
    { value: formatCurrency(completedRevenue), label: 'Completed Revenue', icon: '$', tone: 'orange' },
    {
      value: String(activeRequests.length).padStart(2, '0'),
      label: 'Pending Orders',
      icon: '▦',
      tone: 'gold',
    },
    {
      value: String(completedRequests.length).padStart(2, '0'),
      label: 'Completed Orders',
      icon: '✓',
      tone: 'green',
    },
  ];

  const totalOrders = requests.length || 1;
  const completionPercent = Math.round((completedRequests.length / totalOrders) * 100);
  const activePercent = Math.round((activeRequests.length / totalOrders) * 100);
  const serviceCoveragePercent = Math.round(
    ((providerServices.length || 0) / Math.max(serviceTypeOptions.length, 1)) * 100,
  );

  const orderStats = [
    {
      value: String(completedRequests.length),
      label: 'Completed Services',
      percent: completionPercent,
      color: '#22c55e',
    },
    {
      value: formatCurrency(completedRevenue),
      label: 'Total Earnings',
      percent: completionPercent,
      color: '#f97316',
    },
    {
      value: String(activeRequests.length),
      label: 'Active Orders',
      percent: activePercent,
      color: '#eab308',
    },
    {
      value: `${providerServices.length}`,
      label: 'Service Coverage',
      percent: serviceCoveragePercent,
      color: '#a855f7',
    },
  ];

  const allOrderRows = requests.map((item, index) => ({
    code: `#${String(index + 2632)}`,
    title: item.issueType || 'Roadside service',
    meta: item.providerName || user?.name || 'Provider',
    date: new Date(item.createdAt).toLocaleDateString('en-KE'),
    amount: formatCurrency(Number(item.estimatedPriceKsh || 0)),
    rawStatus: item.status,
    status:
      item.status === 'completed'
        ? 'Completed'
        : item.status === 'cancelled'
          ? 'Cancelled'
          : item.status === 'searching'
            ? 'Pending'
            : 'Ongoing',
    tone:
      item.status === 'completed'
        ? 'completed'
        : item.status === 'cancelled'
          ? 'pending'
          : 'ongoing',
  }));

  const tabStatuses = TAB_STATUSES[orderTab];
  const filteredRows = (
    tabStatuses ? allOrderRows.filter((r) => tabStatuses.includes(r.rawStatus)) : allOrderRows
  ).slice(0, 5);

  const serviceRating = stats?.avgRating ?? 'New';
  const showcaseServices = providerServices.slice(0, 4).map((service) => ({
    id: service.id,
    title: service.serviceName,
    provider: user?.name || 'Your Team',
    catalogCode: service.catalogCode || service.serviceCode,
    serviceCode: service.serviceCode,
    serviceImageUrl: service.serviceImageUrl,
    rating: serviceRating,
    price: formatCurrency(service.basePriceKsh),
    tone: ['peach', 'mint', 'sky', 'sand'][providerServices.indexOf(service) % 4],
  }));

  return (
    <section className="provider-home-v2">
      <div className="provider-home-head-v2">
        <div>
          <p>Welcome to</p>
          <h3>{user?.name || 'your dashboard'}</h3>
        </div>
        <button className="primary-cta" type="button" onClick={onAddService}>
          Add Service
        </button>
      </div>

      <AvailabilityToggle user={user} token={token} />

      {providerServices.length === 0 && (
        <div className="provider-setup-prompt">
          <div className="provider-setup-icon">🔧</div>
          <div className="provider-setup-copy">
            <strong>Complete your setup — add your first service</strong>
            <p>
              Customers can't find you yet. Add at least one service from the catalog
              or create a custom service to go live.
            </p>
          </div>
          <div className="provider-setup-actions">
            <button className="primary-cta" type="button" onClick={onAddService}>
              + Custom service
            </button>
            <button className="ghost-button" type="button" onClick={onManageServices}>
              Browse catalog
            </button>
          </div>
        </div>
      )}

      {providerServices.length > 0 && !user?.baseLat && (
        <div className="provider-setup-prompt" style={{ '--setup-color': '#f59e0b' }}>
          <div className="provider-setup-icon">📍</div>
          <div className="provider-setup-copy">
            <strong>Set your garage location for accurate distances</strong>
            <p>
              Without a base location, customers see "8 km" as a placeholder.
              Add your garage coordinates in Settings → Profile → Locations.
            </p>
          </div>
          <div className="provider-setup-actions">
            <button className="ghost-button" type="button" onClick={onManageServices}>
              Go to Profile
            </button>
          </div>
        </div>
      )}

      {/* ── Earnings dashboard ── */}
      {stats && (
        <div className="earnings-dashboard">
          <div className="earnings-dashboard-head">
            <h4>Earnings overview</h4>
            {stats.avgRating !== null && (
              <span className="earnings-rating-badge">
                ★ {stats.avgRating} avg · {stats.ratingCount} review{stats.ratingCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="earnings-kpi-strip">
            <div className="earnings-kpi earnings-kpi--primary">
              <span>Total earnings</span>
              <strong>{formatCurrency(stats.totalEarnings)}</strong>
            </div>
            <div className="earnings-kpi">
              <span>This month</span>
              <strong>{formatCurrency(stats.thisMonthEarnings)}</strong>
              {stats.lastMonthEarnings > 0 && (
                <span className={`earnings-trend ${stats.thisMonthEarnings >= stats.lastMonthEarnings ? 'earnings-trend--up' : 'earnings-trend--down'}`}>
                  {stats.thisMonthEarnings >= stats.lastMonthEarnings ? '▲' : '▼'}{' '}
                  {Math.abs(Math.round(((stats.thisMonthEarnings - stats.lastMonthEarnings) / stats.lastMonthEarnings) * 100))}% vs last month
                </span>
              )}
            </div>
            <div className="earnings-kpi">
              <span>Last month</span>
              <strong>{formatCurrency(stats.lastMonthEarnings)}</strong>
            </div>
            <div className="earnings-kpi">
              <span>Jobs done</span>
              <strong>{stats.completedJobs}</strong>
              <span className="earnings-completion">{stats.completionRate}% completion</span>
            </div>
            {stats.topService && (
              <div className="earnings-kpi">
                <span>Top service</span>
                <strong>{stats.topService.name}</strong>
                <span className="earnings-completion">{formatCurrency(stats.topService.earnings)} · {stats.topService.count} jobs</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="provider-stat-strip-v2">
        {dashboardStatCards.map((card) => (
          <article className={`provider-stat-card-v2 ${card.tone}`} key={card.label}>
            <div>
              <strong>{card.value}</strong>
              <span>{card.label}</span>
            </div>
            <div className="provider-stat-icon-v2">{card.icon}</div>
          </article>
        ))}
      </div>

      <div className="provider-grid-v2">
        <section className="provider-orders-stats-v2">
          <div className="provider-section-head-v2">
            <h4>Orders Statistics</h4>
            <span>Monthly</span>
          </div>

          <div className="provider-ring-grid-v2">
            {orderStats.map((item) => (
              <article className="provider-ring-card-v2" key={item.label}>
                <div
                  className="provider-ring-v2"
                  style={{
                    background: `conic-gradient(${item.color} ${item.percent}%, rgba(148, 163, 184, 0.22) ${item.percent}% 100%)`,
                  }}
                >
                  <span>{item.value}</span>
                </div>
                <p>{item.label}</p>
              </article>
            ))}
          </div>

          <div className="provider-popular-v2">
            <div className="provider-section-head-v2">
              <h4>Popular Services</h4>
              <button className="ghost-button" type="button" onClick={onManageServices}>
                Manage
              </button>
            </div>

            {showcaseServices.length === 0 ? (
              <article className="provider-note-v2">
                <strong>No services published yet.</strong>
                <p>Add your first service to start appearing in customer searches.</p>
                <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                  <button className="primary-cta" type="button" onClick={onAddService}>+ Custom service</button>
                  <button className="ghost-button" type="button" onClick={onManageServices}>Browse catalog</button>
                </div>
              </article>
            ) : (
              <div className="provider-service-grid-v2">
                {showcaseServices.map((service) => (
                  <article className={`provider-service-card-v2 ${service.tone}`} key={service.id}>
                    {vehicleBrandConfig[service.catalogCode] ? (
                      <div
                        className="provider-service-art-v2 provider-service-art-brand"
                        style={{
                          background: vehicleBrandConfig[service.catalogCode].bg,
                          color: vehicleBrandConfig[service.catalogCode].text,
                        }}
                      >
                        {vehicleBrandConfig[service.catalogCode].label}
                      </div>
                    ) : (
                      <div
                        className="provider-service-art-v2"
                        style={{
                          backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.06), rgba(15, 23, 42, 0.46)), url(${getServiceImageUrl(service)})`,
                        }}
                      />
                    )}
                    <strong>{service.title}</strong>
                    <p>{service.provider}</p>
                    <div className="provider-service-meta-v2">
                      <span>★ {service.rating}</span>
                      <strong>{service.price}</strong>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="provider-orders-v2">
          <div className="provider-section-head-v2">
            <h4>Orders</h4>
          </div>
          <div className="provider-order-tabs-v2">
            {['All', 'Ongoing', 'Pending', 'Completed', 'Cancelled'].map((tab) => (
              <button
                key={tab}
                className={tab === orderTab ? 'provider-order-tab-active-v2' : 'provider-order-tab-v2'}
                type="button"
                onClick={() => setOrderTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="provider-order-list-v2">
            {filteredRows.length === 0 ? (
              <article className="provider-note-v2">
                <strong>No orders yet.</strong>
                <p>Orders from customers will appear here as soon as they are created.</p>
              </article>
            ) : (
              filteredRows.map((order) => (
                <article className="provider-order-card-v2" key={order.code}>
                  <div className="provider-order-thumb-v2" />
                  <div className="provider-order-content-v2">
                    <div className="provider-order-head-v2">
                      <strong>{order.code}</strong>
                      <span>{order.amount}</span>
                    </div>
                    <p>{order.title}</p>
                    <div className="provider-order-meta-v2">
                      <span>{order.meta}</span>
                      <span>{order.date}</span>
                    </div>
                    <div className={`provider-order-status-v2 ${order.tone}`}>{order.status}</div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="module-grid">
        {futureProviderModules.map((module) => (
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
