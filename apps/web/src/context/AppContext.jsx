import { createContext, useContext, useEffect, useState } from 'react';
import {
  SESSION_STORAGE_KEY,
  THEME_STORAGE_KEY,
  PROFILE_STORAGE_KEY,
} from '../shared/constants';
import { getApiUrl, getDefaultProfile, mergeProfileSettings, request } from '../shared/helpers';

const AppContext = createContext(null);
let toastCounter = 0;

export function AppProvider({ children }) {
  const [health, setHealth] = useState(null);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [theme, setTheme] = useState('dark');
  const [step, setStep] = useState('entry');
  const [dashboardTab, setDashboardTab] = useState('overview');
  const [message, setMessage] = useState('');
  const [toasts, setToasts] = useState([]);
  const [sessionReady, setSessionReady] = useState(false);
  const [profileSettings, setProfileSettings] = useState(() => ({
    ...getDefaultProfile(null),
  }));
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [authIntent, setAuthIntent] = useState({ mode: 'login', accountType: 'customer' });

  function isProfileSyncUnavailable(error) {
    const message = String(error?.message || '');
    return (
      error?.status === 404 ||
      message.includes('Cannot GET /users/me/profile') ||
      message.includes('Cannot PATCH /users/me/profile')
    );
  }

  useEffect(() => {
    fetch(getApiUrl('/health'))
      .then((res) => res.json())
      .then((data) => setHealth(data))
      .catch(() => setHealth({ status: 'offline', service: 'vis-assist-api' }));
  }, []);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    const storedProfile = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    const storedSession = window.localStorage.getItem(SESSION_STORAGE_KEY);

    if (storedTheme === 'light' || storedTheme === 'dark') {
      setTheme(storedTheme);
    }

    if (storedProfile) {
      try {
        const parsedProfile = JSON.parse(storedProfile);
        setProfileSettings((current) => mergeProfileSettings(null, current, parsedProfile));
      } catch {
        window.localStorage.removeItem(PROFILE_STORAGE_KEY);
      }
    }

    if (storedSession) {
      try {
        const parsed = JSON.parse(storedSession);
        if (parsed.user) {
          // Restore non-sensitive session state immediately so UI renders correctly
          setUser(parsed.user);
          setStep(parsed.step ?? 'dashboard');
          setDashboardTab(parsed.dashboardTab ?? 'overview');

          // Recover the access token from the httpOnly refresh cookie — no JWT in localStorage
          fetch(getApiUrl('/auth/refresh'), { method: 'POST', credentials: 'include' })
            .then((res) => (res.ok ? res.json() : Promise.reject()))
            .then((data) => {
              setToken(data.accessToken);
              if (data.user) setUser(data.user);
            })
            .catch(() => {
              // Refresh token expired or missing — require re-login
              setUser(null);
              setStep('entry');
              window.localStorage.removeItem(SESSION_STORAGE_KEY);
            })
            .finally(() => setSessionReady(true));

          return;
        }
      } catch {
        window.localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    }

    setSessionReady(true);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    if (sessionReady) {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  }, [sessionReady, theme]);

  useEffect(() => {
    if (!sessionReady) return;
    if (user) {
      // Store only non-sensitive data — the JWT never touches localStorage
      window.localStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({ user, step, dashboardTab }),
      );
    } else {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, [dashboardTab, sessionReady, step, user]);

  useEffect(() => {
    if (!sessionReady) return;
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profileSettings));
  }, [profileSettings, sessionReady]);

  useEffect(() => {
    if (!user) return;
    setProfileSettings((current) => mergeProfileSettings(user, current, { preferences: { theme } }));
  }, [theme, user]);

  useEffect(() => {
    if (!sessionReady || !token || !user) return;
    void loadRemoteProfile(token, user);
  }, [sessionReady, token, user?.id]);

  function signOut() {
    setToken('');
    setUser(null);
    setDashboardTab('overview');
    setMessage('');
    setStep('entry');
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    window.localStorage.removeItem(PROFILE_STORAGE_KEY);
    // Clear the httpOnly refresh token cookie on the server
    fetch(getApiUrl('/auth/logout'), { method: 'POST', credentials: 'include' }).catch(
      () => {},
    );
  }

  function openDashboard(tab = 'overview') {
    setDashboardTab(tab);
    setStep('dashboard');
    setMessage('');
  }

  function openLogin() {
    setAuthIntent({ mode: 'login', accountType: 'customer' });
    setStep('auth');
  }

  function openRegister(accountType = 'customer') {
    setAuthIntent({ mode: 'register', accountType });
    setStep('auth');
  }

  function toggleTheme() {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    setProfileSettings((current) => ({
      ...current,
      preferences: { ...current.preferences, theme: nextTheme },
    }));
  }

  function handleProfileFieldChange(section, field, value) {
    setProfileSettings((current) => ({
      ...current,
      [section]: { ...current[section], [field]: value },
    }));
  }

  function handleBusinessNestedFieldChange(group, field, value) {
    setProfileSettings((current) => ({
      ...current,
      business: {
        ...current.business,
        [group]: { ...current.business[group], [field]: value },
      },
    }));
  }

  function toggleBusinessListField(field, value) {
    setProfileSettings((current) => {
      const existing = current.business[field] || [];
      const nextValues = existing.includes(value)
        ? existing.filter((item) => item !== value)
        : [...existing, value];
      return { ...current, business: { ...current.business, [field]: nextValues } };
    });
  }

  function addBusinessLocation() {
    setProfileSettings((current) => ({
      ...current,
      business: {
        ...current.business,
        locations: [
          ...(current.business.locations || []),
          {
            branchName: 'Satellite Branch',
            address: '',
            countryCode: 'KE',
            town: '',
            road: '',
            landmark: '',
            mapUrl: '',
            latitude: '',
            longitude: '',
          },
        ],
      },
    }));
  }

  function updateBusinessLocation(index, field, value) {
    setProfileSettings((current) => ({
      ...current,
      business: {
        ...current.business,
        locations: (current.business.locations || []).map((location, position) =>
          position === index ? { ...location, [field]: value } : location,
        ),
      },
    }));
  }

  function removeBusinessLocation(index) {
    setProfileSettings((current) => {
      const locations = current.business.locations || [];
      if (locations.length <= 1) return current;
      return {
        ...current,
        business: {
          ...current.business,
          locations: locations.filter((_, position) => position !== index),
        },
      };
    });
  }

  function handlePreferenceThemeChange(nextTheme) {
    setTheme(nextTheme);
    handleProfileFieldChange('preferences', 'theme', nextTheme);
  }

  async function loadRemoteProfile(accessToken, currentUser = user) {
    setProfileLoading(true);
    try {
      const data = await request('/users/me/profile', undefined, 'GET', accessToken);
      const apiUser = data?.user || currentUser;
      if (apiUser) setUser(apiUser);
      setProfileSettings((current) =>
        mergeProfileSettings(apiUser || currentUser, current, data?.profile || {}),
      );
    } catch (error) {
      if (isProfileSyncUnavailable(error)) {
        return;
      }
      addToast({
        type: 'error',
        title: 'Profile sync failed',
        message: error.message || 'Unable to load profile from the API.',
      });
    } finally {
      setProfileLoading(false);
    }
  }

  async function handleSaveProfile(event) {
    event?.preventDefault?.();
    if (!token || !user) {
      setMessage('You must be signed in to save your profile.');
      return;
    }

    setProfileSaving(true);
    try {
      const payload = {
        name: profileSettings.account.displayName || user.name || '',
        email: profileSettings.account.email || user.email || '',
        phone:
          profileSettings.business?.contacts?.primaryPhone ||
          profileSettings.account.phone ||
          user.phone ||
          '',
        profile: profileSettings,
      };
      const data = await request('/users/me/profile', payload, 'PATCH', token);
      setUser(data.user);
      setProfileSettings((current) => mergeProfileSettings(data.user, current, data.profile));
      setMessage('Profile synced to the API.');
      addToast({
        type: 'success',
        title: 'Profile saved',
        message: 'Profile changes were synced successfully.',
      });
    } catch (error) {
      if (isProfileSyncUnavailable(error)) {
        setMessage('Profile saved locally. Restart or update the API to enable profile sync.');
        addToast({
          type: 'info',
          title: 'Saved locally',
          message: 'Profile sync endpoint is unavailable, so changes were stored locally for now.',
        });
        return;
      }
      setMessage(error.message || 'Unable to save profile.');
      addToast({
        type: 'error',
        title: 'Profile save failed',
        message: error.message || 'Unable to save profile.',
      });
    } finally {
      setProfileSaving(false);
    }
  }

  async function handlePasswordReset(passwordForm) {
    if (!token) {
      setMessage('You must be signed in to change your password.');
      return false;
    }

    setPasswordSaving(true);
    try {
      await request('/users/me/password', passwordForm, 'POST', token);
      setMessage('Password updated successfully.');
      addToast({
        type: 'success',
        title: 'Password updated',
        message: 'Your password has been changed.',
      });
      return true;
    } catch (error) {
      if (error?.status === 404 || String(error?.message || '').includes('Cannot POST /users/me/password')) {
        setMessage('Password change is not available on the current API build yet.');
        addToast({
          type: 'info',
          title: 'Password API unavailable',
          message: 'The current backend does not expose password change yet.',
        });
        return false;
      }
      setMessage(error.message || 'Unable to update password.');
      addToast({
        type: 'error',
        title: 'Password update failed',
        message: error.message || 'Unable to update password.',
      });
      return false;
    } finally {
      setPasswordSaving(false);
    }
  }

  function dismissToast(toastId) {
    setToasts((current) => current.filter((toast) => toast.id !== toastId));
  }

  function addToast(input) {
    const toast = typeof input === 'string' ? { message: input } : input;
    const id = `toast-${Date.now()}-${toastCounter++}`;
    setToasts((current) => [...current, { type: 'info', title: 'Notice', ...toast, id }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, toast.durationMs || 4200);
  }

  const value = {
    health,
    user,
    setUser,
    token,
    setToken,
    theme,
    setTheme,
    step,
    setStep,
    dashboardTab,
    setDashboardTab,
    message,
    setMessage,
    toasts,
    addToast,
    dismissToast,
    sessionReady,
    profileSettings,
    setProfileSettings,
    profileSaving,
    profileLoading,
    passwordSaving,
    authIntent,
    signOut,
    openDashboard,
    openLogin,
    openRegister,
    toggleTheme,
    handleProfileFieldChange,
    handleBusinessNestedFieldChange,
    toggleBusinessListField,
    addBusinessLocation,
    updateBusinessLocation,
    removeBusinessLocation,
    handlePreferenceThemeChange,
    handleSaveProfile,
    handlePasswordReset,
    loadRemoteProfile,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
