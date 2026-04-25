import { orderHistoryTabs, orderStatusCopy } from '../../../shared/constants';
import { formatCurrency } from '../../../shared/helpers';

function renderStatusBadge(statusValue) {
  return (
    <span className={`order-status-pill-v2 ${statusValue}`}>
      {orderStatusCopy[statusValue] || 'In Progress'}
    </span>
  );
}

function renderOrderTimeline(statusValue) {
  if (statusValue === 'cancelled') {
    return [
      { key: 'queued', label: 'Queued', active: true },
      { key: 'cancelled', label: 'Cancelled', active: true, danger: true },
    ];
  }

  return [
    { key: 'queued', label: 'Queued', active: true },
    {
      key: 'assigned',
      label: 'Assigned',
      active:
        statusValue === 'provider_assigned' ||
        statusValue === 'in_progress' ||
        statusValue === 'completed',
    },
    {
      key: 'in_progress',
      label: 'In Progress',
      active: statusValue === 'in_progress' || statusValue === 'completed',
    },
    {
      key: 'completed',
      label: 'Completed',
      active: statusValue === 'completed',
    },
  ];
}

function formatOrderId(orderId) {
  return `#${String(orderId || '').slice(0, 8).toUpperCase()}`;
}

function getOrderActionLabel(status) {
  if (status === 'searching') return 'Assign Request';
  if (status === 'provider_assigned') return 'Start Service';
  if (status === 'in_progress') return 'Mark Completed';
  return '';
}

