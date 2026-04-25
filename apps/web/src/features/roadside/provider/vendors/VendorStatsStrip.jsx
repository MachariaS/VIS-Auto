export default function VendorStatsStrip({ vendorStats }) {
  return (
    <div className="provider-stat-strip-v2 vendor-stat-strip-v2">
      <article className="provider-stat-card-v2 vendor-stat-card-v2 active">
        <div>
          <span>Registered vendors</span>
          <strong>{vendorStats.active}</strong>
        </div>
      </article>
      <article className="provider-stat-card-v2 vendor-stat-card-v2 pending">
        <div>
          <span>Pending verification</span>
          <strong>{vendorStats.pending}</strong>
        </div>
      </article>
      <article className="provider-stat-card-v2 vendor-stat-card-v2 rejected">
        <div>
          <span>Rejected requests</span>
          <strong>{vendorStats.rejected}</strong>
        </div>
      </article>
    </div>
  );
}
