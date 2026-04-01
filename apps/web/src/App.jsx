import { useEffect, useMemo, useState } from 'react';

const API_BASE = 'http://localhost:4000';

const serviceTypeOptions = [
  { code: 'battery_jump', label: 'Battery Jump', short: 'Power restart' },
  { code: 'fuel_delivery', label: 'Fuel Delivery', short: 'Fuel + delivery' },
  { code: 'tire_change', label: 'Tire Change', short: 'Wheel support' },
  { code: 'towing', label: 'Towing', short: 'Recovery move' },
  { code: 'lockout', label: 'Lockout', short: 'Entry support' },
];

const futureCustomerModules = [
  { title: 'Diagnostics', meta: 'Coming next', detail: 'Fault alerts and probable causes.' },
  { title: 'Live Fuel', meta: 'Planned', detail: 'Consumption trends and refill history.' },
  { title: 'Next Service', meta: 'Planned', detail: 'Mileage-based maintenance reminders.' },
  { title: 'Car History', meta: 'Planned', detail: 'Parts, service logs, and ownership notes.' },
];

const futureProviderModules = [
  { title: 'Live Jobs', meta: 'Next phase', detail: 'Incoming roadside jobs and dispatch.' },
  { title: 'Coverage', meta: 'Planned', detail: 'Zones, hours, and provider availability.' },
  { title: 'Payouts', meta: 'Planned', detail: 'Cash, M-Pesa, and provider earnings.' },
  { title: 'Reviews', meta: 'Planned', detail: 'Ratings, complaints, and service quality.' },
];

const fuelLiterOptions = [5, 10, 20, 30];

const initialRegister = {
  name: '',
  email: '',
  accountType: 'customer',
  password: '',
};

const initialLogin = {
  email: '',
  password: '',
};

const initialVerify = {
  email: '',
  otp: '',
};

const initialVehicle = {
  nickname: '',
  make: '',
  model: '',
  year: new Date().getFullYear(),
  registrationNumber: '',
  color: '',
  notes: '',
};

const initialProviderService = {
  serviceName: '',
  serviceCode: 'battery_jump',
  basePriceKsh: '1500',
  pricePerKmKsh: '150',
  description: '',
  gasolineRegularPrice: '',
  gasolineVPowerPrice: '',
  dieselPrice: '',
};

const initialRoadsideRequest = {
  vehicleId: '',
  providerServiceId: '',
  distanceKm: '8',
  latitude: '',
  longitude: '',
  address: '',
  landmark: '',
  notes: '',
  fuelLitres: '10',
  customFuelLitres: '',
  fuelType: 'gasoline',
  gasolineGrade: 'regular',
};

async function request(path, body, method = 'POST', token) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(Array.isArray(data.message) ? data.message.join(', ') : data.message);
  }

  return data;
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function getSelectedFuelLitres(form) {
  return form.fuelLitres === 'custom'
    ? Number(form.customFuelLitres || 0)
    : Number(form.fuelLitres || 0);
}

function getFuelUnitPrice(service, form) {
  if (!service || service.serviceCode !== 'fuel_delivery') {
    return 0;
  }

  if (form.fuelType === 'diesel') {
    return service.fuelPricing?.diesel?.standard ?? 0;
  }

  return form.gasolineGrade === 'vpower'
    ? service.fuelPricing?.gasoline?.vpower ?? 0
    : service.fuelPricing?.gasoline?.regular ?? 0;
}

