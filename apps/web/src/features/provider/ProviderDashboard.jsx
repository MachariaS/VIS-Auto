import { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  initialProviderService,
  staticNotifications,
} from '../../shared/constants';
import { mergeUniqueList, request } from '../../shared/helpers';
import { BellIcon, CloseIcon, MenuIcon } from '../../shared/icons';
import NotificationsTray from '../shared/NotificationsTray';
import ProfilePanel from '../shared/ProfilePanel';
import SettingsPanel from '../shared/SettingsPanel';
import SectionErrorBoundary from '../shared/runtime/SectionErrorBoundary';
import SectionState from '../shared/runtime/SectionState';
import useProviderDashboardState from './hooks/useProviderDashboardState';
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
    addToast,
    sessionReady,
    profileSettings,
    setProfileSettings,
    signOut,
  } = useApp();

  const {
    providerServices,
    setProviderServices,
    requests,
    setRequests,
    providerServiceForm,
    setProviderServiceForm,
    resetProviderServiceForm,
    editingProviderServiceId,
    setEditingProviderServiceId,
    showProviderServiceComposer,
    setShowProviderServiceComposer,
    orderHistoryTab,
    setOrderHistoryTab,
    orderActionMenuId,
    setOrderActionMenuId,
    selectedOrderId,
    setSelectedOrderId,
    ordersFromDate,
    setOrdersFromDate,
    ordersToDate,
    setOrdersToDate,
    updatingOrderId,
    setUpdatingOrderId,
    brandLogoError,
    setBrandLogoError,
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
  } = useProviderDashboardState();

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
    vendorError,
    vendorLoading,
    vendorStats,
  } = useVendorNetwork({ token, user, addToast });

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
  }, [sessionReady, token]);

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

  useEffect(() => {
    if (!showMobileSidebar) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showMobileSidebar]);

  async function loadProviderDashboard(accessToken) {
    setSectionLoading({
      overview: true,
      services: true,
      vendors: true,
      orders: true,
    });
    setSectionErrors({
      overview: '',
      services: '',
      vendors: '',
      orders: '',
    });

    const [serviceResult, requestResult, vendorResult] = await Promise.allSettled([
      request('/provider-services', undefined, 'GET', accessToken),
      request('/roadside-requests/provider', undefined, 'GET', accessToken),
      loadVendorData(accessToken),
    ]);

    if (serviceResult.status === 'fulfilled') {
      setProviderServices(serviceResult.value);
      patchSectionErrors({ services: '' });
    } else {
      patchSectionErrors({
        overview: serviceResult.reason?.message || 'Unable to load provider services.',
        services: serviceResult.reason?.message || 'Unable to load provider services.',
      });
    }

    if (requestResult.status === 'fulfilled') {
      setRequests(Array.isArray(requestResult.value) ? requestResult.value : []);
      patchSectionErrors({ orders: '' });
    } else {
      patchSectionErrors({
        overview: requestResult.reason?.message || 'Unable to load provider requests.',
        orders: requestResult.reason?.message || 'Unable to load provider requests.',
      });
    }

    if (vendorResult.status === 'rejected') {
      patchSectionErrors({
        vendors: vendorResult.reason?.message || 'Unable to load vendor data.',
      });
    }

    setSectionLoading({
      overview: false,
      services: false,
      vendors: false,
      orders: false,
    });
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

      setProviderServiceForm((current) => ({
        ...initialProviderService,
        serviceCode: current.serviceCode,
      }));
      setEditingProviderServiceId('');
      setShowProviderServiceComposer(false);
      setDashboardTab('services');
      addToast({
        type: 'success',
        title: 'Service saved',
        message: editingProviderServiceId
          ? `Service updated: ${savedService.serviceName}`
          : `Service published: ${savedService.serviceName}`,
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Service save failed',
        message: error.message || 'Unable to save provider service.',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteProviderService(serviceId) {
    try {
      await request(`/provider-services/${serviceId}`, undefined, 'DELETE', token);
      setProviderServices((current) => current.filter((s) => s.id !== serviceId));
      addToast({ type: 'success', title: 'Service removed', message: 'Service has been unpublished.' });
    } catch (error) {
      addToast({ type: 'error', title: 'Remove failed', message: error.message || 'Unable to remove service.' });
    }
  }

  async function handleOrderRowAction(actionType, orderItem) {
    setOrderActionMenuId('');
    if (actionType === 'summary') {
      setSelectedOrderId(orderItem.id);
      return;
    }
    if (actionType === 'contact') {
      addToast({
        type: 'info',
        title: 'Customer contact',
        message: orderItem.customer?.phone || orderItem.customer?.email || 'Not shared',
      });
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
      addToast({
        type: 'success',
        title: 'Request updated',
        message: `Request ${orderItem.id} moved to ${nextStatus.replaceAll('_', ' ')}.`,
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Request update failed',
        message: error.message || 'Unable to update order status.',
      });
    } finally {
      setUpdatingOrderId('');
    }
  }

  function estimateLiveEta(orderItem, position) {
    const requestLat = Number(orderItem.latitude || 0);
    const requestLng = Number(orderItem.longitude || 0);
    const latDelta = requestLat - Number(position.coords.latitude || 0);
    const lngDelta = requestLng - Number(position.coords.longitude || 0);
    const approxKm = Math.sqrt(latDelta ** 2 + lngDelta ** 2) * 111;
    return Math.max(2, Math.round(approxKm * 2.2));
  }

  function handleShareProviderLocation(orderItem) {
    if (!token) return;

    if (!navigator.geolocation) {
      addToast({
        type: 'error',
        title: 'Location unavailable',
        message: 'Geolocation is not supported in this browser.',
      });
      return;
    }

    setUpdatingOrderId(orderItem.id);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await request(
            `/roadside-requests/${orderItem.id}/provider-location`,
            {
              latitude: Number(position.coords.latitude.toFixed(6)),
              longitude: Number(position.coords.longitude.toFixed(6)),
              etaMinutes: estimateLiveEta(orderItem, position),
            },
            'PATCH',
            token,
          );
          const refreshed = await request('/roadside-requests/provider', undefined, 'GET', token);
          setRequests(Array.isArray(refreshed) ? refreshed : []);
          addToast({
            type: 'success',
            title: 'Location shared',
            message: `Live provider location updated for request ${orderItem.id}.`,
          });
        } catch (error) {
          addToast({
            type: 'error',
            title: 'Location update failed',
            message: error.message || 'Unable to publish provider location.',
          });
        } finally {
          setUpdatingOrderId('');
        }
      },
      () => {
        addToast({
          type: 'error',
          title: 'Location update failed',
          message: 'Unable to capture your current location.',
        });
        setUpdatingOrderId('');
      },
      { enableHighAccuracy: true, timeout: 8000 },
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
      {showMobileSidebar ? (
        <button
          className="dashboard-drawer-scrim"
          type="button"
          aria-label="Close navigation"
          onClick={() => setShowMobileSidebar(false)}
        />
      ) : null}

      <aside className={`provider-sidebar-v2${showMobileSidebar ? ' is-mobile-open' : ''}`}>
        <div className="sidebar-mobile-head">
          <span>Provider menu</span>
          <button
            className="sidebar-close-button"
            type="button"
            aria-label="Close navigation"
            onClick={() => setShowMobileSidebar(false)}
          >
            <CloseIcon />
          </button>
        </div>
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
                if (!item.disabled) {
                  setDashboardTab(item.id);
                  setShowMobileSidebar(false);
                }
              }}
            >
              {item.label}
            </button>
          ))}
          <button
            className="provider-nav-idle-v2"
            type="button"
            onClick={() => {
              setShowMobileSidebar(false);
              signOut();
            }}
          >
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
          <div className="provider-topbar-shell-v2">
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

            <button
              className="provider-mobile-brand-v2"
              type="button"
              onClick={() => {
                setDashboardTab('overview');
                setShowAccountMenu(false);
                setShowNotifications(false);
              }}
            >
              <span>{providerBrandInitials}</span>
              <strong>{providerBrandName}</strong>
            </button>
          </div>

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
            <SectionErrorBoundary
              resetKey={`provider-overview-${sectionErrors.overview}-${requests.length}-${providerServices.length}`}
              onError={handleSectionBoundaryError('overview')}
              onRetry={() => loadProviderDashboard(token)}
            >
              <SectionState
                loading={sectionLoading.overview}
                error={sectionErrors.overview}
                onRetry={() => loadProviderDashboard(token)}
                skeleton="grid"
                title="Unable to load dashboard overview."
              >
                <ProviderOverview
                  user={user}
                  requests={requests}
                  providerServices={providerServices}
                  onAddService={() => {
                    setDashboardTab('services');
                    setEditingProviderServiceId('');
                    resetProviderServiceForm();
                    setShowProviderServiceComposer(true);
                  }}
                  onManageServices={() => setDashboardTab('services')}
                />
              </SectionState>
            </SectionErrorBoundary>
          ) : null}

          {dashboardTab === 'services' ? (
            <SectionErrorBoundary
              resetKey={`provider-services-${sectionErrors.services}-${providerServices.length}`}
              onError={handleSectionBoundaryError('services')}
              onRetry={() => loadProviderDashboard(token)}
            >
              <SectionState
                loading={sectionLoading.services}
                error={sectionErrors.services}
                onRetry={() => loadProviderDashboard(token)}
                skeleton="form"
                title="Unable to load provider services."
              >
                <ServicesPanel
                  providerServices={providerServices}
                  providerServiceForm={providerServiceForm}
                  setProviderServiceForm={setProviderServiceForm}
                  editingProviderServiceId={editingProviderServiceId}
                  setEditingProviderServiceId={setEditingProviderServiceId}
                  showProviderServiceComposer={showProviderServiceComposer}
                  setShowProviderServiceComposer={setShowProviderServiceComposer}
                  onSubmit={handleAddProviderService}
                  onDelete={handleDeleteProviderService}
                  loading={loading}
                  message={message}
                />
              </SectionState>
            </SectionErrorBoundary>
          ) : null}

          {dashboardTab === 'vendors' ? (
            <SectionErrorBoundary
              resetKey={`provider-vendors-${sectionErrors.vendors || vendorError}-${pendingVendorRequests.length}-${activeVendorPartners.length}`}
              onError={handleSectionBoundaryError('vendors')}
              onRetry={() => loadVendorData(token)}
            >
              <SectionState
                loading={sectionLoading.vendors || vendorLoading}
                error={sectionErrors.vendors || vendorError}
                onRetry={() => loadVendorData(token)}
                skeleton="grid"
                title="Unable to load vendor management."
              >
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
              </SectionState>
            </SectionErrorBoundary>
          ) : null}

          {dashboardTab === 'orders' ? (
            <SectionErrorBoundary
              resetKey={`provider-orders-${sectionErrors.orders}-${requests.length}`}
              onError={handleSectionBoundaryError('orders')}
              onRetry={() => loadProviderDashboard(token)}
            >
              <SectionState
                loading={sectionLoading.orders}
                error={sectionErrors.orders}
                onRetry={() => loadProviderDashboard(token)}
                skeleton="grid"
                title="Unable to load provider orders."
              >
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
                  onNotify={(nextMessage) =>
                    addToast({
                      type: 'info',
                      title: 'Request action',
                      message: nextMessage,
                    })
                  }
                  onShareLocation={handleShareProviderLocation}
                />
              </SectionState>
            </SectionErrorBoundary>
          ) : null}

          {dashboardTab === 'ratings' ? <RatingsPanel /> : null}
          {dashboardTab === 'profile' ? <ProfilePanel vendorStats={vendorStats} /> : null}
          {dashboardTab === 'settings' ? <SettingsPanel /> : null}
        </div>
      </div>
    </section>
  );
}
