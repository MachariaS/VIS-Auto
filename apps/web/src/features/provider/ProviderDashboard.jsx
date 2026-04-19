import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  initialProviderService,
  staticNotifications,
} from '../../shared/constants';
import { mergeUniqueList, request, toVendorId } from '../../shared/helpers';
import { BellIcon } from '../../shared/icons';
import NotificationsTray from '../shared/NotificationsTray';
import ProfilePanel from '../shared/ProfilePanel';
import SettingsPanel from '../shared/SettingsPanel';
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
  const [providerCatalog, setProviderCatalog] = useState([]);
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
  const [selectedVendorRequestId, setSelectedVendorRequestId] = useState('');
  const [brandLogoError, setBrandLogoError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  const activeVendorPartners = profileSettings.vendors?.activePartners || [];
  const pendingVendorRequests = profileSettings.vendors?.pendingRequests || [];
  const rejectedVendorRequests = profileSettings.vendors?.rejectedRequests || [];

  const vendorNotificationCount = pendingVendorRequests.length;
  const notificationCount = staticNotifications.length + vendorNotificationCount;

  const focusedVendorRequest =
    pendingVendorRequests.find((r) => r.id === selectedVendorRequestId) ||
    pendingVendorRequests[0] ||
    null;

  const vendorStats = useMemo(
    () => ({
      active: activeVendorPartners.length,
      pending: pendingVendorRequests.length,
      rejected: rejectedVendorRequests.length,
    }),
    [activeVendorPartners.length, pendingVendorRequests.length, rejectedVendorRequests.length],
  );

  const providerOrders = useMemo(() => {
    return requests.map((requestItem, index) => {
      const mappedStatus =
        requestItem.status === 'completed'
          ? 'delivered'
          : requestItem.status === 'cancelled'
            ? 'cancelled'
            : requestItem.status === 'searching'
              ? 'processing'
              : requestItem.status === 'provider_assigned' || requestItem.status === 'in_progress'
                ? 'processing'
                : 'collected';

      const fuelSurcharge = Number(requestItem.fuelDetails?.fuelCostKsh || 0);

      return {
        id: `#${String(index + 2632)}`,
        reference: requestItem.id,
        sourceStatus: requestItem.status,
        customer: {
          name:
            requestItem.customer?.name ||
            `Customer ${String(requestItem.userId || '').slice(0, 6) || index + 1}`,
          email:
            requestItem.customer?.email ||
            `${String(requestItem.userId || 'customer').slice(0, 8)}@visauto.app`,
          phone: requestItem.customer?.phone || 'Not shared',
        },
        paymentMethod: requestItem.fuelDetails ? 'Paid' : 'Cash',
        etaMinutes: Number(requestItem.etaMinutes || 0),
        orderType: requestItem.fuelDetails ? 'Delivery' : 'Collection',
        status: mappedStatus,
        totalAmountKsh: Number(requestItem.estimatedPriceKsh || 0),
        createdAt: requestItem.createdAt,
        vendorName: requestItem.providerName || 'Integrated provider',
        service: requestItem.issueType || 'Roadside Service',
        serviceCode: requestItem.providerServiceId || 'service',
        vehicle: requestItem.vehicle || null,
        delivery: {
          addressLine: requestItem.address || 'N/A',
          building: requestItem.landmark || 'N/A',
          street: requestItem.address || 'N/A',
          town: 'Nairobi',
          postcode: '00100',
        },
        items: [
          {
            id: `${requestItem.id}-service`,
            title: requestItem.issueType || 'Roadside service',
            subtitle: requestItem.providerName || 'Integrated provider',
            quantity: 1,
            price: Math.max(Number(requestItem.estimatedPriceKsh || 0) - fuelSurcharge, 0),
          },
          ...(fuelSurcharge > 0
            ? [
                {
                  id: `${requestItem.id}-fuel`,
                  title: 'Fuel surcharge',
                  subtitle: `${requestItem.fuelDetails?.litres || 0}L ${requestItem.fuelDetails?.fuelType || ''}`,
                  quantity: 1,
                  price: fuelSurcharge,
                },
              ]
            : []),
        ],
      };
    });
  }, [requests]);

  const filteredProviderOrders = useMemo(() => {
    const fromDate = ordersFromDate ? new Date(`${ordersFromDate}T00:00:00`) : null;
    const toDate = ordersToDate ? new Date(`${ordersToDate}T23:59:59`) : null;

    return providerOrders.filter((orderItem) => {
      const createdAt = new Date(orderItem.createdAt);
      if (fromDate && createdAt < fromDate) return false;
      if (toDate && createdAt > toDate) return false;
      if (orderHistoryTab === 'completed') {
        return orderItem.status === 'delivered' || orderItem.status === 'collected';
      }
      if (orderHistoryTab === 'cancelled') return orderItem.status === 'cancelled';
      if (orderHistoryTab === 'summary') return orderItem.status !== 'cancelled';
      return true;
    });
  }, [orderHistoryTab, ordersFromDate, ordersToDate, providerOrders]);

  const selectedOrder =
    filteredProviderOrders.find((o) => o.reference === selectedOrderId) ||
    filteredProviderOrders[0] ||
    null;

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
    if (user?.accountType !== 'provider' || providerCatalog.length === 0) return;
    setProfileSettings((current) => {
      const vendors = current.vendors || {};
      const knownNames = new Set([
        ...(vendors.activePartners || []).map((p) => p.name),
        ...(vendors.pendingRequests || []).map((r) => r.name),
        ...(vendors.rejectedRequests || []).map((r) => r.name),
      ]);
      const discoveredNames = Array.from(
        new Set(
          providerCatalog
            .map((item) => item.providerName)
            .filter(Boolean)
            .filter((name) => name !== user?.name),
        ),
      );
      const additions = discoveredNames
        .filter((name) => !knownNames.has(name))
        .map((name) => ({
          id: `req-${toVendorId(name)}`,
          name,
          category: 'General Service',
          requestedAt: new Date().toISOString().slice(0, 10),
          submittedBy: 'auto-generated from provider catalog',
          notes: '',
        }));
      if (additions.length === 0) return current;
      return {
        ...current,
        vendors: { ...vendors, pendingRequests: [...(vendors.pendingRequests || []), ...additions] },
      };
    });
  }, [providerCatalog, setProfileSettings, user?.accountType, user?.name]);

  useEffect(() => {
    if (pendingVendorRequests.length === 0) {
      if (selectedVendorRequestId) setSelectedVendorRequestId('');
      return;
    }
    if (!pendingVendorRequests.some((r) => r.id === selectedVendorRequestId)) {
      setSelectedVendorRequestId(pendingVendorRequests[0].id);
    }
  }, [pendingVendorRequests, selectedVendorRequestId]);

  useEffect(() => {
    if (filteredProviderOrders.length === 0) {
      if (selectedOrderId) setSelectedOrderId('');
      return;
    }
    if (!filteredProviderOrders.some((o) => o.reference === selectedOrderId)) {
      setSelectedOrderId(filteredProviderOrders[0].reference);
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
    const [serviceData, catalogData, providerRequestData] = await Promise.all([
      request('/provider-services', undefined, 'GET', accessToken),
      request('/provider-services/catalog', undefined, 'GET', accessToken).catch(() => []),
      request('/roadside-requests/provider', undefined, 'GET', accessToken).catch(() => []),
    ]);
    setProviderServices(serviceData);
    setProviderCatalog(Array.isArray(catalogData) ? catalogData : []);
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
      setSelectedOrderId(orderItem.reference);
      return;
    }
    if (actionType === 'message') {
      setMessage(`Message thread opened for ${orderItem.customer.name}.`);
      return;
    }
    const nextStatusByAction = {
      pick: 'provider_assigned',
      ship: 'in_progress',
      deliver: 'completed',
      cancel: 'cancelled',
    };
    const nextStatus = nextStatusByAction[actionType];
    if (!nextStatus || !token) return;
    setUpdatingOrderId(orderItem.reference);
    try {
      await request(
        `/roadside-requests/${orderItem.reference}/status`,
        { status: nextStatus },
        'PATCH',
        token,
      );
      const refreshed = await request('/roadside-requests/provider', undefined, 'GET', token);
      setRequests(Array.isArray(refreshed) ? refreshed : []);
      setMessage(`Order ${orderItem.reference} moved to ${nextStatus.replaceAll('_', ' ')}.`);
    } catch (error) {
      setMessage(error.message || 'Unable to update order status.');
    } finally {
      setUpdatingOrderId('');
    }
  }

  function acceptVendorRequest(requestId) {
    let acceptedName = '';
    setProfileSettings((current) => {
      const vendors = current.vendors || {};
      const pendingRequests = vendors.pendingRequests || [];
      const activePartners = vendors.activePartners || [];
      const requestItem = pendingRequests.find((entry) => entry.id === requestId);
      if (!requestItem) return current;
      acceptedName = requestItem.name;
      const alreadyIntegrated = activePartners.some((p) => p.name === requestItem.name);
      const nextActivePartners = alreadyIntegrated
        ? activePartners
        : [
            ...activePartners,
            {
              id: `vendor-${toVendorId(requestItem.name)}`,
              name: requestItem.name,
              category: requestItem.category || 'General Service',
              joinDate: new Date().toISOString().slice(0, 10),
              completedOrders: 0,
              rating: 0,
              demand: 'New integration',
              bio: requestItem.notes || 'Recently approved vendor integration.',
            },
          ];
      return {
        ...current,
        vendors: {
          ...vendors,
          activePartners: nextActivePartners,
          pendingRequests: pendingRequests.filter((entry) => entry.id !== requestId),
        },
      };
    });
    setMessage(acceptedName ? `${acceptedName} integration approved.` : 'Integration request approved.');
  }

  function rejectVendorRequest(requestId) {
    let rejectedName = '';
    setProfileSettings((current) => {
      const vendors = current.vendors || {};
      const pendingRequests = vendors.pendingRequests || [];
      const rejectedRequests = vendors.rejectedRequests || [];
      const requestItem = pendingRequests.find((entry) => entry.id === requestId);
      if (!requestItem) return current;
      rejectedName = requestItem.name;
      return {
        ...current,
        vendors: {
          ...vendors,
          pendingRequests: pendingRequests.filter((entry) => entry.id !== requestId),
          rejectedRequests: [
            { ...requestItem, reviewedAt: new Date().toISOString().slice(0, 10) },
            ...rejectedRequests,
          ],
        },
      };
    });
    setMessage(rejectedName ? `${rejectedName} integration rejected.` : 'Integration request rejected.');
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
              providerOrders={providerOrders}
              filteredProviderOrders={filteredProviderOrders}
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
          {dashboardTab === 'profile' ? <ProfilePanel /> : null}
          {dashboardTab === 'settings' ? <SettingsPanel /> : null}
        </div>
      </div>
    </section>
  );
}