export default function OrdersPanel({
  providerOrders,
  filteredProviderOrders,
  orderCounts,
  selectedOrder,
  orderHistoryTab,
  setOrderHistoryTab,
  ordersFromDate,
  setOrdersFromDate,
  ordersToDate,
  setOrdersToDate,
  orderActionMenuId,
  setOrderActionMenuId,
  updatingOrderId,
  onRowAction,
  onNotify,
  onShareLocation,
}) {
  return (
    <section className="provider-home-v2 order-history-v2">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Roadside requests</p>
          <h3>Request History</h3>
        </div>
        <div className="order-filters-v2">
          <label>
            <span>From</span>
            <input
              type="date"
              value={ordersFromDate}
              onChange={(event) => setOrdersFromDate(event.target.value)}
            />
          </label>
          <label>
            <span>To</span>
            <input
              type="date"
              value={ordersToDate}
              onChange={(event) => setOrdersToDate(event.target.value)}
            />
          </label>
        </div>
      </div>

      <div className="order-tab-row-v2">
        {orderHistoryTabs.map((tabItem) => {
          return (
            <button
              key={tabItem.id}
              type="button"
              className={
                orderHistoryTab === tabItem.id ? 'order-tab-active-v2' : 'order-tab-idle-v2'
              }
              onClick={() => setOrderHistoryTab(tabItem.id)}
            >
              {tabItem.label}
              <span>{orderCounts[tabItem.id] || 0}</span>
            </button>
          );
        })}
      </div>

      <div className="order-table-v2">
        <div className="order-table-head-v2">
          <span>Request</span>
          <span>Customer</span>
          <span>Service</span>
          <span>ETA</span>
          <span>Distance</span>
          <span>Status</span>
          <span>Estimate</span>
          <span>Action</span>
        </div>

        {filteredProviderOrders.length === 0 ? (
          <article className="order-row-empty-v2">No orders match the selected filters.</article>
        ) : (
          filteredProviderOrders.map((orderItem) => (
            <article className="order-row-v2" key={orderItem.id}>
              <span>{formatOrderId(orderItem.id)}</span>
              <span>
                <strong>{orderItem.customer?.name || 'Unknown customer'}</strong>
                <small>{orderItem.customer?.phone || orderItem.customer?.email || 'Not shared'}</small>
              </span>
              <span>{orderItem.issueType || 'Roadside service'}</span>
              <span>{String(orderItem.etaMinutes).padStart(2, '0')} min</span>
              <span>{Number(orderItem.distanceKm || 0).toFixed(1)} km</span>
              <span>{renderStatusBadge(orderItem.status)}</span>
              <span>{formatCurrency(orderItem.estimatedPriceKsh)}</span>
              <span className="order-action-cell-v2">
                <button
                  type="button"
                  className="order-action-trigger-v2"
                  onClick={() =>
                    setOrderActionMenuId((current) =>
                      current === orderItem.id ? '' : orderItem.id,
                    )
                  }
                >
                  ⋮
                </button>

                {orderActionMenuId === orderItem.id ? (
                  <div className="order-action-menu-v2">
                    <button type="button" onClick={() => onRowAction('summary', orderItem)}>
                      Request Summary
                    </button>
                    <button type="button" onClick={() => onRowAction('contact', orderItem)}>
                      Contact Customer
                    </button>
                    {orderItem.status === 'searching' ? (
                      <button
                        type="button"
                        onClick={() => onRowAction('assign', orderItem)}
                        disabled={updatingOrderId === orderItem.id}
                      >
                        {getOrderActionLabel(orderItem.status)}
                      </button>
                    ) : null}
                    {orderItem.status === 'provider_assigned' ? (
                      <button
                        type="button"
                        onClick={() => onRowAction('start', orderItem)}
                        disabled={updatingOrderId === orderItem.id}
                      >
                        {getOrderActionLabel(orderItem.status)}
                      </button>
                    ) : null}
                    {orderItem.status === 'in_progress' ? (
                      <button
                        type="button"
                        onClick={() => onRowAction('complete', orderItem)}
                        disabled={updatingOrderId === orderItem.id}
                      >
                        {getOrderActionLabel(orderItem.status)}
                      </button>
                    ) : null}
                    {orderItem.status !== 'completed' && orderItem.status !== 'cancelled' ? (
                      <button
                        type="button"
                        onClick={() => onShareLocation?.(orderItem)}
                        disabled={updatingOrderId === orderItem.id}
                      >
                        Share Live Location
                      </button>
                    ) : null}
                    {orderItem.status !== 'completed' && orderItem.status !== 'cancelled' ? (
                      <button
                        type="button"
                        className="danger"
                        onClick={() => onRowAction('cancel', orderItem)}
                        disabled={updatingOrderId === orderItem.id}
                      >
                        Cancel Request
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </span>
            </article>
          ))
        )}
      </div>

      {selectedOrder ? (
        <section className="order-summary-shell-v2">
          <header className="order-summary-head-v2">
            <div>
              <h4>Request {formatOrderId(selectedOrder.id)}</h4>
              <p>
                Request created{' '}
                {new Date(selectedOrder.createdAt).toLocaleString('en-KE', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
            </div>
            <div className="order-summary-head-actions-v2">
              <button
                className="secondary-cta"
                type="button"
                onClick={() => onNotify?.(`Print view prepared for ${selectedOrder.id}.`)}
              >
                Print
              </button>
              {selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled' ? (
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => onShareLocation?.(selectedOrder)}
                >
                  Share live location
                </button>
              ) : null}
            </div>
          </header>

          <div className="order-summary-grid-v2">
            <article className="order-detail-card-v2">
              <h5>Customer Details</h5>
              <p>
                <strong>Name</strong>
                <span>{selectedOrder.customer?.name || 'Unknown customer'}</span>
              </p>
              <p>
                <strong>Email</strong>
                <span>{selectedOrder.customer?.email || 'Not shared'}</span>
              </p>
              <p>
                <strong>Phone</strong>
                <span>{selectedOrder.customer?.phone || 'Not shared'}</span>
              </p>
              <p>
                <strong>Vehicle</strong>
                <span>
                  {selectedOrder.vehicle
                    ? `${selectedOrder.vehicle.make} ${selectedOrder.vehicle.model} (${selectedOrder.vehicle.registrationNumber})`
                    : 'Not available'}
                </span>
              </p>
            </article>

            <article className="order-detail-card-v2">
              <h5>Location Details</h5>
              <p>
                <strong>Address</strong>
                <span>{selectedOrder.address || 'N/A'}</span>
              </p>
              <p>
                <strong>Landmark</strong>
                <span>{selectedOrder.landmark || 'N/A'}</span>
              </p>
              <p>
                <strong>Coordinates</strong>
                <span>
                  {selectedOrder.latitude}, {selectedOrder.longitude}
                </span>
              </p>
              <p>
                <strong>Notes</strong>
                <span>{selectedOrder.notes || 'No extra instructions.'}</span>
              </p>
            </article>

            <article className="order-detail-card-v2 timeline">
              <h5>Request Lifecycle</h5>
              <div className="order-timeline-v2">
                {renderOrderTimeline(selectedOrder.status).map((stepItem) => (
                  <div
                    className={
                      stepItem.danger
                        ? 'order-timeline-item-v2 danger'
                        : stepItem.active
                          ? 'order-timeline-item-v2 active'
                          : 'order-timeline-item-v2'
                    }
                    key={stepItem.key}
                  >
                    <span />
                    <p>{stepItem.label}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <div className="order-summary-content-v2">
            <article className="order-items-card-v2">
              <div className="order-items-head-v2">
                <h5>Service Breakdown</h5>
                <div>
                  <span>Unit</span>
                  <span>Price</span>
                  <span>Subtotal</span>
                </div>
              </div>

              <div className="order-items-list-v2">
                <div className="order-item-row-v2">
                  <div>
                    <strong>{selectedOrder.issueType || 'Roadside service'}</strong>
                    <small>{selectedOrder.providerName || 'Assigned provider'}</small>
                  </div>
                  <span>x1</span>
                  <span>{formatCurrency(selectedOrder.estimatedPriceKsh)}</span>
                  <span>{formatCurrency(selectedOrder.estimatedPriceKsh)}</span>
                </div>
                {selectedOrder.fuelDetails ? (
                  <div className="order-item-row-v2">
                    <div>
                      <strong>Fuel delivery details</strong>
                      <small>
                        {selectedOrder.fuelDetails.litres}L {selectedOrder.fuelDetails.fuelType}
                        {selectedOrder.fuelDetails.gasolineGrade
                          ? ` (${selectedOrder.fuelDetails.gasolineGrade})`
                          : ''}
                      </small>
                    </div>
                    <span>x1</span>
                    <span>{formatCurrency(selectedOrder.fuelDetails.fuelCostKsh)}</span>
                    <span>{formatCurrency(selectedOrder.fuelDetails.fuelCostKsh)}</span>
                  </div>
                ) : null}
              </div>
            </article>

            <article className="order-total-card-v2">
              <h5>Request Summary</h5>
              <p>
                <span>Status</span>
                <strong>{orderStatusCopy[selectedOrder.status] || selectedOrder.status}</strong>
              </p>
              <p>
                <span>Service</span>
                <strong>{selectedOrder.issueType || 'Roadside service'}</strong>
              </p>
              <p>
                <span>Provider</span>
                <strong>{selectedOrder.providerName || 'Assigned provider'}</strong>
              </p>
              <p>
                <span>Distance</span>
                <strong>{Number(selectedOrder.distanceKm || 0).toFixed(1)} km</strong>
              </p>
              <p>
                <span>ETA</span>
                <strong>{String(selectedOrder.etaMinutes || 0).padStart(2, '0')} min</strong>
              </p>
              {selectedOrder.fuelDetails ? (
                <p>
                  <span>Fuel Cost</span>
                  <strong>{formatCurrency(selectedOrder.fuelDetails.fuelCostKsh)}</strong>
                </p>
              ) : null}
              {selectedOrder.fuelDetails ? (
                <p>
                  <span>Service Cost</span>
                  <strong>{formatCurrency(selectedOrder.fuelDetails.deliveryCostKsh)}</strong>
                </p>
              ) : null}
              <p className="order-total-row-v2">
                <span>Estimate</span>
                <strong>{formatCurrency(selectedOrder.estimatedPriceKsh)}</strong>
              </p>
            </article>
          </div>
        </section>
      ) : null}
    </section>
  );
}
