function getRelativePosition(base, compare) {
  const delta = compare - base;
  return Math.max(8, Math.min(92, 50 + delta * 1800));
}

export default function TrackingMapCard({ requestItem, tracking }) {
  const providerLocation = tracking?.providerLocation;
  const customerTop = 72;
  const customerLeft = 32;
  const providerTop = providerLocation
    ? getRelativePosition(tracking.latitude, providerLocation.latitude)
    : 28;
  const providerLeft = providerLocation
    ? getRelativePosition(tracking.longitude, providerLocation.longitude)
    : 76;

  return (
    <article className="tracking-map-card">
      <div className="tracking-map-head">
        <h5>Live Dispatch Map</h5>
        <span>{tracking?.status?.replaceAll('_', ' ') || requestItem.status.replaceAll('_', ' ')}</span>
      </div>

      <div className="tracking-map-stage">
        <div className="tracking-route-line" />
        <div
          className="tracking-marker customer"
          style={{ top: `${customerTop}%`, left: `${customerLeft}%` }}
        >
          <span />
          <label>Customer</label>
        </div>
        <div
          className="tracking-marker provider"
          style={{ top: `${providerTop}%`, left: `${providerLeft}%` }}
        >
          <span />
          <label>Provider</label>
        </div>
      </div>

      <div className="tracking-coordinates">
        <p>
          <strong>Customer</strong>
          <span>
            {Number(requestItem.latitude).toFixed(4)}, {Number(requestItem.longitude).toFixed(4)}
          </span>
        </p>
        <p>
          <strong>Provider</strong>
          <span>
            {providerLocation
              ? `${Number(providerLocation.latitude).toFixed(4)}, ${Number(providerLocation.longitude).toFixed(4)}`
              : 'Waiting for provider location'}
          </span>
        </p>
      </div>
    </article>
  );
}
