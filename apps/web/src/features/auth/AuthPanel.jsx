import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { request } from '../../shared/helpers';
import { initialRegister, initialLogin, initialVerify } from '../../shared/constants';
import RegisterForm from './RegisterForm';
import ServiceSelectionPanel from './ServiceSelectionPanel';
import VehicleAddStep from './VehicleAddStep';

export default function AuthPanel() {
  const {
    step, setStep, authIntent,
    setUser, setToken, setDashboardTab,
    message, setMessage,
    resetToken, setResetToken,
    token, user,
  } = useApp();

  const [mode, setMode] = useState(authIntent.mode);
  const [registerForm, setRegisterForm] = useState({ ...initialRegister, accountType: authIntent.accountType });
  const [loginForm, setLoginForm] = useState(initialLogin);
  const [verifyForm, setVerifyForm] = useState(initialVerify);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetForm, setResetForm] = useState({ newPassword: '', confirmPassword: '' });
  const [devOtp, setDevOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
  const [pendingToken, setPendingToken] = useState('');

  useEffect(() => {
    setMode(authIntent.mode);
    setRegisterForm((c) => ({ ...c, accountType: authIntent.accountType }));
  }, [authIntent]);

  useEffect(() => {
    if (step !== 'otp') return;
    setResendCooldown(90);
  }, [step]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  function resetFlow(nextMode = 'login') {
    setMode(nextMode);
    setStep('auth');
    setDevOtp('');
    setVerifyForm(initialVerify);
    setMessage('');
  }

  function onRegisterChange(field, value) {
    setRegisterForm((c) => ({ ...c, [field]: value }));
  }

  async function handleRegister(event) {
    event.preventDefault();
    setLoading(true);
    try {
      const data = await request('/auth/register', registerForm);
      setMode('login');
      setLoginForm({ email: data.user.email, password: registerForm.password });
      setVerifyForm({ email: data.user.email, otp: '' });
      setMessage(`Account ready. Sign in to continue.`);
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
      setDevOtp('');
      if (data.user.accountType === 'provider') {
        setPendingUser(data.user);
        setPendingToken(data.accessToken);
        setStep('service-selection');
      } else {
        setPendingUser(data.user);
        setPendingToken(data.accessToken);
        setStep('add-vehicle');
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResendLoading(true);
    try {
      const data = await request('/auth/resend-otp', { email: verifyForm.email });
      setDevOtp(data.devOtp ?? '');
      setVerifyForm((c) => ({ ...c, otp: '' }));
      setMessage('A new code has been sent.');
      setResendCooldown(90);
    } catch (error) {
      setMessage(error.message || 'Could not resend code.');
    } finally {
      setResendLoading(false);
    }
  }

  async function handleForgotSubmit(event) {
    event.preventDefault();
    setLoading(true);
    try {
      const data = await request('/auth/forgot-password', { email: forgotEmail });
      setMessage(data.message);
    } catch (error) {
      setMessage(error.message || 'Unable to send reset email.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResetSubmit(event) {
    event.preventDefault();
    if (resetForm.newPassword !== resetForm.confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await request('/auth/reset-password', { token: resetToken, newPassword: resetForm.newPassword });
      setResetToken('');
      setStep('auth');
      setMessage('Password updated. You can now sign in.');
    } catch (error) {
      setMessage(error.message || 'Unable to reset password.');
    } finally {
      setLoading(false);
    }
  }

  function completeDashboard(userData, accessToken) {
    setToken(accessToken);
    setUser(userData);
    setDashboardTab('overview');
    setStep('dashboard');
    setMessage(`Signed in as ${userData.email}`);
    setPendingUser(null);
    setPendingToken('');
  }

  if (step === 'service-selection') {
    return (
      <ServiceSelectionPanel
        token={pendingToken}
        user={pendingUser}
        onComplete={() => completeDashboard(pendingUser, pendingToken)}
      />
    );
  }

  if (step === 'add-vehicle') {
    return (
      <VehicleAddStep
        token={pendingToken}
        onComplete={() => completeDashboard(pendingUser, pendingToken)}
        onSkip={() => completeDashboard(pendingUser, pendingToken)}
      />
    );
  }

  if (step === 'forgot') {
    return (
      <form className="auth-shell" onSubmit={handleForgotSubmit}>
        <div className="auth-head">
          <span className="mini-pill">Reset</span>
          <h2>Forgot password</h2>
          <p className="auth-copy">Enter your email and we'll send a reset link.</p>
        </div>
        <label>
          <span>Email</span>
          <input type="email" placeholder="you@example.com" value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)} required />
        </label>
        <button type="submit" disabled={loading}>{loading ? 'Sending...' : 'Send reset link'}</button>
        <button className="ghost-button" type="button" onClick={() => resetFlow('login')}>Back to sign in</button>
        {message ? <div className="status-banner">{message}</div> : null}
      </form>
    );
  }

  if (step === 'reset') {
    return (
      <form className="auth-shell" onSubmit={handleResetSubmit}>
        <div className="auth-head">
          <span className="mini-pill">New password</span>
          <h2>Set your password</h2>
          <p className="auth-copy">Choose a strong password for your account.</p>
        </div>
        <label>
          <span>New password</span>
          <input type="password" placeholder="Min 8 chars — uppercase, number, symbol"
            value={resetForm.newPassword} onChange={(e) => setResetForm({ ...resetForm, newPassword: e.target.value })} required />
        </label>
        <label>
          <span>Confirm password</span>
          <input type="password" placeholder="Repeat your new password"
            value={resetForm.confirmPassword} onChange={(e) => setResetForm({ ...resetForm, confirmPassword: e.target.value })} required />
        </label>
        <button type="submit" disabled={loading}>{loading ? 'Updating...' : 'Update password'}</button>
        {message ? <div className="status-banner">{message}</div> : null}
      </form>
    );
  }

  if (step === 'otp') {
    return (
      <form className="auth-shell" onSubmit={handleVerify}>
        <div className="auth-head">
          <span className="mini-pill">OTP</span>
          <h2>Verify sign in</h2>
          <p className="auth-copy">Enter the code sent to your email.</p>
        </div>
        <label>
          <span>Code</span>
          <input placeholder="A3K9M2" value={verifyForm.otp}
            onChange={(e) => setVerifyForm({ ...verifyForm, otp: e.target.value.toUpperCase() })} />
        </label>
        {devOtp ? <div className="otp-box">Dev OTP: {devOtp}</div> : null}
        <button type="submit" disabled={loading}>{loading ? 'Verifying...' : 'Continue'}</button>
        <button className="ghost-button" type="button" onClick={handleResend}
          disabled={resendCooldown > 0 || resendLoading}>
          {resendLoading ? 'Sending...' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
        </button>
        <button className="ghost-button" type="button" onClick={() => resetFlow('login')}>Back</button>
        {message ? <div className="status-banner">{message}</div> : null}
      </form>
    );
  }

  return (
    <div className="auth-shell" id="auth">
      <div className="auth-tabs">
        <button className={mode === 'login' ? 'switch-active' : 'switch-idle'}
          type="button" onClick={() => setMode('login')}>Log in</button>
        <button className={mode === 'register' ? 'switch-active' : 'switch-idle'}
          type="button" onClick={() => setMode('register')}>Create account</button>
      </div>

      {mode === 'register' ? (
        <RegisterForm form={registerForm} onChange={onRegisterChange}
          onSubmit={handleRegister} loading={loading} message={message} />
      ) : (
        <form className="stack" onSubmit={handleLogin}>
          <div className="auth-head">
            <span className="mini-pill">Access</span>
            <h2>Welcome back</h2>
          </div>
          <label>
            <span>Email</span>
            <input placeholder="you@example.com" type="email" value={loginForm.email}
              onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} />
          </label>
          <label>
            <span>Password</span>
            <input type="password" placeholder="Your password" value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} />
          </label>
          <button type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Log in'}</button>
          <div className="inline-actions">
            <button className="link-button" type="button"
              onClick={() => { setForgotEmail(loginForm.email); setMessage(''); setStep('forgot'); }}>
              Forgot password
            </button>
          </div>
          {message ? <div className="status-banner">{message}</div> : null}
        </form>
      )}

      <div className="social-stack">
        <button className="social-button" type="button"
          onClick={() => setMessage('Google sign-in coming soon.')}>Continue with Google</button>
        <button className="social-button" type="button"
          onClick={() => setMessage('Apple sign-in coming soon.')}>Continue with Apple ID</button>
      </div>

      <button className="ghost-button" type="button" onClick={() => setStep('entry')}>Back to home</button>
    </div>
  );
}
