import { AppProvider, useApp } from './context/AppContext';
import AuthPanel from './features/auth/AuthPanel';
import CustomerDashboard from './features/customer/CustomerDashboard';
import ProviderDashboard from './features/provider/ProviderDashboard';
import VisLandingPage from './VisLandingPage';

function AppShell() {
  const { step, user, token, theme, toggleTheme, openLogin, openRegister, openDashboard, signOut, health } =
    useApp();

  if (step === 'dashboard' && user) {
    return user.accountType === 'provider' ? <ProviderDashboard /> : <CustomerDashboard />;
  }

  if (step === 'auth' || step === 'otp') {
    return (
      <section className="auth-page">
        <AuthPanel />
      </section>
    );
  }

  return (
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

export default function App() {
  return (
    <AppProvider>
      <main className="app-shell">
        <AppShell />
      </main>
    </AppProvider>
  );
}