export default function App() {
  const [health, setHealth] = useState(null);
  const [mode, setMode] = useState('login');
  const [step, setStep] = useState('entry');
  const [registerForm, setRegisterForm] = useState(initialRegister);
  const [loginForm, setLoginForm] = useState(initialLogin);
  const [verifyForm, setVerifyForm] = useState(initialVerify);
  const [message, setMessage] = useState('Choose how you want to use VIS Assist.');
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);
  const [devOtp, setDevOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [requests, setRequests] = useState([]);
  const [providerServices, setProviderServices] = useState([]);
  const [providerCatalog, setProviderCatalog] = useState([]);
  const [vehicleForm, setVehicleForm] = useState(initialVehicle);
  const [providerServiceForm, setProviderServiceForm] = useState(initialProviderService);
  const [editingProviderServiceId, setEditingProviderServiceId] = useState('');
  const [roadsideForm, setRoadsideForm] = useState(initialRoadsideRequest);
  const [dashboardTab, setDashboardTab] = useState('overview');
  const [serviceFilter, setServiceFilter] = useState('battery_jump');

  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then((res) => res.json())
      .then((data) => setHealth(data))
      .catch(() => {
        setHealth({
          status: 'offline',
          service: 'vis-assist-api',
        });
      });
  }, []);

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
      setRoadsideForm((existing) => ({
        ...existing,
        providerServiceId: filtered[0].id,
      }));
    }
  }, [providerCatalog, roadsideForm.providerServiceId, serviceFilter]);

  const filteredProviderOptions = providerCatalog.filter((item) => item.serviceCode === serviceFilter);
  const selectedProviderService = providerCatalog.find(
    (item) => item.id === roadsideForm.providerServiceId,
  );
  const selectedFuelLitres = getSelectedFuelLitres(roadsideForm);

  const deliveryEstimate = selectedProviderService
    ? Number(roadsideForm.distanceKm || 0) * selectedProviderService.pricePerKmKsh +
      selectedProviderService.basePriceKsh
    : 0;

  const fuelEstimate =
    selectedProviderService?.serviceCode === 'fuel_delivery'
      ? getFuelUnitPrice(selectedProviderService, roadsideForm) * selectedFuelLitres
      : 0;

  const totalEstimate = deliveryEstimate + fuelEstimate;

  const requestStats = useMemo(
    () => ({
      active: requests.filter((item) => item.status !== 'completed').length,
      vehicles: vehicles.length,
      providers: providerCatalog.length,
      services: providerServices.length,
    }),
    [providerCatalog.length, providerServices.length, requests, vehicles.length],
  );

  async function loadCustomerDashboard(accessToken) {
    const [vehicleData, requestData, catalogData] = await Promise.all([
      request('/vehicles', undefined, 'GET', accessToken),
      request('/roadside-requests', undefined, 'GET', accessToken),
      request('/provider-services/catalog', undefined, 'GET', accessToken),
    ]);

    setVehicles(vehicleData);
    setRequests(requestData);
    setProviderCatalog(catalogData);
    setProviderServices([]);

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

  async function loadProviderDashboard(accessToken) {
    const serviceData = await request('/provider-services', undefined, 'GET', accessToken);
    setProviderServices(serviceData);
    setProviderCatalog([]);
    setVehicles([]);
    setRequests([]);
  }

  async function handleRegister(event) {
    event.preventDefault();
    setLoading(true);

    try {
      const data = await request('/auth/register', registerForm);
      setMode('login');
      setLoginForm({
        email: data.user.email,
        password: registerForm.password,
      });
      setVerifyForm({ email: data.user.email, otp: '' });
      setMessage(`Account ready. Sign in to continue as ${data.user.accountType}.`);
      setRegisterForm(initialRegister);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    setLoading(true);

    try {
      const data = await request('/auth/login', loginForm);
      setDevOtp(data.devOtp ?? '');
      setStep('otp');
      setToken('');
      setUser(null);
      setVehicles([]);
      setRequests([]);
      setProviderServices([]);
      setProviderCatalog([]);
      setVerifyForm({
        email: loginForm.email,
        otp: '',
      });
      setMessage(data.devOtp ? 'OTP sent. Use the code below for local testing.' : 'OTP sent.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(event) {
    event.preventDefault();
    setLoading(true);

    try {
      const data = await request('/auth/verify-otp', verifyForm);
      setToken(data.accessToken);
      setUser(data.user);
      setDevOtp('');
      setStep('dashboard');
      setDashboardTab('overview');

      if (data.user.accountType === 'provider') {
        await loadProviderDashboard(data.accessToken);
      } else {
        await loadCustomerDashboard(data.accessToken);
      }

      setMessage(`Signed in as ${data.user.email}`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
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
      setDashboardTab('request');
      setMessage(`Vehicle saved: ${newVehicle.nickname}`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
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
          ? current.map((service) =>
              service.id === editingProviderServiceId ? savedService : service,
            )
          : [savedService, ...current],
      );

      setProviderServiceForm({
        ...initialProviderService,
        serviceCode: providerServiceForm.serviceCode,
      });
      setEditingProviderServiceId('');
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

  function handleForgotPassword() {
    setMessage('Forgot password will be enabled when email delivery is connected.');
  }

  function handleSocialLogin(provider) {
    setMessage(`${provider} sign-in will be added after the core auth flow is stable.`);
  }

  async function handleUseCurrentLocation() {
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

  async function handleSubmitRoadsideRequest(event) {
    event.preventDefault();
    setLoading(true);

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

  function resetFlow(nextMode = 'login') {
    setMode(nextMode);
    setStep('entry');
    setToken('');
    setUser(null);
    setVehicles([]);
    setRequests([]);
    setProviderServices([]);
    setProviderCatalog([]);
    setDevOtp('');
    setVerifyForm(initialVerify);
    setVehicleForm(initialVehicle);
    setProviderServiceForm(initialProviderService);
    setEditingProviderServiceId('');
    setRoadsideForm(initialRoadsideRequest);
    setDashboardTab('overview');
    setServiceFilter('battery_jump');
    setMessage('Choose how you want to use VIS Assist.');
  }

  function renderLandingPanel() {
    return (
      <section className="landing-shell">
        <div className="masthead">
          <div className="brand-badge">VIS</div>
          <div>
            <p className="eyebrow">Vehicle Intelligence System</p>
            <h1>Roadside help first. Vehicle intelligence next.</h1>
          </div>
        </div>

        <p className="landing-copy">
          Request help fast, publish provider pricing, and grow into diagnostics, maintenance, car
          history, valuation, and parts search.
        </p>

        <div className="cta-row">
          <button className="primary-cta" type="button" onClick={() => setMode('login')}>
            Request service
          </button>
          <button
            className="secondary-cta"
            type="button"
            onClick={() => {
              setMode('register');
              setRegisterForm((current) => ({ ...current, accountType: 'provider' }));
            }}
          >
            Provide a service
          </button>
        </div>

        <div className="service-strip">
          {serviceTypeOptions.map((service) => (
            <article className="service-tile" key={service.code}>
              <strong>{service.label}</strong>
              <span>{service.short}</span>
            </article>
          ))}
        </div>

        <div className="future-strip">
          <div className="future-callout">
            <span>Next up</span>
            <strong>Diagnostics, car health, service history, and provider operations.</strong>
          </div>
          <div className="status-pill">
            <span className={`dot ${health?.status === 'ok' ? 'live' : ''}`} />
            {health?.status === 'ok' ? 'API live' : 'API offline'}
          </div>
        </div>
      </section>
    );
  }

  function renderAuthPanel() {
    if (step === 'otp') {
      return (
        <form className="auth-shell" onSubmit={handleVerify}>
          <div className="auth-head">
            <span className="mini-pill">OTP</span>
            <h2>Verify sign in</h2>
          </div>
          <label>
            <span>Email</span>
            <input
              type="email"
              value={verifyForm.email}
              onChange={(event) => setVerifyForm({ ...verifyForm, email: event.target.value })}
            />
          </label>
          <label>
            <span>Code</span>
            <input
              placeholder="123456"
              value={verifyForm.otp}
              onChange={(event) => setVerifyForm({ ...verifyForm, otp: event.target.value })}
            />
          </label>
          {devOtp ? <div className="otp-box">Dev OTP: {devOtp}</div> : null}
          <button type="submit" disabled={loading}>
            {loading ? 'Verifying...' : 'Continue'}
          </button>
          <button className="ghost-button" type="button" onClick={() => resetFlow('login')}>
            Back
          </button>
        </form>
      );
    }

    return (
      <div className="auth-shell">
        <div className="auth-tabs">
          <button
            className={mode === 'login' ? 'switch-active' : 'switch-idle'}
            type="button"
            onClick={() => setMode('login')}
          >
            Log in
          </button>
          <button
            className={mode === 'register' ? 'switch-active' : 'switch-idle'}
            type="button"
            onClick={() => setMode('register')}
          >
            Create account
          </button>
        </div>

        {mode === 'register' ? (
          <form className="stack" onSubmit={handleRegister}>
            <div className="auth-head">
              <span className="mini-pill">Account</span>
              <h2>Join fast</h2>
            </div>
            <label>
              <span>Name</span>
              <input
                placeholder="Jane Doe"
                value={registerForm.name}
                onChange={(event) => setRegisterForm({ ...registerForm, name: event.target.value })}
              />
            </label>
            <label>
              <span>Email</span>
              <input
                placeholder="you@example.com"
                type="email"
                value={registerForm.email}
                onChange={(event) =>
                  setRegisterForm({ ...registerForm, email: event.target.value })
                }
              />
            </label>
            <label>
              <span>Role</span>
              <select
                value={registerForm.accountType}
                onChange={(event) =>
                  setRegisterForm({ ...registerForm, accountType: event.target.value })
                }
              >
                <option value="customer">Customer</option>
                <option value="provider">Provider</option>
              </select>
            </label>
            <label>
              <span>Password</span>
              <input
                type="password"
                placeholder="Minimum 8 characters"
                value={registerForm.password}
                onChange={(event) =>
                  setRegisterForm({ ...registerForm, password: event.target.value })
                }
              />
            </label>
            <button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create account'}
            </button>
          </form>
        ) : (
          <form className="stack" onSubmit={handleLogin}>
            <div className="auth-head">
              <span className="mini-pill">Access</span>
              <h2>Welcome back</h2>
            </div>
            <label>
              <span>Email</span>
              <input
                placeholder="you@example.com"
                type="email"
                value={loginForm.email}
                onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })}
              />
            </label>
            <label>
              <span>Password</span>
              <input
                type="password"
                placeholder="Your password"
                value={loginForm.password}
                onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
              />
            </label>
            <button type="submit" disabled={loading}>
              {loading ? 'Sending OTP...' : 'Continue with OTP'}
            </button>
            <div className="inline-actions">
              <button className="link-button" type="button" onClick={handleForgotPassword}>
                Forgot password
              </button>
            </div>
          </form>
        )}

        <div className="social-stack">
          <button className="social-button" type="button" onClick={() => handleSocialLogin('Google')}>
            Continue with Google
          </button>
          <button className="social-button" type="button" onClick={() => handleSocialLogin('Apple')}>
            Continue with Apple ID
          </button>
        </div>

        <div className="status-banner">{message}</div>
      </div>
    );
  }

  function renderCustomerDashboard() {
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
          <button className="ghost-button" type="button" onClick={() => resetFlow('login')}>
            Log out
          </button>
        </aside>

        <div className="dashboard-main">
          {dashboardTab === 'overview' ? renderCustomerOverview() : null}
          {dashboardTab === 'request' ? renderRequestPanel() : null}
          {dashboardTab === 'vehicles' ? renderVehiclePanel() : null}
          {dashboardTab === 'history' ? renderHistoryPanel() : null}
        </div>
      </section>
    );
  }

  function renderProviderDashboard() {
    return (
      <section className="dashboard-shell">
        <aside className="dashboard-sidebar">
          <div className="sidebar-head">
            <p className="eyebrow">Provider</p>
            <h2>{user?.name}</h2>
            <span>{user?.email}</span>
          </div>
          <nav className="sidebar-nav">
            {[
              ['overview', 'Overview'],
              ['services', 'Services'],
              ['pricing', editingProviderServiceId ? 'Edit' : 'Add'],
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
              <span>Published</span>
              <strong>{requestStats.services}</strong>
            </div>
            <div className="metric-card">
              <span>Status</span>
              <strong>Ready</strong>
            </div>
          </div>
          <button className="ghost-button" type="button" onClick={() => resetFlow('login')}>
            Log out
          </button>
        </aside>

        <div className="dashboard-main">
          {dashboardTab === 'overview' ? renderProviderOverview() : null}
          {dashboardTab === 'services' ? renderProviderServiceList() : null}
          {dashboardTab === 'pricing' ? renderProviderServicePanel() : null}
        </div>
      </section>
    );
  }

  function renderCustomerOverview() {
    return (
      <section className="dashboard-panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Overview</p>
            <h3>Clean entry point</h3>
          </div>
          <button className="primary-cta" type="button" onClick={() => setDashboardTab('request')}>
            New roadside request
          </button>
        </div>

        <div className="hero-grid">
          <article className="spotlight-card">
            <span>Roadside</span>
            <strong>Fast request flow</strong>
            <p>Fuel, towing, battery, tire change, and lockout.</p>
          </article>
          <article className="spotlight-card alt">
            <span>Vehicle profile</span>
            <strong>Data foundation</strong>
            <p>Save your car once and build maintenance history over time.</p>
          </article>
        </div>

        <div className="module-grid">
          {futureCustomerModules.map((module) => (
            <article className="module-card" key={module.title}>
              <span>{module.meta}</span>
              <strong>{module.title}</strong>
              <p>{module.detail}</p>
            </article>
          ))}
        </div>
      </section>
    );
  }

  function renderProviderOverview() {
    return (
      <section className="dashboard-panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Provider hub</p>
            <h3>Pricing first</h3>
          </div>
          <button className="primary-cta" type="button" onClick={() => setDashboardTab('pricing')}>
            Add service
          </button>
        </div>

        <div className="hero-grid">
          <article className="spotlight-card">
            <span>Provider catalog</span>
            <strong>Live on customer side</strong>
            <p>Your base charge, rate per km, and fuel pricing drive customer estimates.</p>
          </article>
          <article className="spotlight-card alt">
            <span>Roadmap</span>
            <strong>Dispatch-ready UI</strong>
            <p>Incoming jobs, availability, payouts, and reviews fit into this layout next.</p>
          </article>
        </div>

        <div className="module-grid">
          {futureProviderModules.map((module) => (
            <article className="module-card" key={module.title}>
              <span>{module.meta}</span>
              <strong>{module.title}</strong>
              <p>{module.detail}</p>
            </article>
          ))}
        </div>
      </section>
    );
  }

  function renderVehiclePanel() {
    return (
      <form className="dashboard-panel stack" onSubmit={handleAddVehicle}>
        <div className="panel-head">
          <div>
            <p className="eyebrow">Vehicle</p>
            <h3>Add a car</h3>
          </div>
        </div>
        <div className="form-grid">
          <label>
            <span>Nickname</span>
            <input
              value={vehicleForm.nickname}
              onChange={(event) => setVehicleForm({ ...vehicleForm, nickname: event.target.value })}
            />
          </label>
          <label>
            <span>Make</span>
            <input
              value={vehicleForm.make}
              onChange={(event) => setVehicleForm({ ...vehicleForm, make: event.target.value })}
            />
          </label>
          <label>
            <span>Model</span>
            <input
              value={vehicleForm.model}
              onChange={(event) => setVehicleForm({ ...vehicleForm, model: event.target.value })}
            />
          </label>
          <label>
            <span>Year</span>
            <input
              type="number"
              value={vehicleForm.year}
              onChange={(event) =>
                setVehicleForm({ ...vehicleForm, year: Number(event.target.value) })
              }
            />
          </label>
          <label>
            <span>Registration</span>
            <input
              value={vehicleForm.registrationNumber}
              onChange={(event) =>
                setVehicleForm({ ...vehicleForm, registrationNumber: event.target.value })
              }
            />
          </label>
          <label>
            <span>Color</span>
            <input
              value={vehicleForm.color}
              onChange={(event) => setVehicleForm({ ...vehicleForm, color: event.target.value })}
            />
          </label>
        </div>
        <label>
          <span>Notes</span>
          <textarea
            value={vehicleForm.notes}
            onChange={(event) => setVehicleForm({ ...vehicleForm, notes: event.target.value })}
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save vehicle'}
        </button>
      </form>
    );
  }

  function renderProviderServicePanel() {
    const isFuelDelivery = providerServiceForm.serviceCode === 'fuel_delivery';

    return (
      <form className="dashboard-panel stack" onSubmit={handleAddProviderService}>
        <div className="panel-head">
          <div>
            <p className="eyebrow">Service pricing</p>
            <h3>{editingProviderServiceId ? 'Edit service' : 'Add service'}</h3>
          </div>
        </div>
        <div className="form-grid">
          <label>
            <span>Name</span>
            <input
              value={providerServiceForm.serviceName}
              onChange={(event) =>
                setProviderServiceForm({ ...providerServiceForm, serviceName: event.target.value })
              }
            />
          </label>
          <label>
            <span>Type</span>
            <select
              value={providerServiceForm.serviceCode}
              onChange={(event) =>
                setProviderServiceForm({ ...providerServiceForm, serviceCode: event.target.value })
              }
            >
              {serviceTypeOptions.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Base charge</span>
            <input
              type="number"
              min="0"
              value={providerServiceForm.basePriceKsh}
              onChange={(event) =>
                setProviderServiceForm({ ...providerServiceForm, basePriceKsh: event.target.value })
              }
            />
          </label>
          <label>
            <span>Charge per km</span>
            <input
              type="number"
              min="0"
              value={providerServiceForm.pricePerKmKsh}
              onChange={(event) =>
                setProviderServiceForm({
                  ...providerServiceForm,
                  pricePerKmKsh: event.target.value,
                })
              }
            />
          </label>
        </div>
        <label>
          <span>Description</span>
          <textarea
            value={providerServiceForm.description}
            onChange={(event) =>
              setProviderServiceForm({ ...providerServiceForm, description: event.target.value })
            }
          />
        </label>

        {isFuelDelivery ? (
          <div className="soft-block">
            <div className="panel-head compact">
              <div>
                <p className="eyebrow">Fuel</p>
                <h3>Per litre pricing</h3>
              </div>
            </div>
            <div className="form-grid">
              <label>
                <span>Gasoline regular</span>
                <input
                  type="number"
                  min="0"
                  value={providerServiceForm.gasolineRegularPrice}
                  onChange={(event) =>
                    setProviderServiceForm({
                      ...providerServiceForm,
                      gasolineRegularPrice: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                <span>Gasoline V-Power</span>
                <input
                  type="number"
                  min="0"
                  value={providerServiceForm.gasolineVPowerPrice}
                  onChange={(event) =>
                    setProviderServiceForm({
                      ...providerServiceForm,
                      gasolineVPowerPrice: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                <span>Diesel</span>
                <input
                  type="number"
                  min="0"
                  value={providerServiceForm.dieselPrice}
                  onChange={(event) =>
                    setProviderServiceForm({
                      ...providerServiceForm,
                      dieselPrice: event.target.value,
                    })
                  }
                />
              </label>
            </div>
          </div>
        ) : null}

        <button type="submit" disabled={loading}>
          {loading ? 'Saving...' : editingProviderServiceId ? 'Update service' : 'Publish service'}
        </button>
        {editingProviderServiceId ? (
          <button
            className="ghost-button"
            type="button"
            onClick={() => {
              setEditingProviderServiceId('');
              setProviderServiceForm(initialProviderService);
            }}
          >
            Cancel edit
          </button>
        ) : null}
      </form>
    );
  }

  function renderRequestPanel() {
    if (vehicles.length === 0) {
      return <div className="dashboard-panel empty-state">Add a vehicle first.</div>;
    }

    if (providerCatalog.length === 0) {
      return <div className="dashboard-panel empty-state">No provider services are live yet.</div>;
    }

    if (filteredProviderOptions.length === 0) {
      return (
        <div className="dashboard-panel empty-state">
          No providers currently offer {serviceTypeOptions.find((item) => item.code === serviceFilter)?.label.toLowerCase()}.
        </div>
      );
    }

    return (
      <form className="dashboard-panel stack" onSubmit={handleSubmitRoadsideRequest}>
        <div className="panel-head">
          <div>
            <p className="eyebrow">Roadside request</p>
            <h3>Simple, fast request</h3>
          </div>
        </div>

        <div className="service-toggle-row">
          {serviceTypeOptions.map((option) => (
            <button
              key={option.code}
              className={serviceFilter === option.code ? 'chip-active' : 'chip'}
              type="button"
              onClick={() => setServiceFilter(option.code)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="form-grid">
          <label>
            <span>Vehicle</span>
            <select
              value={roadsideForm.vehicleId}
              onChange={(event) =>
                setRoadsideForm({ ...roadsideForm, vehicleId: event.target.value })
              }
            >
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.nickname} • {vehicle.registrationNumber}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Provider</span>
            <select
              value={roadsideForm.providerServiceId}
              onChange={(event) =>
                setRoadsideForm({ ...roadsideForm, providerServiceId: event.target.value })
              }
            >
              {filteredProviderOptions.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.providerName} • {service.serviceName}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Distance km</span>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={roadsideForm.distanceKm}
              onChange={(event) =>
                setRoadsideForm({ ...roadsideForm, distanceKm: event.target.value })
              }
            />
          </label>
          <label>
            <span>Address</span>
            <input
              value={roadsideForm.address}
              onChange={(event) =>
                setRoadsideForm({ ...roadsideForm, address: event.target.value })
              }
            />
          </label>
          <label>
            <span>Latitude</span>
            <input
              value={roadsideForm.latitude}
              onChange={(event) =>
                setRoadsideForm({ ...roadsideForm, latitude: event.target.value })
              }
            />
          </label>
          <label>
            <span>Longitude</span>
            <input
              value={roadsideForm.longitude}
              onChange={(event) =>
                setRoadsideForm({ ...roadsideForm, longitude: event.target.value })
              }
            />
          </label>
        </div>

        <button className="ghost-button" type="button" onClick={handleUseCurrentLocation}>
          Use current location
        </button>

        {selectedProviderService?.serviceCode === 'fuel_delivery' ? (
          <div className="soft-block">
            <div className="service-toggle-row">
              {fuelLiterOptions.map((litres) => (
                <button
                  key={litres}
                  className={roadsideForm.fuelLitres === String(litres) ? 'chip-active' : 'chip'}
                  type="button"
                  onClick={() =>
                    setRoadsideForm({
                      ...roadsideForm,
                      fuelLitres: String(litres),
                      customFuelLitres: '',
                    })
                  }
                >
                  {litres}L
                </button>
              ))}
              <button
                className={roadsideForm.fuelLitres === 'custom' ? 'chip-active' : 'chip'}
                type="button"
                onClick={() => setRoadsideForm({ ...roadsideForm, fuelLitres: 'custom' })}
              >
                Custom
              </button>
            </div>

            {roadsideForm.fuelLitres === 'custom' ? (
              <label>
                <span>Custom litres</span>
                <input
                  type="number"
                  min="1"
                  value={roadsideForm.customFuelLitres}
                  onChange={(event) =>
                    setRoadsideForm({ ...roadsideForm, customFuelLitres: event.target.value })
                  }
                />
              </label>
            ) : null}

            <div className="form-grid">
              <label>
                <span>Fuel type</span>
                <select
                  value={roadsideForm.fuelType}
                  onChange={(event) =>
                    setRoadsideForm({ ...roadsideForm, fuelType: event.target.value })
                  }
                >
                  <option value="gasoline">Gasoline</option>
                  <option value="diesel">Diesel</option>
                </select>
              </label>
              {roadsideForm.fuelType === 'gasoline' ? (
                <label>
                  <span>Grade</span>
                  <select
                    value={roadsideForm.gasolineGrade}
                    onChange={(event) =>
                      setRoadsideForm({ ...roadsideForm, gasolineGrade: event.target.value })
                    }
                  >
                    <option value="regular">Regular</option>
                    <option value="vpower">V-Power</option>
                  </select>
                </label>
              ) : null}
            </div>
          </div>
        ) : null}

        <label>
          <span>Landmark</span>
          <input
            value={roadsideForm.landmark}
            onChange={(event) => setRoadsideForm({ ...roadsideForm, landmark: event.target.value })}
          />
        </label>
        <label>
          <span>Notes</span>
          <textarea
            value={roadsideForm.notes}
            onChange={(event) => setRoadsideForm({ ...roadsideForm, notes: event.target.value })}
          />
        </label>

        <div className="estimate-band">
          <span>Estimated total</span>
          <strong>{formatCurrency(totalEstimate || deliveryEstimate)}</strong>
          <p>
            {selectedProviderService?.serviceCode === 'fuel_delivery'
              ? `Fuel ${formatCurrency(fuelEstimate)} + delivery ${formatCurrency(deliveryEstimate)}`
              : `Base ${formatCurrency(selectedProviderService?.basePriceKsh)} + ${formatCurrency(selectedProviderService?.pricePerKmKsh)}/km`}
          </p>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit request'}
        </button>
      </form>
    );
  }

  function renderProviderServiceList() {
    if (providerServices.length === 0) {
      return <div className="dashboard-panel empty-state">No services published yet.</div>;
    }

    return (
      <section className="dashboard-panel stack">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Published</p>
            <h3>Service catalog</h3>
          </div>
        </div>
        <div className="card-list">
          {providerServices.map((service) => (
            <article className="info-card" key={service.id}>
              <div className="info-top">
                <strong>{service.serviceName}</strong>
                <span className="mini-pill">
                  {serviceTypeOptions.find((option) => option.code === service.serviceCode)?.label}
                </span>
              </div>
              <p>{service.description || 'No description yet.'}</p>
              <div className="info-meta">
                <span>Base {formatCurrency(service.basePriceKsh)}</span>
                <span>{formatCurrency(service.pricePerKmKsh)}/km</span>
              </div>
              <button
                className="ghost-button"
                type="button"
                onClick={() => {
                  setEditingProviderServiceId(service.id);
                  setProviderServiceForm({
                    serviceName: service.serviceName,
                    serviceCode: service.serviceCode,
                    basePriceKsh: String(service.basePriceKsh),
                    pricePerKmKsh: String(service.pricePerKmKsh),
                    description: service.description ?? '',
                    gasolineRegularPrice: service.fuelPricing?.gasoline?.regular
                      ? String(service.fuelPricing.gasoline.regular)
                      : '',
                    gasolineVPowerPrice: service.fuelPricing?.gasoline?.vpower
                      ? String(service.fuelPricing.gasoline.vpower)
                      : '',
                    dieselPrice: service.fuelPricing?.diesel?.standard
                      ? String(service.fuelPricing.diesel.standard)
                      : '',
                  });
                  setDashboardTab('pricing');
                  setMessage(`Editing ${service.serviceName}.`);
                }}
              >
                Edit service
              </button>
            </article>
          ))}
        </div>
      </section>
    );
  }

  function renderHistoryPanel() {
    if (requests.length === 0) {
      return <div className="dashboard-panel empty-state">No requests yet.</div>;
    }

    return (
      <section className="dashboard-panel stack">
        <div className="panel-head">
          <div>
            <p className="eyebrow">History</p>
            <h3>Request timeline</h3>
          </div>
        </div>
        <div className="card-list">
          {requests.map((roadsideRequest) => (
            <article className="info-card" key={roadsideRequest.id}>
              <div className="info-top">
                <strong>{roadsideRequest.issueType}</strong>
                <span className="mini-pill">{roadsideRequest.status.replaceAll('_', ' ')}</span>
              </div>
              <p>{roadsideRequest.address}</p>
              <div className="info-meta">
                <span>{roadsideRequest.providerName}</span>
                <span>{roadsideRequest.distanceKm} km</span>
                <span>{roadsideRequest.etaMinutes} min ETA</span>
                <span>{formatCurrency(roadsideRequest.estimatedPriceKsh)}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  return (
    <main className="app-shell">
      {step === 'dashboard' ? (
        user?.accountType === 'provider' ? renderProviderDashboard() : renderCustomerDashboard()
      ) : (
        <div className="entry-layout">
          {renderLandingPanel()}
          {renderAuthPanel()}
        </div>
      )}
    </main>
  );
}
