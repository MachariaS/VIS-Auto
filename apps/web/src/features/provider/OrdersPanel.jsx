import { orderHistoryTabs, orderStatusCopy } from '../../shared/constants';
import { formatCurrency } from '../../shared/helpers';

function renderStatusBadge(statusValue) {
  return (
    <span className={`order-status-pill-v2 ${statusValue}`}>
      {orderStatusCopy[statusValue] || 'In Progress'}
    </span>
  );
}

function renderOrderTimeline(sourceStatus, statusValue) {
  if (sourceStatus === 'cancelled' || statusValue === 'cancelled') {
    return [
      { key: 'queued', label: 'Queued', active: true },
      { key: 'cancelled', label: 'Cancelled', active: true, danger: true },
    ];
  }

  return [
    { key: 'queued', label: 'Queued', active: true },
    {
      key: 'picked',
      label: 'Picked',
      active:
        sourceStatus === 'provider_assigned' ||
        sourceStatus === 'in_progress' ||
        sourceStatus === 'completed',
    },
    {
      key: 'shipped',
      label: 'Shipped',
      active: sourceStatus === 'in_progress' || sourceStatus === 'completed',
    },
    {
      key: 'delivered',
      label: statusValue === 'collected' ? 'Collected' : 'Delivered',
      active: sourceStatus === 'completed' || statusValue === 'delivered',
    },
  ];
}

