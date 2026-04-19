import { createContext, useContext, useEffect, useState } from 'react';
import {
  SESSION_STORAGE_KEY,
  THEME_STORAGE_KEY,
  PROFILE_STORAGE_KEY,
} from '../shared/constants';
import { getDefaultProfile, mergeUniqueList, request } from '../shared/helpers';

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
  const [authIntent, setAuthIntent] = useState({ mode: 'login', accountType: 'customer' });

  useEffect(() => {
    fetch(`http://localhost:4000/health`)
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
        setProfileSettings((current) => ({
          ...getDefaultProfile(null),
          ...current,
          ...parsedProfile,
          account: {
            ...getDefaultProfile(null).account,
            ...current.account,
            ...parsedProfile.account,
          },
          notifications: {
            ...getDefaultProfile(null).notifications,
            ...current.notifications,
            ...parsedProfile.notifications,
          },
          preferences: {
            ...getDefaultProfile(null).preferences,
            ...current.preferences,
            ...parsedProfile.preferences,
          },
          subscription: {
            ...getDefaultProfile(null).subscription,
            ...current.subscription,
            ...parsedProfile.subscription,
          },
          business: {
            ...getDefaultProfile(null).business,
            ...current.business,
            ...parsedProfile.business,
            kyc: {
              ...getDefaultProfile(null).business.kyc,
              ...current.business?.kyc,
              ...parsedProfile.business?.kyc,
            },
            contacts: {
              ...getDefaultProfile(null).business.contacts,
              ...current.business?.contacts,
              ...parsedProfile.business?.contacts,
            },
            locations:
              parsedProfile.business?.locations?.length > 0
                ? parsedProfile.business.locations
                : current.business?.locations || getDefaultProfile(null).business.locations,
            offeredServices: mergeUniqueList(
              getDefaultProfile(null).business.offeredServices,
              parsedProfile.business?.offeredServices || current.business?.offeredServices,
            ),
            supportedVehicleTypes: mergeUniqueList(
              getDefaultProfile(null).business.supportedVehicleTypes,
              parsedProfile.business?.supportedVehicleTypes || current.business?.supportedVehicleTypes,
            ),
          },
          vendors: {
            ...getDefaultProfile(null).vendors,
            ...current.vendors,
            ...parsedProfile.vendors,
          },
        }));
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
          fetch(`http://localhost:4000/auth/refresh`, { method: 'POST', credentials: 'include' })
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
    setProfileSettings((current) => ({
      ...current,
      account: {
        ...current.account,
        displayName: current.account.displayName || user.name || '',
        email: current.account.email || user.email || '',
        phone: current.account.phone || user.phone || '',
        company: current.account.company || (user.accountType === 'provider' ? user.name || '' : ''),
      },
      subscription: {
        ...current.subscription,
        plan: current.subscription.plan || (user.accountType === 'provider' ? 'Provider Starter' : 'Driver Starter'),
        billingEmail: current.subscription.billingEmail || user.email || '',
      },
      preferences: {
        ...current.preferences,
        theme,
      },
    }));
  }, [theme, user]);

  function signOut() {
    setToken('');
    setUser(null);
    setDashboardTab('overview');
    setMessage('');
    setStep('entry');
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    // Clear the httpOnly refresh token cookie on the server
    fetch('http://localhost:4000/auth/logout', { method: 'POST', credentials: 'include' }).catch(
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

  function handleSaveProfile(event) {
    event.preventDefault();
    setMessage('Profile settings saved locally for this MVP session.');
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
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
