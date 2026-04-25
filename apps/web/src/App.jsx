import { AppProvider, useApp } from './context/AppContext';
import AuthPanel from './features/auth/AuthPanel';
import CustomerDashboard from './features/customer/CustomerDashboard';
import ProviderDashboard from './features/provider/ProviderDashboard';
import ToastViewport from './features/shared/runtime/ToastViewport';
import VisLandingPage from './VisLandingPage';

function AppShell() {
  const {
    step,
    user,
    token,
    theme,
    toggleTheme,
    openLogin,
    openRegister,
    openDashboard,
    signOut,
    health,
    toasts,
    dismissToast,
  } =
    useApp();

  let content = null;

  if (step === 'dashboard' && user) {
    content = user.accountType === 'provider' ? <ProviderDashboard /> : <CustomerDashboard />;
  } else if (step === 'auth' || step === 'otp' || step === 'forgot' || step === 'reset' || step === 'service-selection' || step === 'add-vehicle') {
    content = (
      <section className="auth-page">
        <AuthPanel />
      </section>
    );
  } else {
    content = (
      <div className="entry-layout landing-entry">
        <VisLandingPage
          isLoggedIn={Boolean(token && user)}
          user={user}
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenLogin={openLogin}
          onOpenRegister={openRegister}
          onOpenDashboard={() => openDashboard()}
          onOpenProfile={() => openDashboard('profile')}
          onSignOut={signOut}
          health={health}
        />
      </div>
    );
  }

  return (
    <>
      {content}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <main className="app-shell">
        <AppShell />
      </main>
    </AppProvider>
  );
}
