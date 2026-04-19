import { vendorStatusCopy } from '../../../shared/constants';

export default function VendorPartnersList({ activeVendorPartners }) {
  return (
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
                  <span className={`vendor-state-pill-v2 ${vendorState}`}>{vendorStateLabel}</span>
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
  );
}
