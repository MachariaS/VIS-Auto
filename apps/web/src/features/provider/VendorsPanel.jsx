import VendorPartnersList from './vendors/VendorPartnersList';
import VendorRequestsReview from './vendors/VendorRequestsReview';
import VendorStatsStrip from './vendors/VendorStatsStrip';

export default function VendorsPanel({
  activeVendorPartners,
  pendingVendorRequests,
  vendorStats,
  focusedVendorRequest,
  selectedVendorRequestId,
  setSelectedVendorRequestId,
  vendorActionRequestId,
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

      <VendorStatsStrip vendorStats={vendorStats} />

      <div className="vendor-workspace-v2">
        <VendorPartnersList activeVendorPartners={activeVendorPartners} />
        <VendorRequestsReview
          focusedVendorRequest={focusedVendorRequest}
          pendingVendorRequests={pendingVendorRequests}
          selectedVendorRequestId={selectedVendorRequestId}
          setSelectedVendorRequestId={setSelectedVendorRequestId}
          vendorActionRequestId={vendorActionRequestId}
          vendorStats={vendorStats}
          onAccept={onAccept}
          onReject={onReject}
        />
      </div>
    </section>
  );
}