export default function OrdersPanel({
  providerOrders,
  filteredProviderOrders,
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
  setMessage,
}) {
  const completedCount = providerOrders.filter(
    (orderItem) => orderItem.status === 'delivered' || orderItem.status === 'collected',
  ).length;

  const cancelledCount = providerOrders.filter(
    (orderItem) => orderItem.status === 'cancelled',
  ).length;

  return (
    <section className="provider-home-v2 order-history-v2">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Order history</p>
          <h3>Order History</h3>
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
          const count =
            tabItem.id === 'all'
              ? providerOrders.length
              : tabItem.id === 'summary'
                ? providerOrders.length - cancelledCount
                : tabItem.id === 'completed'
                  ? completedCount
                  : cancelledCount;

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
              <span>{count}</span>
            </button>
          );
        })}
      </div>

      <div className="order-table-v2">
        <div className="order-table-head-v2">
          <span>Id</span>
          <span>Name</span>
          <span>Payment</span>
          <span>Time remaining</span>
          <span>Type</span>
          <span>Status</span>
          <span>Total</span>
          <span>Action</span>
        </div>

        {filteredProviderOrders.length === 0 ? (
          <article className="order-row-empty-v2">No orders match the selected filters.</article>
        ) : (
          filteredProviderOrders.map((orderItem) => (
            <article className="order-row-v2" key={orderItem.reference}>
              <span>{orderItem.id}</span>
              <span>
                <strong>{orderItem.customer.name}</strong>
                <small>{orderItem.vendorName}</small>
              </span>
              <span>{orderItem.paymentMethod}</span>
              <span>{String(orderItem.etaMinutes).padStart(2, '0')} min</span>
              <span>{orderItem.orderType}</span>
              <span>{renderStatusBadge(orderItem.status)}</span>
              <span>{formatCurrency(orderItem.totalAmountKsh)}</span>
              <span className="order-action-cell-v2">
                <button
                  type="button"
                  className="order-action-trigger-v2"
                  onClick={() =>
                    setOrderActionMenuId((current) =>
                      current === orderItem.reference ? '' : orderItem.reference,
                    )
                  }
                >
                  ⋮
                </button>

                {orderActionMenuId === orderItem.reference ? (
                  <div className="order-action-menu-v2">
                    <button type="button" onClick={() => onRowAction('summary', orderItem)}>
                      Order Summary
                    </button>
                    <button type="button" onClick={() => onRowAction('message', orderItem)}>
                      Message
                    </button>
                    {orderItem.sourceStatus === 'searching' ? (
                      <button
                        type="button"
                        onClick={() => onRowAction('pick', orderItem)}
                        disabled={updatingOrderId === orderItem.reference}
                      >
                        Mark As Picked
                      </button>
                    ) : null}
                    {orderItem.sourceStatus === 'provider_assigned' ? (
                      <button
                        type="button"
                        onClick={() => onRowAction('ship', orderItem)}
                        disabled={updatingOrderId === orderItem.reference}
                      >
                        Mark As Shipped
                      </button>
                    ) : null}
                    {orderItem.sourceStatus === 'in_progress' ? (
                      <button
                        type="button"
                        onClick={() => onRowAction('deliver', orderItem)}
                        disabled={updatingOrderId === orderItem.reference}
                      >
                        Mark As Delivered
                      </button>
                    ) : null}
                    {orderItem.sourceStatus !== 'completed' &&
                    orderItem.sourceStatus !== 'cancelled' ? (
                      <button
                        type="button"
                        className="danger"
                        onClick={() => onRowAction('cancel', orderItem)}
                        disabled={updatingOrderId === orderItem.reference}
                      >
                        Cancel Order
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
              <h4>Order Number {selectedOrder.reference}</h4>
              <p>
                Order created{' '}
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
                onClick={() => setMessage(`Print view prepared for ${selectedOrder.reference}.`)}
              >
                Print
              </button>
            </div>
          </header>

          <div className="order-summary-grid-v2">
            <article className="order-detail-card-v2">
              <h5>Customer Details</h5>
              <p>
                <strong>Name</strong>
                <span>{selectedOrder.customer.name}</span>
              </p>
              <p>
                <strong>Email</strong>
                <span>{selectedOrder.customer.email}</span>
              </p>
              <p>
                <strong>Phone</strong>
                <span>{selectedOrder.customer.phone}</span>
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
              <h5>Delivery Address</h5>
              <p>
                <strong>Address</strong>
                <span>{selectedOrder.delivery.addressLine}</span>
              </p>
              <p>
                <strong>Building</strong>
                <span>{selectedOrder.delivery.building}</span>
              </p>
              <p>
                <strong>Street</strong>
                <span>{selectedOrder.delivery.street}</span>
              </p>
              <p>
                <strong>Postcode</strong>
                <span>{selectedOrder.delivery.postcode}</span>
              </p>
            </article>

            <article className="order-detail-card-v2 timeline">
              <h5>Order History</h5>
              <div className="order-timeline-v2">
                {renderOrderTimeline(selectedOrder.sourceStatus, selectedOrder.status).map(
                  (stepItem) => (
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
                  ),
                )}
              </div>
            </article>
          </div>

          <div className="order-summary-content-v2">
            <article className="order-items-card-v2">
              <div className="order-items-head-v2">
                <h5>Item Summary</h5>
                <div>
                  <span>QTY</span>
                  <span>Price</span>
                  <span>Total</span>
                </div>
              </div>

              <div className="order-items-list-v2">
                {selectedOrder.items.map((item) => (
                  <div className="order-item-row-v2" key={item.id}>
                    <div>
                      <strong>{item.title}</strong>
                      <small>{item.subtitle}</small>
                    </div>
                    <span>x{item.quantity}</span>
                    <span>{formatCurrency(item.price)}</span>
                    <span>{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="order-total-card-v2">
              <h5>Order Summary</h5>
              <p>
                <span>Payment</span>
                <strong>{selectedOrder.paymentMethod}</strong>
              </p>
              <p>
                <span>Service</span>
                <strong>{selectedOrder.service}</strong>
              </p>
              <p>
                <span>Vendor</span>
                <strong>{selectedOrder.vendorName}</strong>
              </p>
              <p>
                <span>Subtotal</span>
                <strong>{formatCurrency(selectedOrder.totalAmountKsh - 500)}</strong>
              </p>
              <p>
                <span>Dispatch fee</span>
                <strong>{formatCurrency(500)}</strong>
              </p>
              <p className="order-total-row-v2">
                <span>Total</span>
                <strong>{formatCurrency(selectedOrder.totalAmountKsh)}</strong>
              </p>
            </article>
          </div>
        </section>
      ) : null}
    </section>
  );
}
