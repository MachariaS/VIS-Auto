import { vendorStatusCopy } from '../../shared/constants';

export default function VendorsPanel({
  activeVendorPartners,
  pendingVendorRequests,
  vendorStats,
  focusedVendorRequest,
  selectedVendorRequestId,
  setSelectedVendorRequestId,
  onAccept,
  onReject,
  onOpenNotifications,
}) {
  return (
    <section className="provider-home-v2 vendor-board-v2">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Manage vendors</p>
          <h3>Manage Vendors</h3>
        </div>
        <button className="secondary-cta" type="button" onClick={onOpenNotifications}>
          Review requests ({vendorStats.pending})
        </button>
      </div>

      <div className="provider-stat-strip-v2 vendor-stat-strip-v2">
        <article className="provider-stat-card-v2 vendor-stat-card-v2 active" key="active-vendors">
          <div>
            <span>Registered vendors</span>
            <strong>{vendorStats.active}</strong>
          </div>
        </article>
        <article className="provider-stat-card-v2 vendor-stat-card-v2 pending" key="pending-vendors">
          <div>
            <span>Pending verification</span>
            <strong>{vendorStats.pending}</strong>
          </div>
        </article>
        <article
          className="provider-stat-card-v2 vendor-stat-card-v2 rejected"
          key="rejected-vendors"
        >
          <div>
            <span>Rejected requests</span>
            <strong>{vendorStats.rejected}</strong>
          </div>
        </article>
      </div>

      <div className="vendor-workspace-v2">
        <section className="vendor-cards-v2">
          {activeVendorPartners.length === 0 ? (
            <article className="provider-note-v2">
              <strong>No integrated vendors yet.</strong>
              <p>Approved vendors will appear here after you accept integration requests.</p>
            </article>
          ) : (
            activeVendorPartners.map((vendor) => {
              const isPendingReview =
                Number(vendor.completedOrders || 0) === 0 && Number(vendor.rating || 0) === 0;
              const vendorState = isPendingReview ? 'pending' : 'integrated';
              const vendorStateLabel = isPendingReview
                ? vendorStatusCopy.pending
                : vendorStatusCopy.integrated;

              return (
                <article className="vendor-card-v2" key={vendor.id}>
                  <div
                    className="vendor-avatar-v2"
                    style={{
                      backgroundImage: `linear-gradient(180deg, rgba(13, 22, 17, 0.04), rgba(13, 22, 17, 0.22)), url(${vendor.imageUrl || '/assets/other_services.jpeg'})`,
                    }}
                  >
                    <span className="vendor-demand-pill-v2">{vendor.demand || 'Integrated'}</span>
                  </div>
                  <div className="vendor-copy-v2">
                    <div className="vendor-copy-head-v2">
                      <strong>{vendor.name}</strong>
                    </div>
                    <div className="vendor-state-row-v2">
                      <span className={`vendor-state-pill-v2 ${vendorState}`}>
                        {vendorStateLabel}
                      </span>
                    </div>
                    <div className="vendor-metrics-v2">
                      <article>
                        <label>Category</label>
                        <strong>{vendor.category || 'General Service'}</strong>
                      </article>
                      <article>
                        <label>Join Date</label>
                        <strong>{vendor.joinDate || 'N/A'}</strong>
                      </article>
                      <article>
                        <label>Completed Orders</label>
                        <strong>{vendor.completedOrders || 0}</strong>
                      </article>
                      <article>
                        <label>Ratings</label>
                        <strong>{(vendor.rating ?? 0).toFixed(1)}</strong>
                      </article>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </section>

        <aside className="vendor-review-v2">
          <div className="provider-section-head-v2">
            <h4>Integration requests</h4>
            <span>{vendorStats.pending} open</span>
          </div>

          {pendingVendorRequests.length === 0 ? (
            <div className="empty-state">
              No pending requests. New requests will appear here automatically.
            </div>
          ) : (
            <>
              <div className="vendor-queue-v2">
                {pendingVendorRequests.map((requestItem) => (
                  <button
                    className={
                      focusedVendorRequest?.id === requestItem.id
                        ? 'vendor-queue-item-v2 active'
                        : 'vendor-queue-item-v2'
                    }
                    type="button"
                    key={requestItem.id}
                    onClick={() => setSelectedVendorRequestId(requestItem.id)}
                  >
                    <strong>{requestItem.name}</strong>
                    <span>{requestItem.category || 'General Service'}</span>
                  </button>
                ))}
              </div>

              {focusedVendorRequest ? (
                <article className="vendor-review-card-v2">
                  <strong>{focusedVendorRequest.name}</strong>
                  <div className="vendor-state-row-v2">
                    <span className="vendor-state-pill-v2 pending">{vendorStatusCopy.pending}</span>
                  </div>
                  <div className="vendor-review-meta-v2">
                    <span>Category: {focusedVendorRequest.category || 'General Service'}</span>
                    <span>Requested: {focusedVendorRequest.requestedAt || 'N/A'}</span>
                    <span>Contact: {focusedVendorRequest.submittedBy || 'N/A'}</span>
                  </div>
                  <div className="form-actions">
                    <button
                      className="primary-cta"
                      type="button"
                      onClick={() => onAccept(focusedVendorRequest.id)}
                    >
                      Accept integration
                    </button>
                    <button
                      className="ghost-button danger"
                      type="button"
                      onClick={() => onReject(focusedVendorRequest.id)}
                    >
                      Reject request
                    </button>
                  </div>
                </article>
              ) : null}
            </>
          )}
        </aside>
      </div>
    </section>
  );
}
