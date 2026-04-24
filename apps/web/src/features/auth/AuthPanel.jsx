import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { request } from '../../shared/helpers';
import { initialRegister, initialLogin, initialVerify } from '../../shared/constants';

export default function AuthPanel() {
  const {
    step,
    authIntent,
    setUser,
    setToken,
    setStep,
    setDashboardTab,
    message,
    setMessage,
  } = useApp();

  const [mode, setMode] = useState(authIntent.mode);
  const [registerForm, setRegisterForm] = useState({
    ...initialRegister,
    accountType: authIntent.accountType,
  });
  const [loginForm, setLoginForm] = useState(initialLogin);
  const [verifyForm, setVerifyForm] = useState(initialVerify);
  const [devOtp, setDevOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    setMode(authIntent.mode);
    setRegisterForm((current) => ({ ...current, accountType: authIntent.accountType }));
  }, [authIntent]);

  useEffect(() => {
    if (step !== 'otp') return;
    setResendCooldown(30);
  }, [step]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  async function handleResend() {
    setResendLoading(true);
    try {
      const data = await request('/auth/resend-otp', { email: verifyForm.email });
      setDevOtp(data.devOtp ?? '');
      setVerifyForm((current) => ({ ...current, otp: '' }));
      setMessage('A new code has been sent.');
      setResendCooldown(30);
    } catch (error) {
      setMessage(error.message || 'Could not resend code. Please try again.');
    } finally {
      setResendLoading(false);
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    setLoading(true);
    try {
      const data = await request('/auth/register', registerForm);
      setMode('login');
      setLoginForm({ email: data.user.email, password: registerForm.password });
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
      setToken('');
      setUser(null);
      setVerifyForm({ email: loginForm.email, otp: '' });
      setMessage(data.devOtp ? 'OTP sent. Use the code below for local testing.' : 'OTP sent.');
      setStep('otp');
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
      setMessage(`Signed in as ${data.user.email}`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  function handleForgotPassword() {
    setMessage('Forgot password email delivery will be connected next.');
  }

  function handleSocialLogin(provider) {
    setMessage(`${provider} sign-in will be connected after the core auth flow is stable.`);
  }

  function resetFlow(nextMode = 'login') {
    setMode(nextMode);
    setStep('auth');
    setDevOtp('');
    setVerifyForm(initialVerify);
    setMessage('');
  }

  if (step === 'otp') {
    return (
      <form className="auth-shell" id="auth" onSubmit={handleVerify}>
        <div className="auth-head">
          <span className="mini-pill">OTP</span>
          <h2>Verify sign in</h2>
          <p className="auth-copy">Enter the code sent to your email or SMS.</p>
        </div>
        <label>
          <span>Code</span>
          <input
            placeholder="A3K9M2"
            value={verifyForm.otp}
            onChange={(event) => setVerifyForm({ ...verifyForm, otp: event.target.value.toUpperCase() })}
          />
        </label>
        {devOtp ? <div className="otp-box">Dev OTP: {devOtp}</div> : null}
        <button type="submit" disabled={loading}>
          {loading ? 'Verifying...' : 'Continue'}
        </button>
        <button
          className="ghost-button"
          type="button"
          onClick={handleResend}
          disabled={resendCooldown > 0 || resendLoading}
        >
          {resendLoading ? 'Sending...' : resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
        </button>
        <button className="ghost-button" type="button" onClick={() => resetFlow('login')}>
          Back
        </button>
        {message ? <div className="status-banner">{message}</div> : null}
      </form>
    );
  }

  return (
    <div className="auth-shell" id="auth">
      <div className="auth-head">
        <span className="mini-pill">Access</span>
        <h2>{mode === 'register' ? 'Join fast' : 'Welcome back'}</h2>
        <p className="auth-copy">
          {mode === 'register'
            ? 'Create a new VIS Auto account to get started.'
            : 'Use your existing VIS Auto account to continue.'}
        </p>
      </div>

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
              onChange={(event) => setRegisterForm({ ...registerForm, email: event.target.value })}
            />
          </label>
          <label>
            <span>Phone</span>
            <input
              placeholder="+254..."
              value={registerForm.phone}
              onChange={(event) => setRegisterForm({ ...registerForm, phone: event.target.value })}
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
              onChange={(event) => setRegisterForm({ ...registerForm, password: event.target.value })}
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
            {loading ? 'Signing in...' : 'Log in'}
          </button>
          <div className="inline-actions">
            <button className="link-button" type="button" onClick={handleForgotPassword}>
              Forgot password
            </button>
          </div>
        </form>
      )}

      <div className="social-stack">
        <button
          className="social-button"
          type="button"
          onClick={() => handleSocialLogin('Google')}
        >
          Continue with Google
        </button>
        <button
          className="social-button"
          type="button"
          onClick={() => handleSocialLogin('Apple')}
        >
          Continue with Apple ID
        </button>
      </div>

      {message ? <div className="status-banner">{message}</div> : null}

      <button className="ghost-button" type="button" onClick={() => setStep('entry')}>
        Back to home
      </button>
    </div>
  );
}
