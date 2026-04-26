import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { formatCurrency, request } from '../../../shared/helpers';
import {
  BellIcon,
  CloseIcon,
  LogoutIcon,
  MenuIcon,
  MoonIcon,
  SunIcon,
  UserIcon,
} from '../../../shared/icons';
import NotificationsTray from '../../shared/NotificationsTray';
import CustomerProfilePanel from './CustomerProfilePanel';
import SectionErrorBoundary from '../../shared/runtime/SectionErrorBoundary';
import SectionState from '../../shared/runtime/SectionState';
import useCustomerDashboardState from './hooks/useCustomerDashboardState';
import CustomerOverview from './CustomerOverview';
import HistoryPanel from './HistoryPanel';
import RequestPanel from './RequestPanel';
import VehiclesTab from './VehiclesTab';
import ActiveJobPanel from './tracking/ActiveJobPanel';

export default function CustomerDashboard() {
  const {
    user,
    token,
    theme,
    dashboardTab,
    setDashboardTab,
    addToast,
    sessionReady,
    setStep,
    signOut,
    toggleTheme,
    openDashboard,
  } = useApp();

  const {
    vehicles,
    setVehicles,
    requests,
    setRequests,
    providerCatalog,
    setProviderCatalog,
    vehicleForm,
    setVehicleForm,
    resetVehicleForm,
    roadsideForm,
    setRoadsideForm,
    resetRoadsideForm,
    serviceFilter,
    setServiceFilter,
    loading,
    setLoading,
    showNotifications,
    setShowNotifications,
    showAccountMenu,
    setShowAccountMenu,
    showMobileSidebar,
    setShowMobileSidebar,
    sectionLoading,
    setSectionLoading,
    sectionErrors,
    setSectionErrors,
    patchSectionErrors,
  } = useCustomerDashboardState();

  const [activeRequest, setActiveRequest] = useState(null);

  const requestStats = useMemo(
    () => ({
      active: requests.filter((item) => item.status !== 'completed').length,
      vehicles: vehicles.length,
    }),
    [requests, vehicles.length],
  );

  const [unreadCount, setUnreadCount] = useState(0);
  const notificationCount = unreadCount;

  useEffect(() => {
    if (!token) return;
    const fetchCount = () =>
      request('/notifications/unread-count', undefined, 'GET', token)
        .then((d) => setUnreadCount(d?.count ?? 0))
        .catch(() => {});
    fetchCount();
    const interval = setInterval(fetchCount, 60_000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    if (!sessionReady || !token) return;
    void loadCustomerDashboard(token);
  }, [sessionReady, token]);

  useEffect(() => {
    if (vehicles.length === 0) {
      if (roadsideForm.vehicleId) {
        setRoadsideForm((current) => ({ ...current, vehicleId: '' }));
      }
      return;
    }
    const validVehicle = vehicles.find((v) => v.id === roadsideForm.vehicleId);
    if (!validVehicle) {
      setRoadsideForm((current) => ({ ...current, vehicleId: vehicles[0].id }));
    }
  }, [vehicles]);

  useEffect(() => {
    const filtered = providerCatalog.filter((item) => item.serviceCode === serviceFilter);
    if (filtered.length === 0) {
      if (roadsideForm.providerServiceId) {
        setRoadsideForm((current) => ({ ...current, providerServiceId: '' }));
      }
      return;
    }
    const current = filtered.find((item) => item.id === roadsideForm.providerServiceId);
    if (!current) {
      setRoadsideForm((existing) => ({ ...existing, providerServiceId: filtered[0].id }));
    }
  }, [providerCatalog, roadsideForm.providerServiceId, serviceFilter]);

  useEffect(() => {
    function handlePointerDown(event) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (showAccountMenu && !target.closest('.account-menu-wrap')) {
        setShowAccountMenu(false);
      }
      if (showNotifications && !target.closest('.notification-button') && !target.closest('.floating-panel')) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [showAccountMenu, showNotifications]);

  useEffect(() => {
    if (!showMobileSidebar) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showMobileSidebar]);

  async function loadCustomerDashboard(accessToken) {
    setSectionLoading({
      overview: true,
      request: true,
      vehicles: true,
      history: true,
    });
    setSectionErrors({
      overview: '',
      request: '',
      vehicles: '',
      history: '',
    });

    const [vehicleResult, requestResult, catalogResult] = await Promise.allSettled([
      request('/vehicles', undefined, 'GET', accessToken),
      request('/roadside-requests', undefined, 'GET', accessToken),
      request('/provider-services/catalog', undefined, 'GET', accessToken),
    ]);

    if (vehicleResult.status === 'fulfilled') {
      const vehicleData = Array.isArray(vehicleResult.value) ? vehicleResult.value : [];
      setVehicles(vehicleData);

      if (vehicleData.length > 0) {
        setRoadsideForm((current) => ({
          ...current,
          vehicleId: current.vehicleId || vehicleData[0].id,
        }));
      }
    } else {
      patchSectionErrors({
        overview: vehicleResult.reason?.message || 'Unable to load vehicles.',
        request: vehicleResult.reason?.message || 'Unable to load vehicles.',
        vehicles: vehicleResult.reason?.message || 'Unable to load vehicles.',
      });
    }

    if (requestResult.status === 'fulfilled') {
      setRequests(Array.isArray(requestResult.value) ? requestResult.value : []);
    } else {
      patchSectionErrors({
        overview: requestResult.reason?.message || 'Unable to load request history.',
        history: requestResult.reason?.message || 'Unable to load request history.',
      });
    }

    if (catalogResult.status === 'fulfilled') {
      const catalogData = Array.isArray(catalogResult.value) ? catalogResult.value : [];
      setProviderCatalog(catalogData);

      if (catalogData.length > 0) {
        setServiceFilter(catalogData[0].serviceCode);
        setRoadsideForm((current) => ({
          ...current,
          providerServiceId: current.providerServiceId || catalogData[0].id,
        }));
      }
    } else {
      patchSectionErrors({
        overview: catalogResult.reason?.message || 'Unable to load provider catalog.',
        request: catalogResult.reason?.message || 'Unable to load provider catalog.',
      });
    }

    setSectionLoading({
      overview: false,
      request: false,
      vehicles: false,
      history: false,
    });
  }

  async function handleAddVehicle(event) {
    event.preventDefault();
    setLoading(true);
    try {
      const newVehicle = await request('/vehicles', vehicleForm, 'POST', token);
      setVehicles((current) => [...current, newVehicle]);
      resetVehicleForm();
      setRoadsideForm((current) => ({ ...current, vehicleId: newVehicle.id }));
      setDashboardTab('vehicles');
      addToast({
        type: 'success',
        title: 'Vehicle saved',
        message: `Vehicle saved: ${newVehicle.nickname}`,
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Vehicle save failed',
        message: error.message || 'Unable to save vehicle.',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitRoadsideRequest(event) {
    event.preventDefault();
    setLoading(true);

    const selectedProviderService = providerCatalog.find(
      (item) => item.id === roadsideForm.providerServiceId,
    );
    const selectedFuelLitres =
      roadsideForm.fuelLitres === 'custom'
        ? Number(roadsideForm.customFuelLitres || 0)
        : Number(roadsideForm.fuelLitres || 0);

    try {
      const payload = {
        vehicleId: roadsideForm.vehicleId,
        providerServiceId: roadsideForm.providerServiceId,
        distanceKm: Number(roadsideForm.distanceKm),
        latitude: Number(roadsideForm.latitude),
        longitude: Number(roadsideForm.longitude),
        address: roadsideForm.address,
        landmark: roadsideForm.landmark,
        notes: roadsideForm.notes,
        fuelLitres:
          selectedProviderService?.serviceCode === 'fuel_delivery' ? selectedFuelLitres : undefined,
        fuelType:
          selectedProviderService?.serviceCode === 'fuel_delivery'
            ? roadsideForm.fuelType
            : undefined,
        gasolineGrade:
          selectedProviderService?.serviceCode === 'fuel_delivery' &&
          roadsideForm.fuelType === 'gasoline'
            ? roadsideForm.gasolineGrade
            : undefined,
      };

      const newRequest = await request('/roadside-requests', payload, 'POST', token);
      setRequests((current) => [newRequest, ...current]);
      resetRoadsideForm();
      setActiveRequest(newRequest);
      setDashboardTab('active-job');
      addToast({
        type: 'success',
        title: 'Request created',
        message: `Estimated total ${formatCurrency(newRequest.estimatedPriceKsh)}.`,
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Request creation failed',
        message: error.message || 'Unable to submit roadside request.',
      });
    } finally {
      setLoading(false);
    }
  }

  function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      addToast({ type: 'error', title: 'Location unavailable', message: 'Geolocation is not supported in this browser.' });
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        let address = `${lat}, ${lng}`;
        let landmark = '';
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
          );
          const data = await res.json();
          if (data?.display_name) {
            const parts = data.display_name.split(',').slice(0, 4).join(',').trim();
            address = parts;
            landmark =
              data.address?.amenity ||
              data.address?.building ||
              data.address?.shop ||
              data.address?.road ||
              '';
          }
        } catch { /* use coordinate fallback */ }

        setRoadsideForm((current) => ({ ...current, latitude: lat, longitude: lng, address, landmark }));
        addToast({ type: 'success', title: 'Location captured', message: address });
        setLoading(false);
      },
      () => {
        addToast({ type: 'error', title: 'Location failed', message: 'Unable to capture location. Please type your address.' });
        setLoading(false);
      },
    );
  }

  function handleSectionBoundaryError(sectionKey) {
    return () => {
      setSectionErrors((current) => ({
        ...current,
        [sectionKey]: 'This section crashed while rendering.',
      }));
      addToast({
        type: 'error',
        title: 'Section failed',
        message: `The ${sectionKey} section encountered an unexpected error.`,
      });
    };
  }

  const topbarLabel = useMemo(() => ({
    overview: 'Driver overview',
    request: 'Request roadside help',
    vehicles: 'Vehicle profiles',
    history: 'Request history',
    profile: 'Profile and settings',
  }[dashboardTab] || 'Driver dashboard'), [dashboardTab]);

  return (
    <section className="dashboard-shell">
      {showMobileSidebar ? (
        <button
          className="dashboard-drawer-scrim"
          type="button"
          aria-label="Close navigation"
          onClick={() => setShowMobileSidebar(false)}
        />
      ) : null}

      <aside className={`dashboard-sidebar${showMobileSidebar ? ' is-mobile-open' : ''}`}>
        <div className="sidebar-mobile-head">
          <span>Customer menu</span>
          <button
            className="sidebar-close-button"
            type="button"
            aria-label="Close navigation"
            onClick={() => setShowMobileSidebar(false)}
          >
            <CloseIcon />
          </button>
        </div>
        <div className="sidebar-head">
          <p className="eyebrow">Customer</p>
          <h2>VIS Garage</h2>
          <span>{user?.name}</span>
        </div>
        <nav className="sidebar-nav">
          {[
            ['overview', 'Overview'],
            ['request', 'Request'],
            ['vehicles', 'Vehicles'],
            ['history', 'History'],
            ['profile', 'Profile'],
          ].map(([id, label]) => (
            <button
              key={id}
              className={dashboardTab === id ? 'nav-active' : 'nav-idle'}
              type="button"
              onClick={() => {
                setDashboardTab(id);
                setShowMobileSidebar(false);
              }}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-metrics">
          <div className="metric-card">
            <span>Active</span>
            <strong>{requestStats.active}</strong>
          </div>
          <div className="metric-card">
            <span>Vehicles</span>
            <strong>{requestStats.vehicles}</strong>
          </div>
        </div>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="topbar-brand">
            <button
              className="dashboard-menu-button"
              type="button"
              aria-label="Open navigation"
              onClick={() => {
                setShowAccountMenu(false);
                setShowNotifications(false);
                setShowMobileSidebar(true);
              }}
            >
              <MenuIcon />
            </button>
            <button className="brand-inline" type="button" onClick={() => setStep('entry')}>
              VIS
            </button>
            <div className="topbar-copy">
              <strong>{topbarLabel}</strong>
              <span>Driver workspace</span>
            </div>
          </div>

          <div className="topbar-actions">
            <button
              className="icon-button"
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
            <button
              className="icon-button notification-button"
              type="button"
              onClick={() => {
                setShowNotifications((current) => !current);
                setShowAccountMenu(false);
              }}
              aria-label="Notifications"
            >
              <BellIcon />
              <span className="notification-count">{notificationCount}</span>
            </button>
            <div className="account-menu-wrap">
              <button
                className="account-button"
                type="button"
                onClick={() => {
                  setShowAccountMenu((current) => !current);
                  setShowNotifications(false);
                }}
              >
                <span className="avatar-badge">{(user?.name || 'U').charAt(0).toUpperCase()}</span>
                <div className="account-text">
                  <strong>{user?.name}</strong>
                  <span>Customer</span>
                </div>
              </button>
              {showAccountMenu ? (
                <div className="dropdown-menu">
                  <div className="dropdown-head">
                    <strong>{user?.name}</strong>
                    <span>{user?.email}</span>
                  </div>
                  <button type="button" onClick={() => openDashboard('overview')}>
                    <UserIcon />
                    Dashboard
                  </button>
                  <button type="button" onClick={() => openDashboard('profile')}>
                    <UserIcon />
                    Profile
                  </button>
                  <button type="button" onClick={signOut}>
                    <LogoutIcon />
                    Sign out
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        {showNotifications ? (
          <NotificationsTray
            token={token}
            onClose={() => setShowNotifications(false)}
          />
        ) : null}

        {dashboardTab === 'overview' ? (
          <SectionErrorBoundary
            resetKey={`customer-overview-${sectionErrors.overview}-${requests.length}-${vehicles.length}`}
            onError={handleSectionBoundaryError('overview')}
            onRetry={() => loadCustomerDashboard(token)}
          >
            <SectionState
              loading={sectionLoading.overview}
              error={sectionErrors.overview}
              onRetry={() => loadCustomerDashboard(token)}
              skeleton="grid"
              title="Unable to load dashboard overview."
            >
              <CustomerOverview
                requests={requests}
                vehicles={vehicles}
                onNewRequest={() => setDashboardTab('request')}
                onViewHistory={() => setDashboardTab('history')}
              />
            </SectionState>
          </SectionErrorBoundary>
        ) : null}
        {dashboardTab === 'request' ? (
          <SectionErrorBoundary
            resetKey={`customer-request-${sectionErrors.request}-${providerCatalog.length}-${vehicles.length}`}
            onError={handleSectionBoundaryError('request')}
            onRetry={() => loadCustomerDashboard(token)}
          >
            <SectionState
              loading={sectionLoading.request}
              error={sectionErrors.request}
              onRetry={() => loadCustomerDashboard(token)}
              skeleton="form"
              title="Unable to load roadside request form."
            >
              <RequestPanel
                vehicles={vehicles}
                providerCatalog={providerCatalog}
                serviceFilter={serviceFilter}
                setServiceFilter={setServiceFilter}
                roadsideForm={roadsideForm}
                setRoadsideForm={setRoadsideForm}
                onSubmit={handleSubmitRoadsideRequest}
                onUseCurrentLocation={handleUseCurrentLocation}
                loading={loading}
              />
            </SectionState>
          </SectionErrorBoundary>
        ) : null}
        {dashboardTab === 'vehicles' ? (
          <SectionErrorBoundary
            resetKey={`customer-vehicles-${sectionErrors.vehicles}-${vehicles.length}`}
            onError={handleSectionBoundaryError('vehicles')}
            onRetry={() => loadCustomerDashboard(token)}
          >
            <SectionState
              loading={sectionLoading.vehicles}
              error={sectionErrors.vehicles}
              onRetry={() => loadCustomerDashboard(token)}
              skeleton="form"
              title="Unable to load vehicles."
            >
              <VehiclesTab
                vehicles={vehicles}
                vehicleForm={vehicleForm}
                setVehicleForm={setVehicleForm}
                onSubmit={handleAddVehicle}
                loading={loading}
                token={token}
              />
            </SectionState>
          </SectionErrorBoundary>
        ) : null}
        {dashboardTab === 'history' ? (
          <SectionErrorBoundary
            resetKey={`customer-history-${sectionErrors.history}-${requests.length}`}
            onError={handleSectionBoundaryError('history')}
            onRetry={() => loadCustomerDashboard(token)}
          >
            <SectionState
              loading={sectionLoading.history}
              error={sectionErrors.history}
              onRetry={() => loadCustomerDashboard(token)}
              skeleton="grid"
              title="Unable to load request history."
            >
              <HistoryPanel requests={requests} token={token} />
            </SectionState>
          </SectionErrorBoundary>
        ) : null}
        {dashboardTab === 'active-job' && activeRequest ? (
          <ActiveJobPanel
            requestItem={activeRequest}
            token={token}
            onDone={() => {
              setActiveRequest(null);
              setDashboardTab('history');
            }}
          />
        ) : null}
        {dashboardTab === 'profile' ? <CustomerProfilePanel providerCatalog={providerCatalog} /> : null}
      </div>
    </section>
  );
}
