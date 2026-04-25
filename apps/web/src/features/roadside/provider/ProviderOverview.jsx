import { futureProviderModules, serviceTypeOptions } from '../../../shared/constants';
import { formatCurrency, getServiceImageUrl } from '../../../shared/helpers';

export default function ProviderOverview({
  user,
  requests,
  providerServices,
  onAddService,
  onManageServices,
}) {
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

  const orderRows = requests.slice(0, 5).map((item, index) => ({
    code: `#${String(index + 2632)}`,
    title: item.issueType || 'Roadside service',
    meta: item.providerName || user?.name || 'Provider',
    date: new Date(item.createdAt).toLocaleDateString('en-KE'),
    amount: formatCurrency(Number(item.estimatedPriceKsh || 0)),
    status:
      item.status === 'completed'
        ? 'Completed'
        : item.status === 'cancelled'
          ? 'Cancelled'
          : 'Ongoing',
    tone:
      item.status === 'completed'
        ? 'completed'
        : item.status === 'cancelled'
          ? 'pending'
          : 'ongoing',
  }));

  const showcaseServices =
    providerServices.length > 0
      ? providerServices.slice(0, 4).map((service, index) => ({
          id: service.id,
          title: service.serviceName,
          provider: user?.name || 'Your Team',
          serviceCode: service.serviceCode,
          serviceImageUrl: service.serviceImageUrl,
          rating: (4.1 + index * 0.2).toFixed(1),
          price: formatCurrency(service.basePriceKsh),
          tone: ['peach', 'mint', 'sky', 'sand'][index % 4],
        }))
      : [
          {
            id: 'demo-1',
            title: 'Beauty',
            provider: 'George & Albert Pvt. Ltd',
            serviceCode: 'battery_jump',
            serviceImageUrl: '/assets/other_services.jpeg',
            rating: '4.5',
            price: '$36.00',
            tone: 'peach',
          },
          {
            id: 'demo-2',
            title: 'Painter',
            provider: 'Sebastian & Co workers',
            serviceCode: 'tire_change',
            serviceImageUrl: '/assets/other_services.jpeg',
            rating: '4.4',
            price: '$44.00',
            tone: 'mint',
          },
          {
            id: 'demo-3',
            title: 'Car Wash',
            provider: 'Shift Car Studio',
            serviceCode: 'towing',
            serviceImageUrl: '/assets/other_services.jpeg',
            rating: '4.7',
            price: '$18.00',
            tone: 'sky',
          },
          {
            id: 'demo-4',
            title: 'Drain Cleaning',
            provider: 'Swift Fix Team',
            serviceCode: 'lockout',
            serviceImageUrl: '/assets/other_services.jpeg',
            rating: '4.3',
            price: '$24.00',
            tone: 'sand',
          },
        ];

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

            <div className="provider-service-grid-v2">
              {showcaseServices.map((service) => (
                <article className={`provider-service-card-v2 ${service.tone}`} key={service.id}>
                  <div
                    className="provider-service-art-v2"
                    style={{
                      backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.06), rgba(15, 23, 42, 0.46)), url(${getServiceImageUrl(service)})`,
                    }}
                  />
                  <strong>{service.title}</strong>
                  <p>{service.provider}</p>
                  <div className="provider-service-meta-v2">
                    <span>★ {service.rating} Reviews</span>
                    <strong>{service.price}</strong>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="provider-orders-v2">
          <div className="provider-section-head-v2">
            <h4>Orders</h4>
          </div>
          <div className="provider-order-tabs-v2">
            {['All', 'Ongoing', 'Pending', 'Completed', 'Cancelled'].map((tab, index) => (
              <button
                key={tab}
                className={index === 0 ? 'provider-order-tab-active-v2' : 'provider-order-tab-v2'}
                type="button"
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="provider-order-list-v2">
            {orderRows.length === 0 ? (
              <article className="provider-note-v2">
                <strong>No orders yet.</strong>
                <p>Orders from customers will appear here as soon as they are created.</p>
              </article>
            ) : (
              orderRows.map((order) => (
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

      {providerServices.length === 0 ? (
        <article className="provider-note-v2">
          <strong>No services published yet.</strong>
          <p>
            Use Add Service to publish your first offering and start appearing in customer requests.
          </p>
        </article>
      ) : null}

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
