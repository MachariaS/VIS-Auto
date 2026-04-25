import { vendorStatusCopy } from '../../../../shared/constants';

export default function VendorRequestsReview({
  focusedVendorRequest,
  pendingVendorRequests,
  selectedVendorRequestId,
  setSelectedVendorRequestId,
  vendorActionRequestId,
  vendorStats,
  onAccept,
  onReject,
}) {
  return (
    <aside className="vendor-review-v2">
      <div className="provider-section-head-v2">
        <h4>Integration requests</h4>
        <span>{vendorStats.pending} open</span>
      </div>

      {pendingVendorRequests.length === 0 ? (
        <div className="empty-state">No pending requests. New requests will appear here automatically.</div>
      ) : (
        <>
          <div className="vendor-queue-v2">
            {pendingVendorRequests.map((requestItem) => (
              <button
                className={
                  selectedVendorRequestId === requestItem.id
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
              <p>{focusedVendorRequest.notes || 'No integration notes provided.'}</p>
              <div className="form-actions">
                <button
                  className="primary-cta"
                  type="button"
                  onClick={() => onAccept(focusedVendorRequest.id)}
                  disabled={vendorActionRequestId === focusedVendorRequest.id}
                >
                  {vendorActionRequestId === focusedVendorRequest.id
                    ? 'Updating...'
                    : 'Accept integration'}
                </button>
                <button
                  className="ghost-button danger"
                  type="button"
                  onClick={() => onReject(focusedVendorRequest.id)}
                  disabled={vendorActionRequestId === focusedVendorRequest.id}
                >
                  Reject request
                </button>
              </div>
            </article>
          ) : null}
        </>
      )}
    </aside>
  );
}
