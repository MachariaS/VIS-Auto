import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  initialProviderService,
  staticNotifications,
} from '../../shared/constants';
import { mergeUniqueList, request } from '../../shared/helpers';
import { BellIcon } from '../../shared/icons';
import NotificationsTray from '../shared/NotificationsTray';
import ProfilePanel from '../shared/ProfilePanel';
import SettingsPanel from '../shared/SettingsPanel';
import useProviderOrders from './hooks/useProviderOrders';
import useVendorNetwork from './hooks/useVendorNetwork';
import OrdersPanel from './OrdersPanel';
import ProviderOverview from './ProviderOverview';
import RatingsPanel from './RatingsPanel';
import ServicesPanel from './ServicesPanel';
import VendorsPanel from './VendorsPanel';

const providerBrandName = 'VIS Auto';
const providerBrandLogo = '/assets/vis-auto-logo.png';
const providerBrandInitials = 'VIS';

export default function ProviderDashboard() {
  const {
    user,
    token,
    dashboardTab,
    setDashboardTab,
    message,
    setMessage,
    sessionReady,
    profileSettings,
    setProfileSettings,
    signOut,
  } = useApp();

  const [providerServices, setProviderServices] = useState([]);
  const [requests, setRequests] = useState([]);
  const [providerServiceForm, setProviderServiceForm] = useState(initialProviderService);
  const [editingProviderServiceId, setEditingProviderServiceId] = useState('');
  const [showProviderServiceComposer, setShowProviderServiceComposer] = useState(false);
  const [orderHistoryTab, setOrderHistoryTab] = useState('all');
  const [orderActionMenuId, setOrderActionMenuId] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [ordersFromDate, setOrdersFromDate] = useState('2026-04-01');
  const [ordersToDate, setOrdersToDate] = useState('2026-04-30');
  const [updatingOrderId, setUpdatingOrderId] = useState('');
  const [brandLogoError, setBrandLogoError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  const {
    activeVendorPartners,
    focusedVendorRequest,
    loadVendorData,
    pendingVendorRequests,
    acceptVendorRequest,
    rejectVendorRequest,
    selectedVendorRequestId,
    setSelectedVendorRequestId,
    vendorActionRequestId,
    vendorStats,
  } = useVendorNetwork({ token, user, setMessage });

  const vendorNotificationCount = pendingVendorRequests.length;
  const notificationCount = staticNotifications.length + vendorNotificationCount;
  const { filteredProviderOrders, orderCounts, selectedOrder } = useProviderOrders({
    requests,
    orderHistoryTab,
    ordersFromDate,
    ordersToDate,
    selectedOrderId,
  });

  useEffect(() => {
    if (!sessionReady || !token) return;
    void loadProviderDashboard(token);
  }, [loadVendorData, sessionReady, token]);

  useEffect(() => {
    if (providerServices.length === 0) return;
    const apiServiceNames = providerServices.map((item) => item.serviceName).filter(Boolean);
    setProfileSettings((current) => {
      const merged = mergeUniqueList(current.business?.offeredServices || [], apiServiceNames);
      if ((current.business?.offeredServices || []).join('||') === merged.join('||')) return current;
      return { ...current, business: { ...current.business, offeredServices: merged } };
    });
  }, [providerServices, setProfileSettings]);

  useEffect(() => {
    if (filteredProviderOrders.length === 0) {
      if (selectedOrderId) setSelectedOrderId('');
      return;
    }
    if (!filteredProviderOrders.some((requestItem) => requestItem.id === selectedOrderId)) {
      setSelectedOrderId(filteredProviderOrders[0].id);
    }
  }, [filteredProviderOrders, selectedOrderId]);

  useEffect(() => {
    function handlePointerDown(event) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (showAccountMenu && !target.closest('.account-menu-wrap')) setShowAccountMenu(false);
      if (
        showNotifications &&
        !target.closest('.notification-button') &&
        !target.closest('.floating-panel')
      ) {
        setShowNotifications(false);
      }
      if (orderActionMenuId && !target.closest('.order-action-cell-v2')) {
        setOrderActionMenuId('');
      }
    }
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [orderActionMenuId, showAccountMenu, showNotifications]);

  async function loadProviderDashboard(accessToken) {
    const [serviceData, providerRequestData] = await Promise.all([
      request('/provider-services', undefined, 'GET', accessToken),
      request('/roadside-requests/provider', undefined, 'GET', accessToken).catch(() => []),
      loadVendorData(accessToken).catch(() => null),
    ]);
    setProviderServices(serviceData);
    setRequests(Array.isArray(providerRequestData) ? providerRequestData : []);
  }

  async function handleAddProviderService(event) {
    event.preventDefault();
    setLoading(true);
    try {
      const payload = {
        serviceName: providerServiceForm.serviceName,
        serviceCode: providerServiceForm.serviceCode,
        basePriceKsh: Number(providerServiceForm.basePriceKsh),
        pricePerKmKsh: Number(providerServiceForm.pricePerKmKsh),
        description: providerServiceForm.description,
        fuelPricing:
          providerServiceForm.serviceCode === 'fuel_delivery'
            ? {
                gasoline: {
                  regular: providerServiceForm.gasolineRegularPrice
                    ? Number(providerServiceForm.gasolineRegularPrice)
                    : undefined,
                  vpower: providerServiceForm.gasolineVPowerPrice
                    ? Number(providerServiceForm.gasolineVPowerPrice)
                    : undefined,
                },
                diesel: {
                  standard: providerServiceForm.dieselPrice
                    ? Number(providerServiceForm.dieselPrice)
                    : undefined,
                },
              }
            : undefined,
      };

      const savedService = editingProviderServiceId
        ? await request(`/provider-services/${editingProviderServiceId}`, payload, 'PUT', token)
        : await request('/provider-services', payload, 'POST', token);

      setProviderServices((current) =>
        editingProviderServiceId
          ? current.map((s) => (s.id === editingProviderServiceId ? savedService : s))
          : [savedService, ...current],
      );

      setProviderServiceForm({
        ...initialProviderService,
        serviceCode: providerServiceForm.serviceCode,
      });
      setEditingProviderServiceId('');
      setShowProviderServiceComposer(false);
      setDashboardTab('services');
      setMessage(
        editingProviderServiceId
          ? `Service updated: ${savedService.serviceName}`
          : `Service published: ${savedService.serviceName}`,
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleOrderRowAction(actionType, orderItem) {
    setOrderActionMenuId('');
    if (actionType === 'summary') {
      setSelectedOrderId(orderItem.id);
      return;
    }
    if (actionType === 'contact') {
      setMessage(
        `Contact details: ${orderItem.customer?.phone || orderItem.customer?.email || 'Not shared'}.`,
      );
      return;
    }
    const nextStatusByAction = {
      assign: 'provider_assigned',
      start: 'in_progress',
      complete: 'completed',
      cancel: 'cancelled',
    };
    const nextStatus = nextStatusByAction[actionType];
    if (!nextStatus || !token) return;
    setUpdatingOrderId(orderItem.id);
    try {
      await request(
        `/roadside-requests/${orderItem.id}/status`,
        { status: nextStatus },
        'PATCH',
        token,
      );
      const refreshed = await request('/roadside-requests/provider', undefined, 'GET', token);
      setRequests(Array.isArray(refreshed) ? refreshed : []);
      setMessage(`Request ${orderItem.id} moved to ${nextStatus.replaceAll('_', ' ')}.`);
    } catch (error) {
      setMessage(error.message || 'Unable to update order status.');
    } finally {
      setUpdatingOrderId('');
    }
  }

  function openVendorRequestReview(requestId) {
    setDashboardTab('vendors');
    setSelectedVendorRequestId(requestId);
    setShowNotifications(false);
    setShowAccountMenu(false);
  }

  const sidebarItems = [
    { id: 'overview', label: 'Dashboard' },
    { id: 'services', label: 'Manage Services' },
    { id: 'vendors', label: 'Manage Vendors' },
    { id: 'orders', label: 'Order History' },
    { id: 'ratings', label: 'Ratings & Reviews' },
    { id: 'overview', label: 'Heat Map', disabled: true },
    { id: 'offers', label: 'Offers', disabled: true },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <section className="provider-shell-v2">
      <aside className="provider-sidebar-v2">
        <button
          className="provider-brand-v2 provider-brand-home-v2"
          type="button"
          onClick={() => {
            setShowAccountMenu(false);
            setShowNotifications(false);
          }}
        >
          <div className="provider-brand-logo-v2">
            {!brandLogoError ? (
              <img
                src={providerBrandLogo}
                alt={`${providerBrandName} logo`}
                onError={() => setBrandLogoError(true)}
              />
            ) : (
              <span>{providerBrandInitials || 'VIS'}</span>
            )}
          </div>
          <div>
            <strong>{providerBrandName}</strong>
          </div>
        </button>

        <nav className="provider-nav-v2">
          {sidebarItems.map((item) => (
            <button
              key={`${item.id || 'na'}-${item.label}`}
              className={
                item.disabled
                  ? 'provider-nav-disabled-v2'
                  : dashboardTab === item.id
                    ? 'provider-nav-active-v2'
                    : 'provider-nav-idle-v2'
              }
              type="button"
              onClick={() => {
                if (!item.disabled) setDashboardTab(item.id);
              }}
            >
              {item.label}
            </button>
          ))}
          <button className="provider-nav-idle-v2" type="button" onClick={signOut}>
            Logout
          </button>
        </nav>

        <div className="provider-upgrade-v2">
          <strong>Upgrade Membership</strong>
          <p>Upgrade your membership in $500 for next 5 years.</p>
          <button className="secondary-cta" type="button">
            Upgrade now
          </button>
        </div>
      </aside>

      <div className="provider-main-v2">
        <header className="provider-topbar-v2">
          <div className="provider-topbar-search-v2">
            <input
              type="search"
              placeholder="Search projects here..."
              aria-label="Search projects"
            />
          </div>

          <div className="provider-topbar-actions-v2">
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
                className="provider-profile-chip-v2"
                type="button"
                onClick={() => {
                  setShowAccountMenu((current) => !current);
                  setShowNotifications(false);
                }}
              >
                <span className="avatar-badge">{(user?.name || 'U').charAt(0).toUpperCase()}</span>
                <span>{user?.name || 'Provider'}</span>
              </button>
              {showAccountMenu ? (
                <div className="dropdown-menu">
                  <div className="dropdown-head">
                    <strong>{user?.name}</strong>
                    <span>{user?.email}</span>
                  </div>
                  <button type="button" onClick={() => setDashboardTab('overview')}>
                    Dashboard
                  </button>
                  <button type="button" onClick={() => setDashboardTab('profile')}>
                    Profile
                  </button>
                  <button type="button" onClick={signOut}>
                    Sign out
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <div className="provider-content-v2">
          {showNotifications ? (
            <NotificationsTray
              pendingVendorRequests={pendingVendorRequests}
              onOpenVendorRequest={openVendorRequestReview}
            />
          ) : null}

          {dashboardTab === 'overview' ? (
            <ProviderOverview
              user={user}
              requests={requests}
              providerServices={providerServices}
              onAddService={() => {
                setDashboardTab('services');
                setEditingProviderServiceId('');
                setProviderServiceForm(initialProviderService);
                setShowProviderServiceComposer(true);
              }}
              onManageServices={() => setDashboardTab('services')}
            />
          ) : null}

          {dashboardTab === 'services' ? (
            <ServicesPanel
              providerServices={providerServices}
              providerServiceForm={providerServiceForm}
              setProviderServiceForm={setProviderServiceForm}
              editingProviderServiceId={editingProviderServiceId}
              setEditingProviderServiceId={setEditingProviderServiceId}
              showProviderServiceComposer={showProviderServiceComposer}
              setShowProviderServiceComposer={setShowProviderServiceComposer}
              onSubmit={handleAddProviderService}
              loading={loading}
              message={message}
            />
          ) : null}

          {dashboardTab === 'vendors' ? (
            <VendorsPanel
              activeVendorPartners={activeVendorPartners}
              pendingVendorRequests={pendingVendorRequests}
              vendorStats={vendorStats}
              focusedVendorRequest={focusedVendorRequest}
              selectedVendorRequestId={selectedVendorRequestId}
              setSelectedVendorRequestId={setSelectedVendorRequestId}
              vendorActionRequestId={vendorActionRequestId}
              onAccept={acceptVendorRequest}
              onReject={rejectVendorRequest}
              onOpenNotifications={() => {
                setShowNotifications(true);
                setShowAccountMenu(false);
              }}
            />
          ) : null}

          {dashboardTab === 'orders' ? (
            <OrdersPanel
              providerOrders={requests}
              filteredProviderOrders={filteredProviderOrders}
              orderCounts={orderCounts}
              selectedOrder={selectedOrder}
              orderHistoryTab={orderHistoryTab}
              setOrderHistoryTab={setOrderHistoryTab}
              ordersFromDate={ordersFromDate}
              setOrdersFromDate={setOrdersFromDate}
              ordersToDate={ordersToDate}
              setOrdersToDate={setOrdersToDate}
              orderActionMenuId={orderActionMenuId}
              setOrderActionMenuId={setOrderActionMenuId}
              updatingOrderId={updatingOrderId}
              onRowAction={handleOrderRowAction}
              setMessage={setMessage}
            />
          ) : null}

          {dashboardTab === 'ratings' ? <RatingsPanel /> : null}
          {dashboardTab === 'profile' ? <ProfilePanel vendorStats={vendorStats} /> : null}
          {dashboardTab === 'settings' ? <SettingsPanel /> : null}
        </div>
      </div>
    </section>
  );
}
