import { useEffect, useState } from 'react';

const API_BASE = 'http://localhost:4000';
const authSteps = ['entry', 'otp', 'dashboard'];
const issueTypes = ['Battery Jump', 'Fuel Delivery', 'Tire Change', 'Towing'];

const initialRegister = {
  name: '',
  email: '',
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

const initialRoadsideRequest = {
  vehicleId: '',
  issueType: 'Battery Jump',
  latitude: '',
  longitude: '',
  address: '',
  landmark: '',
  notes: '',
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

export default function App() {
  const [health, setHealth] = useState(null);
  const [mode, setMode] = useState('login');
  const [step, setStep] = useState('entry');
  const [registerForm, setRegisterForm] = useState(initialRegister);
  const [loginForm, setLoginForm] = useState(initialLogin);
  const [verifyForm, setVerifyForm] = useState(initialVerify);
  const [message, setMessage] = useState('Choose a path to continue.');
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);
  const [devOtp, setDevOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [requests, setRequests] = useState([]);
  const [vehicleForm, setVehicleForm] = useState(initialVehicle);
  const [roadsideForm, setRoadsideForm] = useState(initialRoadsideRequest);
  const [dashboardTab, setDashboardTab] = useState('request');

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

  async function loadDashboardData(accessToken) {
    const [vehicleData, requestData] = await Promise.all([
      request('/vehicles', undefined, 'GET', accessToken),
      request('/roadside-requests', undefined, 'GET', accessToken),
    ]);

    setVehicles(vehicleData);
    setRequests(requestData);

    if (vehicleData.length > 0) {
      setRoadsideForm((current) => ({
        ...current,
        vehicleId: current.vehicleId || vehicleData[0].id,
      }));
    }
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
      setMessage(`Account created for ${data.user.email}. Continue to sign in.`);
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
      setMessage(
        data.devOtp
          ? `OTP sent. Use ${data.devOtp} for local verification.`
          : 'OTP sent. Check your configured delivery channel.',
      );
      setVerifyForm({
        email: loginForm.email,
        otp: '',
      });
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
      setDashboardTab('request');
      await loadDashboardData(data.accessToken);
      setMessage(`Authenticated as ${data.user.email}`);
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
      const updatedVehicles = [...vehicles, newVehicle];
      setVehicles(updatedVehicles);
      setVehicleForm(initialVehicle);
      setRoadsideForm((current) => ({
        ...current,
        vehicleId: newVehicle.id,
      }));
      setDashboardTab('request');
      setMessage(`Vehicle saved: ${newVehicle.nickname}`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
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
        setMessage('Location captured. Add the street address and submit the request.');
        setLoading(false);
      },
      () => {
        setMessage('Unable to capture your location. Enter latitude and longitude manually.');
        setLoading(false);
      },
    );
  }

  async function handleSubmitRoadsideRequest(event) {
    event.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...roadsideForm,
        latitude: Number(roadsideForm.latitude),
        longitude: Number(roadsideForm.longitude),
      };
      const newRequest = await request('/roadside-requests', payload, 'POST', token);
      setRequests((current) => [newRequest, ...current]);
      setRoadsideForm((current) => ({
        ...initialRoadsideRequest,
        vehicleId: current.vehicleId,
      }));
      setDashboardTab('history');
      setMessage(
        `Roadside request created. ${newRequest.issueType} is now searching with ETA ${newRequest.etaMinutes} minutes.`,
      );
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
    setDevOtp('');
    setVerifyForm(initialVerify);
    setVehicleForm(initialVehicle);
    setRoadsideForm(initialRoadsideRequest);
    setMessage(
      nextMode === 'register'
        ? 'Create an account to begin the verification flow.'
        : 'Enter your account details to request an OTP.',
    );
  }

  function renderEntryPanel() {
    if (mode === 'register') {
      return (
        <form className="auth-card" onSubmit={handleRegister}>
          <div className="card-head">
            <span className="step-badge">Step 1</span>
            <h2>Create your account</h2>
            <p>Register once, then continue through OTP verification to access the dashboard.</p>
          </div>
          <label>
            <span>Full name</span>
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
            <span>Password</span>
            <input
              placeholder="At least 8 characters"
              type="password"
              value={registerForm.password}
              onChange={(event) =>
                setRegisterForm({ ...registerForm, password: event.target.value })
              }
            />
          </label>
          <button type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
      );
    }

    return (
      <form className="auth-card" onSubmit={handleLogin}>
        <div className="card-head">
          <span className="step-badge">Step 1</span>
          <h2>Sign in</h2>
          <p>Enter your account credentials and we will send a one-time code to continue.</p>
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
            placeholder="Your password"
            type="password"
            value={loginForm.password}
            onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Sending OTP...' : 'Send OTP'}
        </button>
      </form>
    );
  }

  function renderOtpPanel() {
    return (
      <form className="auth-card" onSubmit={handleVerify}>
        <div className="card-head">
          <span className="step-badge">Step 2</span>
          <h2>Verify OTP</h2>
          <p>Use the one-time code sent after sign-in to unlock your dashboard session.</p>
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
          <span>6-digit code</span>
          <input
            placeholder="123456"
            value={verifyForm.otp}
            onChange={(event) => setVerifyForm({ ...verifyForm, otp: event.target.value })}
          />
        </label>
        {devOtp ? <div className="otp-hint">Development OTP: {devOtp}</div> : null}
        <button type="submit" disabled={loading}>
          {loading ? 'Verifying...' : 'Verify and continue'}
        </button>
        <button className="ghost-button" type="button" onClick={() => resetFlow('login')}>
          Back to sign in
        </button>
      </form>
    );
  }

  function renderDashboardHome() {
    return (
      <section className="dashboard-card">
        <div className="card-head">
          <span className="step-badge complete">Dashboard</span>
          <h2>Welcome back, {user?.name ?? 'Driver'}</h2>
          <p>Save your vehicle, capture your location, and send the first roadside assistance request.</p>
        </div>

        <div className="dashboard-grid">
          <div className="metric">
            <span>Signed in as</span>
            <strong>{user?.email}</strong>
          </div>
          <div className="metric">
            <span>Vehicles saved</span>
            <strong>{vehicles.length}</strong>
          </div>
          <div className="metric">
            <span>Requests created</span>
            <strong>{requests.length}</strong>
          </div>
          <div className="metric">
            <span>Session status</span>
            <strong>Authenticated</strong>
          </div>
        </div>

        <div className="dashboard-switch">
          <button
            className={dashboardTab === 'request' ? 'switch-active' : 'switch-idle'}
            type="button"
            onClick={() => setDashboardTab('request')}
          >
            Request Help
          </button>
          <button
            className={dashboardTab === 'vehicle' ? 'switch-active' : 'switch-idle'}
            type="button"
            onClick={() => setDashboardTab('vehicle')}
          >
            Add Vehicle
          </button>
          <button
            className={dashboardTab === 'history' ? 'switch-active' : 'switch-idle'}
            type="button"
            onClick={() => setDashboardTab('history')}
          >
            Active Requests
          </button>
        </div>

        {dashboardTab === 'request' ? renderRequestPanel() : null}
        {dashboardTab === 'vehicle' ? renderVehiclePanel() : null}
        {dashboardTab === 'history' ? renderHistoryPanel() : null}

        <div className="token-block">
          <span>Access token</span>
          <textarea readOnly value={token} />
        </div>

        <button className="ghost-button" type="button" onClick={() => resetFlow('login')}>
          Log out
        </button>
      </section>
    );
  }

  function renderVehiclePanel() {
    return (
      <form className="subpanel" onSubmit={handleAddVehicle}>
        <div className="subpanel-head">
          <h3>Add a vehicle profile</h3>
          <p>Save the car details once so future roadside requests are faster and more accurate.</p>
        </div>
        <div className="form-grid">
          <label>
            <span>Nickname</span>
            <input
              placeholder="Daily WRX"
              value={vehicleForm.nickname}
              onChange={(event) =>
                setVehicleForm({ ...vehicleForm, nickname: event.target.value })
              }
            />
          </label>
          <label>
            <span>Make</span>
            <input
              placeholder="Subaru"
              value={vehicleForm.make}
              onChange={(event) => setVehicleForm({ ...vehicleForm, make: event.target.value })}
            />
          </label>
          <label>
            <span>Model</span>
            <input
              placeholder="WRX STI"
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
              placeholder="KDJ 123A"
              value={vehicleForm.registrationNumber}
              onChange={(event) =>
                setVehicleForm({
                  ...vehicleForm,
                  registrationNumber: event.target.value,
                })
              }
            />
          </label>
          <label>
            <span>Color</span>
            <input
              placeholder="Blue"
              value={vehicleForm.color}
              onChange={(event) => setVehicleForm({ ...vehicleForm, color: event.target.value })}
            />
          </label>
        </div>
        <label>
          <span>Notes</span>
          <textarea
            placeholder="Mechanical context, aftermarket mods, towing considerations."
            value={vehicleForm.notes}
            onChange={(event) => setVehicleForm({ ...vehicleForm, notes: event.target.value })}
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Saving vehicle...' : 'Save vehicle'}
        </button>
      </form>
    );
  }

  function renderRequestPanel() {
    return (
      <form className="subpanel" onSubmit={handleSubmitRoadsideRequest}>
        <div className="subpanel-head">
          <h3>Create roadside request</h3>
          <p>Choose the vehicle, select the issue, capture the location, and dispatch the request.</p>
        </div>
        <label>
          <span>Vehicle</span>
          <select
            value={roadsideForm.vehicleId}
            onChange={(event) =>
              setRoadsideForm({ ...roadsideForm, vehicleId: event.target.value })
            }
          >
            <option value="">Select a saved vehicle</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.nickname} · {vehicle.make} {vehicle.model} · {vehicle.registrationNumber}
              </option>
            ))}
          </select>
        </label>

        {vehicles.length === 0 ? (
          <div className="empty-state">
            Add a vehicle first before creating a roadside request.
          </div>
        ) : null}

        <div className="issue-grid">
          {issueTypes.map((item) => (
            <button
              key={item}
              className={roadsideForm.issueType === item ? 'issue-card-active' : 'issue-card'}
              type="button"
              onClick={() => setRoadsideForm({ ...roadsideForm, issueType: item })}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="form-grid">
          <label>
            <span>Latitude</span>
            <input
              placeholder="-1.286389"
              value={roadsideForm.latitude}
              onChange={(event) =>
                setRoadsideForm({ ...roadsideForm, latitude: event.target.value })
              }
            />
          </label>
          <label>
            <span>Longitude</span>
            <input
              placeholder="36.817223"
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

        <label>
          <span>Street address</span>
          <input
            placeholder="Mombasa Road near Sameer Business Park"
            value={roadsideForm.address}
            onChange={(event) => setRoadsideForm({ ...roadsideForm, address: event.target.value })}
          />
        </label>

        <label>
          <span>Nearest landmark</span>
          <input
            placeholder="Opposite the Shell station"
            value={roadsideForm.landmark}
            onChange={(event) =>
              setRoadsideForm({ ...roadsideForm, landmark: event.target.value })
            }
          />
        </label>

        <label>
          <span>Incident notes</span>
          <textarea
            placeholder="Battery is dead after parking overnight. Hazard lights are on."
            value={roadsideForm.notes}
            onChange={(event) => setRoadsideForm({ ...roadsideForm, notes: event.target.value })}
          />
        </label>

        <button type="submit" disabled={loading || vehicles.length === 0}>
          {loading ? 'Submitting request...' : 'Submit roadside request'}
        </button>
      </form>
    );
  }

  function renderHistoryPanel() {
    if (requests.length === 0) {
      return (
        <div className="subpanel">
          <div className="subpanel-head">
            <h3>Active requests</h3>
            <p>No roadside requests yet. Create one from the Request Help tab.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="subpanel">
        <div className="subpanel-head">
          <h3>Active requests</h3>
          <p>These are the roadside incidents currently captured for this session.</p>
        </div>
        <div className="history-list">
          {requests.map((item) => (
            <article className="history-card" key={item.id}>
              <div className="history-row">
                <strong>{item.issueType}</strong>
                <span className="pill">{item.status.replace('_', ' ')}</span>
              </div>
              <p>{item.address}</p>
              <div className="history-meta">
                <span>ETA {item.etaMinutes} min</span>
                <span>KES {item.estimatedPriceKsh}</span>
                <span>{new Date(item.createdAt).toLocaleString()}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    );
  }

  return (
    <main className="shell">
      <section className="layout">
        <aside className="hero-panel">
          <p className="eyebrow">VIS Assist</p>
          <h1>One auth step at a time.</h1>
          <p className="lede">
            Sign in, verify OTP, save a vehicle, then dispatch the first roadside assistance request
            from a single driver dashboard.
          </p>
          <div className="status-card">
            <span className={`dot ${health?.status === 'ok' ? 'live' : 'down'}`} />
            <div>
              <strong>{health?.service ?? 'vis-assist-api'}</strong>
              <p>
                {health?.status === 'ok' ? `Healthy at ${health.timestamp}` : 'API unavailable'}
              </p>
            </div>
          </div>
          <div className="stepper">
            {authSteps.map((item, index) => (
              <div
                key={item}
                className={`step-item ${
                  authSteps.indexOf(step) >= index ? 'step-item-active' : ''
                }`}
              >
                <span>{index + 1}</span>
                <div>
                  <strong>
                    {item === 'entry' ? 'Credentials' : item === 'otp' ? 'OTP' : 'Dashboard'}
                  </strong>
                  <p>
                    {item === 'entry'
                      ? 'Register or sign in'
                      : item === 'otp'
                        ? 'Confirm one-time code'
                        : 'Vehicles and roadside help'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </aside>

        <section className="flow-panel">
          {step !== 'dashboard' ? (
            <div className="flow-switch">
              <button
                className={mode === 'login' ? 'switch-active' : 'switch-idle'}
                type="button"
                onClick={() => resetFlow('login')}
              >
                Log in
              </button>
              <button
                className={mode === 'register' ? 'switch-active' : 'switch-idle'}
                type="button"
                onClick={() => resetFlow('register')}
              >
                Register
              </button>
            </div>
          ) : null}

          <div className="status-line">{message}</div>

          {step === 'entry' ? renderEntryPanel() : null}
          {step === 'otp' ? renderOtpPanel() : null}
          {step === 'dashboard' ? renderDashboardHome() : null}
        </section>
      </section>
    </main>
  );
}
