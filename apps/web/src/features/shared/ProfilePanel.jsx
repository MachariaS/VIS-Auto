import { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  branchTypeOptions,
  countryOptions,
  providerServiceCatalogOptions,
  providerVehicleTypeOptions,
} from '../../shared/constants';
import {
  normalizeLocationQuery,
  parseAddressParts,
  request,
  shouldLookupAfterWord,
} from '../../shared/helpers';

const LOCATION_SUGGESTION_CACHE_TTL_MS = 5 * 60 * 1000;

export default function ProfilePanel({ vendorStats }) {
  const {
    user,
    token,
    message,
    setMessage,
    profileSettings,
    profileSaving,
    profileLoading,
    handleProfileFieldChange,
    handleBusinessNestedFieldChange,
    toggleBusinessListField,
    addBusinessLocation,
    updateBusinessLocation,
    removeBusinessLocation,
    handleSaveProfile,
  } = useApp();

  const [locationBias, setLocationBias] = useState({ latitude: null, longitude: null });
  const [locationResolvingIndex, setLocationResolvingIndex] = useState(null);
  const [locationSearchingIndex, setLocationSearchingIndex] = useState(null);
  const [locationSuggestionsByIndex, setLocationSuggestionsByIndex] = useState({});
  const [lastSuggestionQueryByIndex, setLastSuggestionQueryByIndex] = useState({});
  const locationSuggestionTimeoutsRef = useRef({});
  const locationSuggestionCacheRef = useRef(new Map());
  const pendingVendorCount =
    vendorStats?.pending ?? profileSettings.vendors?.pendingRequests?.length ?? 0;
  const activeVendorCount =
    vendorStats?.active ?? profileSettings.vendors?.activePartners?.length ?? 0;

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationBias({
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
        });
      },
      () => setLocationBias({ latitude: null, longitude: null }),
      { enableHighAccuracy: false, timeout: 6000 },
    );
  }, []);

  useEffect(
    () => () => {
      Object.values(locationSuggestionTimeoutsRef.current).forEach((timerId) => {
        clearTimeout(timerId);
      });
    },
    [],
  );

  async function searchBusinessLocationSuggestions(index, query) {
    const trimmed = normalizeLocationQuery(query || '');
    if (trimmed.length < 3) {
      setLocationSuggestionsByIndex((current) => ({ ...current, [index]: [] }));
      return;
    }
    if (lastSuggestionQueryByIndex[index] === trimmed) return;

    setLocationSearchingIndex(index);
    try {
      const branch = profileSettings.business.locations?.[index];
      const countryCode = branch?.countryCode || 'KE';
      const cacheKey = JSON.stringify({
        query: trimmed.toLowerCase(),
        countryCode: countryCode.toUpperCase(),
        nearLat:
          typeof locationBias.latitude === 'number'
            ? Number(locationBias.latitude.toFixed(2))
            : null,
        nearLng:
          typeof locationBias.longitude === 'number'
            ? Number(locationBias.longitude.toFixed(2))
            : null,
      });
      const cachedSuggestion = locationSuggestionCacheRef.current.get(cacheKey);
      if (cachedSuggestion && cachedSuggestion.expiresAt > Date.now()) {
        setLocationSuggestionsByIndex((current) => ({
          ...current,
          [index]: cachedSuggestion.value,
        }));
        setLastSuggestionQueryByIndex((current) => ({ ...current, [index]: trimmed }));
        if (cachedSuggestion.value.length === 0) {
          setMessage('No location suggestions found. Try a shorter name or correct spelling.');
        }
        return;
      }

      if (cachedSuggestion) {
        locationSuggestionCacheRef.current.delete(cacheKey);
      }

      let results = [];
      try {
        results = await request('/locations/suggest', {
          query: trimmed,
          countryCode,
          nearLat: locationBias.latitude ?? undefined,
          nearLng: locationBias.longitude ?? undefined,
        });
      } catch {
        results = [];
      }

      const mapped = (results || []).map((item) => ({
        name: item.name || '',
        placeId: item.placeId || '',
        formattedAddress: item.address || '',
        label:
          item.name && item.road ? `${item.name}, ${item.road}` : item.name || item.address || '',
        latitude: item.lat || '',
        longitude: item.lng || '',
        town: item.town || '',
        road: item.road || '',
        landmark: item.landmark || '',
        mapUrl:
          item.lat && item.lng
            ? `https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lng}`
            : item.placeId && (item.address || item.name)
              ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.address || item.name)}&query_place_id=${encodeURIComponent(item.placeId)}`
              : item.address || item.name
                ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.address || item.name)}`
                : '',
      }));

      locationSuggestionCacheRef.current.set(cacheKey, {
        value: mapped,
        expiresAt: Date.now() + LOCATION_SUGGESTION_CACHE_TTL_MS,
      });
      setLocationSuggestionsByIndex((current) => ({ ...current, [index]: mapped }));
      if (mapped.length === 0) {
        setMessage('No location suggestions found. Try a shorter name or correct spelling.');
      }
      setLastSuggestionQueryByIndex((current) => ({ ...current, [index]: trimmed }));
    } catch (error) {
      setMessage(error.message || 'Unable to fetch location suggestions.');
      setLastSuggestionQueryByIndex((current) => ({ ...current, [index]: '' }));
    } finally {
      setLocationSearchingIndex((current) => (current === index ? null : current));
    }
  }

  function scheduleBusinessLocationSuggestions(index, query) {
    const trimmed = normalizeLocationQuery(query || '');
    const existingTimer = locationSuggestionTimeoutsRef.current[index];
    if (existingTimer) {
      clearTimeout(existingTimer);
      delete locationSuggestionTimeoutsRef.current[index];
    }
    if (trimmed.length < 3) {
      setLocationSuggestionsByIndex((current) => ({ ...current, [index]: [] }));
      setLastSuggestionQueryByIndex((current) => ({ ...current, [index]: '' }));
      return;
    }
    if (shouldLookupAfterWord(query || '')) {
      void searchBusinessLocationSuggestions(index, query);
      return;
    }
    locationSuggestionTimeoutsRef.current[index] = setTimeout(() => {
      void searchBusinessLocationSuggestions(index, query);
      delete locationSuggestionTimeoutsRef.current[index];
    }, 500);
  }

  function selectBusinessLocationSuggestion(index, suggestion) {
    const addressValue = suggestion.label || suggestion.formattedAddress || suggestion.name || '';
    const parsedAddress = parseAddressParts(
      suggestion.formattedAddress || addressValue,
      suggestion.name || '',
    );
    const landmarkValue = suggestion.landmark || suggestion.name || '';
    const fallbackMapUrl =
      suggestion.placeId && (suggestion.formattedAddress || addressValue)
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(suggestion.formattedAddress || addressValue)}&query_place_id=${encodeURIComponent(suggestion.placeId)}`
        : suggestion.formattedAddress || addressValue
          ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(suggestion.formattedAddress || addressValue)}`
          : '';
    const selectedMapUrl = suggestion.mapUrl || fallbackMapUrl;

    updateBusinessLocation(index, 'address', addressValue);
    updateBusinessLocation(index, 'town', suggestion.town || parsedAddress.town || '');
    updateBusinessLocation(index, 'road', suggestion.road || parsedAddress.road || '');
    updateBusinessLocation(index, 'landmark', landmarkValue);
    updateBusinessLocation(index, 'latitude', suggestion.latitude || '');
    updateBusinessLocation(index, 'longitude', suggestion.longitude || '');
    if (selectedMapUrl) updateBusinessLocation(index, 'mapUrl', selectedMapUrl);

    setLocationSuggestionsByIndex((current) => ({ ...current, [index]: [] }));
    setLastSuggestionQueryByIndex((current) => ({
      ...current,
      [index]: normalizeLocationQuery(addressValue),
    }));
    setMessage('Location details auto-filled from search suggestion.');
  }

  async function resolveBusinessLocation(index) {
    const location = profileSettings.business.locations?.[index];
    if (!location) return;
    setLocationResolvingIndex(index);
    try {
      const composedQuery = [
        location.address,
        location.road,
        location.town,
        location.landmark,
      ]
        .filter(Boolean)
        .join(', ');

      if (!composedQuery && !location.mapUrl) {
        setMessage('Add a map link or address details first so we can resolve location.');
        return;
      }

      const bestMatch = await request('/locations/resolve', {
        query: composedQuery || undefined,
        mapUrl: location.mapUrl || undefined,
        countryCode: location.countryCode || 'KE',
        nearLat: locationBias.latitude ?? undefined,
        nearLng: locationBias.longitude ?? undefined,
      });

      if (!bestMatch) {
        setMessage('No map match found. Try adding town, road, and a nearby landmark.');
        return;
      }

      updateBusinessLocation(index, 'latitude', bestMatch.lat || '');
      updateBusinessLocation(index, 'longitude', bestMatch.lng || '');
      updateBusinessLocation(index, 'address', bestMatch.address || location.address);
      updateBusinessLocation(index, 'town', bestMatch.town || location.town);
      updateBusinessLocation(index, 'road', bestMatch.road || location.road);
      updateBusinessLocation(index, 'landmark', bestMatch.landmark || location.landmark);

      if (bestMatch.lat && bestMatch.lng) {
        updateBusinessLocation(
          index,
          'mapUrl',
          `https://www.google.com/maps/search/?api=1&query=${bestMatch.lat},${bestMatch.lng}`,
        );
      }

      setMessage('Location resolved for heatmap and branch details.');
    } catch (error) {
      setMessage(error.message || 'Unable to resolve location at the moment.');
    } finally {
      setLocationResolvingIndex(null);
    }
  }

  if (user?.accountType !== 'provider') {
    return (
      <section className="profile-grid">
        <form className="dashboard-panel stack" onSubmit={handleSaveProfile}>
          <div className="panel-head">
            <div>
              <p className="eyebrow">Profile</p>
              <h3>Account details</h3>
            </div>
          </div>
          <div className="form-grid">
            <label>
              <span>Display name</span>
              <input
                value={profileSettings.account.displayName}
                onChange={(event) =>
                  handleProfileFieldChange('account', 'displayName', event.target.value)
                }
              />
            </label>
            <label>
              <span>Email</span>
              <input
                value={profileSettings.account.email}
                onChange={(event) =>
                  handleProfileFieldChange('account', 'email', event.target.value)
                }
              />
            </label>
            <label>
              <span>Phone</span>
              <input
                placeholder="+254..."
                value={profileSettings.account.phone}
                onChange={(event) =>
                  handleProfileFieldChange('account', 'phone', event.target.value)
                }
              />
            </label>
            <label>
              <span>Location</span>
              <input
                value={profileSettings.account.location}
                onChange={(event) =>
                  handleProfileFieldChange('account', 'location', event.target.value)
                }
              />
            </label>
          </div>
          <button className="primary-cta" type="submit">
            {profileSaving ? 'Saving...' : profileLoading ? 'Syncing...' : 'Save profile'}
          </button>
        </form>
      </section>
    );
  }

  return (
    <section className="profile-stack-v2">
      <form className="dashboard-panel stack" onSubmit={handleSaveProfile}>
        <div className="panel-head">
          <div>
            <p className="eyebrow">My profile</p>
            <h3>Business identity and operations</h3>
          </div>
        </div>
        {message ? <div className="status-banner">{message}</div> : null}

        <div className="form-grid">
          <label>
            <span>Business display name</span>
            <input
              value={profileSettings.account.displayName}
              onChange={(event) =>
                handleProfileFieldChange('account', 'displayName', event.target.value)
              }
            />
          </label>
          <label>
            <span>Business legal name</span>
            <input
              value={profileSettings.account.company}
              onChange={(event) =>
                handleProfileFieldChange('account', 'company', event.target.value)
              }
            />
          </label>
          <label>
            <span>Primary email</span>
            <input
              value={profileSettings.account.email}
              onChange={(event) =>
                handleProfileFieldChange('account', 'email', event.target.value)
              }
            />
          </label>
          <label>
            <span>Primary phone</span>
            <input
              placeholder="+254..."
              value={profileSettings.business.contacts.primaryPhone}
              onChange={(event) =>
                handleBusinessNestedFieldChange('contacts', 'primaryPhone', event.target.value)
              }
            />
          </label>
        </div>

        <label>
          <span>Business brief</span>
          <textarea
            value={profileSettings.business.brief}
            placeholder="Describe your garage, specialties, and why drivers trust you."
            onChange={(event) =>
              handleProfileFieldChange('business', 'brief', event.target.value)
            }
          />
        </label>

        <section className="soft-block profile-soft-block">
          <div className="panel-head compact">
            <div>
              <p className="eyebrow">Locations</p>
              <h3>Business geolocation points</h3>
            </div>
            <button className="secondary-cta" type="button" onClick={addBusinessLocation}>
              Add location
            </button>
          </div>

          <div className="location-grid-v2">
            {(profileSettings.business.locations || []).map((location, index) => (
              <article className="location-card-v2" key={`${location.branchName}-${index}`}>
                <div className="form-grid">
                  <label>
                    <span>Branch type</span>
                    <select
                      value={location.branchName}
                      onChange={(event) =>
                        updateBusinessLocation(index, 'branchName', event.target.value)
                      }
                    >
                      {branchTypeOptions.map((branchType) => (
                        <option key={branchType} value={branchType}>
                          {branchType}
                        </option>
                      ))}
                      {!branchTypeOptions.includes(location.branchName) ? (
                        <option value={location.branchName}>{location.branchName}</option>
                      ) : null}
                    </select>
                  </label>
                  <label>
                    <span>Country</span>
                    <select
                      value={location.countryCode || 'KE'}
                      onChange={(event) =>
                        updateBusinessLocation(index, 'countryCode', event.target.value)
                      }
                    >
                      {countryOptions.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Address</span>
                    <div className="location-autocomplete-v2">
                      <input
                        placeholder="Search business or building name"
                        value={location.address}
                        onChange={(event) => {
                          const value = event.target.value;
                          updateBusinessLocation(index, 'address', value);
                          scheduleBusinessLocationSuggestions(index, value);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            const existingTimer = locationSuggestionTimeoutsRef.current[index];
                            if (existingTimer) {
                              clearTimeout(existingTimer);
                              delete locationSuggestionTimeoutsRef.current[index];
                            }
                            void searchBusinessLocationSuggestions(
                              index,
                              event.currentTarget.value,
                            );
                          }
                        }}
                      />
                      {locationSearchingIndex === index ? (
                        <div className="location-hint-v2">Searching location...</div>
                      ) : null}
                      {(locationSuggestionsByIndex[index] || []).length > 0 ? (
                        <div className="location-suggestions-v2" role="listbox">
                          {(locationSuggestionsByIndex[index] || []).map((suggestion) => (
                            <button
                              key={`${suggestion.label}-${suggestion.latitude}-${suggestion.longitude}`}
                              type="button"
                              className="location-suggestion-item-v2"
                              onClick={() => selectBusinessLocationSuggestion(index, suggestion)}
                            >
                              <span>{suggestion.label}</span>
                              {suggestion.formattedAddress ? (
                                <small>{suggestion.formattedAddress}</small>
                              ) : null}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </label>
                  <label>
                    <span>Town</span>
                    <input
                      value={location.town || ''}
                      onChange={(event) =>
                        updateBusinessLocation(index, 'town', event.target.value)
                      }
                    />
                  </label>
                  <label>
                    <span>Road</span>
                    <input
                      value={location.road || ''}
                      onChange={(event) =>
                        updateBusinessLocation(index, 'road', event.target.value)
                      }
                    />
                  </label>
                  <label>
                    <span>Nearest landmark</span>
                    <input
                      value={location.landmark || ''}
                      onChange={(event) =>
                        updateBusinessLocation(index, 'landmark', event.target.value)
                      }
                    />
                  </label>
                  <label>
                    <span>Google Maps link</span>
                    <input
                      placeholder="https://maps.app.goo.gl/..."
                      value={location.mapUrl || ''}
                      readOnly
                    />
                  </label>
                </div>
                <div className="location-actions-v2">
                  <button
                    className="secondary-cta"
                    type="button"
                    disabled={locationResolvingIndex === index}
                    onClick={() => resolveBusinessLocation(index)}
                  >
                    {locationResolvingIndex === index
                      ? 'Resolving...'
                      : 'Resolve location from map'}
                  </button>
                  {location.mapUrl ? (
                    <a
                      className="secondary-cta"
                      href={location.mapUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open map
                    </a>
                  ) : null}
                  {location.latitude && location.longitude ? (
                    <span className="location-meta-v2">
                      Heatmap point ready: {location.latitude}, {location.longitude}
                    </span>
                  ) : (
                    <span className="location-meta-v2">
                      Heatmap point will auto-fill after resolve.
                    </span>
                  )}
                </div>
                {(profileSettings.business.locations || []).length > 1 ? (
                  <button
                    className="ghost-button danger"
                    type="button"
                    onClick={() => removeBusinessLocation(index)}
                  >
                    Remove location
                  </button>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <section className="soft-block profile-soft-block">
          <div className="panel-head compact">
            <div>
              <p className="eyebrow">Capabilities</p>
              <h3>Services and supported vehicles</h3>
            </div>
          </div>
          <div className="tag-cloud-v2">
            {providerServiceCatalogOptions.map((service) => (
              <button
                key={service}
                type="button"
                className={
                  profileSettings.business.offeredServices.includes(service)
                    ? 'chip-active'
                    : 'chip'
                }
                onClick={() => toggleBusinessListField('offeredServices', service)}
              >
                {service}
              </button>
            ))}
          </div>
          <div className="tag-cloud-v2">
            {providerVehicleTypeOptions.map((vehicleType) => (
              <button
                key={vehicleType}
                type="button"
                className={
                  profileSettings.business.supportedVehicleTypes.includes(vehicleType)
                    ? 'chip-active'
                    : 'chip'
                }
                onClick={() => toggleBusinessListField('supportedVehicleTypes', vehicleType)}
              >
                {vehicleType}
              </button>
            ))}
          </div>
        </section>

        <section className="soft-block profile-soft-block">
          <div className="panel-head compact">
            <div>
              <p className="eyebrow">KYC</p>
              <h3>Registration and compliance documents</h3>
            </div>
          </div>
          <div className="form-grid">
            <label>
              <span>KRA PIN</span>
              <input
                value={profileSettings.business.kyc.kraPin}
                onChange={(event) =>
                  handleBusinessNestedFieldChange('kyc', 'kraPin', event.target.value)
                }
              />
            </label>
            <label>
              <span>Certificate of incorporation</span>
              <input
                value={profileSettings.business.kyc.certificateOfIncorporation}
                onChange={(event) =>
                  handleBusinessNestedFieldChange(
                    'kyc',
                    'certificateOfIncorporation',
                    event.target.value,
                  )
                }
              />
            </label>
            <label>
              <span>Business permit number</span>
              <input
                value={profileSettings.business.kyc.businessPermitNumber}
                onChange={(event) =>
                  handleBusinessNestedFieldChange(
                    'kyc',
                    'businessPermitNumber',
                    event.target.value,
                  )
                }
              />
            </label>
            <label>
              <span>Tax compliance certificate</span>
              <input
                value={profileSettings.business.kyc.taxComplianceCertificate}
                onChange={(event) =>
                  handleBusinessNestedFieldChange(
                    'kyc',
                    'taxComplianceCertificate',
                    event.target.value,
                  )
                }
              />
            </label>
          </div>
        </section>

        <section className="soft-block profile-soft-block">
          <div className="panel-head compact">
            <div>
              <p className="eyebrow">Contacts and socials</p>
              <h3>Reachability and channels</h3>
            </div>
          </div>
          <div className="form-grid">
            <label>
              <span>Support phone</span>
              <input
                value={profileSettings.business.contacts.supportPhone}
                onChange={(event) =>
                  handleBusinessNestedFieldChange('contacts', 'supportPhone', event.target.value)
                }
              />
            </label>
            <label>
              <span>Support email</span>
              <input
                value={profileSettings.business.contacts.supportEmail}
                onChange={(event) =>
                  handleBusinessNestedFieldChange('contacts', 'supportEmail', event.target.value)
                }
              />
            </label>
            <label>
              <span>Website</span>
              <input
                value={profileSettings.business.contacts.website}
                onChange={(event) =>
                  handleBusinessNestedFieldChange('contacts', 'website', event.target.value)
                }
              />
            </label>
            <label>
              <span>WhatsApp</span>
              <input
                value={profileSettings.business.contacts.whatsapp}
                onChange={(event) =>
                  handleBusinessNestedFieldChange('contacts', 'whatsapp', event.target.value)
                }
              />
            </label>
            <label>
              <span>Instagram</span>
              <input
                value={profileSettings.business.contacts.instagram}
                onChange={(event) =>
                  handleBusinessNestedFieldChange('contacts', 'instagram', event.target.value)
                }
              />
            </label>
            <label>
              <span>Facebook</span>
              <input
                value={profileSettings.business.contacts.facebook}
                onChange={(event) =>
                  handleBusinessNestedFieldChange('contacts', 'facebook', event.target.value)
                }
              />
            </label>
            <label>
              <span>LinkedIn</span>
              <input
                value={profileSettings.business.contacts.linkedin}
                onChange={(event) =>
                  handleBusinessNestedFieldChange('contacts', 'linkedin', event.target.value)
                }
              />
            </label>
            <label>
              <span>X (Twitter)</span>
              <input
                value={profileSettings.business.contacts.x}
                onChange={(event) =>
                  handleBusinessNestedFieldChange('contacts', 'x', event.target.value)
                }
              />
            </label>
          </div>
        </section>

        <section className="soft-block profile-soft-block">
          <div className="panel-head compact">
            <div>
              <p className="eyebrow">Vendor network</p>
              <h3>Provider-to-provider subcontracting workflow</h3>
            </div>
          </div>
          <label>
            <span>Request policy</span>
            <select
              value={profileSettings.vendors.requestPolicy}
              onChange={(event) =>
                handleProfileFieldChange('vendors', 'requestPolicy', event.target.value)
              }
            >
              <option value="approval_required">Approval required (recommended)</option>
              <option value="auto_approve">Auto-approve trusted providers</option>
            </select>
          </label>
          <div className="billing-strip">
            <article className="billing-card">
              <span>Pending vendor requests</span>
              <strong>{pendingVendorCount}</strong>
            </article>
            <article className="billing-card">
              <span>Active vendor partners</span>
              <strong>{activeVendorCount}</strong>
            </article>
            <article className="billing-card">
              <span>Subcontractor mode</span>
              <strong>
                {profileSettings.vendors.requestPolicy === 'approval_required'
                  ? 'Manual approval'
                  : 'Auto approval'}
              </strong>
            </article>
          </div>
          <p className="section-note">
            Next step recommendation: allow providers to send vendor requests to other providers,
            then permit job subcontracting only after explicit acceptance and KYC checks.
          </p>
        </section>

        <button className="primary-cta" type="submit">
          {profileSaving ? 'Saving...' : profileLoading ? 'Syncing...' : 'Save my profile'}
        </button>
      </form>
    </section>
  );
}
