import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { initialRoadsideRequest, initialVehicle } from '../../shared/constants';
import { formatCurrency, request } from '../../shared/helpers';
import { BellIcon, LogoutIcon, MoonIcon, SunIcon, UserIcon } from '../../shared/icons';
import { staticNotifications } from '../../shared/constants';
import NotificationsTray from '../shared/NotificationsTray';
import ProfilePanel from '../shared/ProfilePanel';
import CustomerOverview from './CustomerOverview';
import HistoryPanel from './HistoryPanel';
import RequestPanel from './RequestPanel';
import VehiclePanel from './VehiclePanel';

export default function CustomerDashboard() {
  const {
    user,
    token,
    theme,
    dashboardTab,
    setDashboardTab,
    message,
    setMessage,
    sessionReady,
    signOut,
    toggleTheme,
    openDashboard,
  } = useApp();

  const [vehicles, setVehicles] = useState([]);
  const [requests, setRequests] = useState([]);
  const [providerCatalog, setProviderCatalog] = useState([]);
  const [vehicleForm, setVehicleForm] = useState(initialVehicle);
  const [roadsideForm, setRoadsideForm] = useState(initialRoadsideRequest);
  const [serviceFilter, setServiceFilter] = useState('battery_jump');
  const [loading, setLoading] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  const requestStats = useMemo(
    () => ({
      active: requests.filter((item) => item.status !== 'completed').length,
      vehicles: vehicles.length,
    }),
    [requests, vehicles.length],
  );

  const notificationCount = staticNotifications.length;

  useEffect(() => {
    if (!sessionReady || !token) return;
    void loadCustomerDashboard(token);
  }, [sessionReady, token]);

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

  async function loadCustomerDashboard(accessToken) {
    const [vehicleData, requestData, catalogData] = await Promise.all([
      request('/vehicles', undefined, 'GET', accessToken),
      request('/roadside-requests', undefined, 'GET', accessToken),
      request('/provider-services/catalog', undefined, 'GET', accessToken),
    ]);

    setVehicles(vehicleData);
    setRequests(requestData);
    setProviderCatalog(catalogData);

    if (vehicleData.length > 0) {
      setRoadsideForm((current) => ({
        ...current,
        vehicleId: current.vehicleId || vehicleData[0].id,
      }));
    }

    if (catalogData.length > 0) {
      setServiceFilter(catalogData[0].serviceCode);
      setRoadsideForm((current) => ({
        ...current,
        providerServiceId: current.providerServiceId || catalogData[0].id,
      }));
    }
  }

  async function handleAddVehicle(event) {
    event.preventDefault();
    setLoading(true);
    try {
      const newVehicle = await request('/vehicles', vehicleForm, 'POST', token);
      setVehicles((current) => [...current, newVehicle]);
      setVehicleForm(initialVehicle);
      setRoadsideForm((current) => ({ ...current, vehicleId: newVehicle.id }));
      setDashboardTab('vehicles');
      setMessage(`Vehicle saved: ${newVehicle.nickname}`);
    } catch (error) {
      setMessage(error.message);
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
      setRoadsideForm((current) => ({
        ...initialRoadsideRequest,
        vehicleId: current.vehicleId,
        providerServiceId: current.providerServiceId,
      }));
      setDashboardTab('history');
      setMessage(`Request created. Estimated total ${formatCurrency(newRequest.estimatedPriceKsh)}.`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      setMessage('Geolocation is not supported in this browser.');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setRoadsideForm((current) => ({
          ...current,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }));
        setMessage('Location captured.');
        setLoading(false);
      },
      () => {
        setMessage('Unable to capture location. Enter coordinates manually.');
        setLoading(false);
      },
    );
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
      <aside className="dashboard-sidebar">
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
              onClick={() => setDashboardTab(id)}
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
            <button className="brand-inline" type="button" onClick={() => openDashboard()}>
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
            pendingVendorRequests={[]}
            onOpenVendorRequest={() => {}}
          />
        ) : null}

        {dashboardTab === 'overview' ? (
          <CustomerOverview onNewRequest={() => setDashboardTab('request')} />
        ) : null}
        {dashboardTab === 'request' ? (
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
        ) : null}
        {dashboardTab === 'vehicles' ? (
          <VehiclePanel
            vehicleForm={vehicleForm}
            setVehicleForm={setVehicleForm}
            onSubmit={handleAddVehicle}
            loading={loading}
          />
        ) : null}
        {dashboardTab === 'history' ? <HistoryPanel requests={requests} /> : null}
        {dashboardTab === 'profile' ? <ProfilePanel /> : null}
      </div>
    </section>
  );
}
