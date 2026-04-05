import { useState } from 'react';
import {
  Apple,
  ArrowRight,
  Menu,
  Moon,
  Play,
  Shield,
  Smartphone,
  Sun,
  User,
  X,
} from 'lucide-react';

const navItems = [
  { label: 'Offerings', href: '#offerings' },
  { label: 'AI Layer', href: '#ai-layer' },
  { label: 'Who We Serve', href: '#audiences' },
  { label: 'Contact', href: '#contact' },
];

const offerings = [
  {
    title: 'Roadside Assistance',
    text: 'Tow, battery jump, fuel delivery, and emergency help when drivers are stuck.',
    icon: '🚨',
  },
  {
    title: 'Vehicle Intelligence',
    text: 'AI-powered alerts for fuel use, maintenance timing, and unusual vehicle behavior.',
    icon: '🧠',
  },
  {
    title: 'Service History',
    text: 'A digital record of repairs, parts replacement, and garage visits in one place.',
    icon: '📘',
  },
  {
    title: 'Garage Network',
    text: 'Verified garages can receive jobs, manage customers, and build trust with reviews.',
    icon: '🛠️',
  },
  {
    title: 'Parts Discovery',
    text: 'Search for hard-to-find parts and connect owners with trusted suppliers faster.',
    icon: '🔩',
  },
  {
    title: 'Valuation & Insurance Data',
    text: 'Better vehicle records for more accurate valuation, inspection, and underwriting.',
    icon: '📊',
  },
];

const audiences = [
  {
    title: 'Car Owners',
    points: ['Get help fast', 'Track repairs', 'Avoid hidden issues'],
  },
  {
    title: 'Garages',
    points: ['Receive more jobs', 'Keep digital records', 'Build reputation'],
  },
  {
    title: 'Insurance Teams',
    points: ['See better data', 'Reduce uncertainty', 'Assess risk faster'],
  },
  {
    title: 'Valuers',
    points: ['Verify history', 'Price condition better', 'Support fair resale value'],
  },
];

const aiSignals = [
  'Fuel consumption is up - possible misfire or clogging',
  'AWD/Haldex service may be due soon',
  'Battery health dropping below normal range',
  'Recent driving pattern suggests increased wear risk',
];

const steps = [
  {
    step: '01',
    title: 'Connect the vehicle',
    text: 'Start with the car profile, service records, and live request flow.',
  },
  {
    step: '02',
    title: 'Capture activity',
    text: 'Store repairs, parts, roadside requests, and condition data over time.',
  },
  {
    step: '03',
    title: 'Turn data into action',
    text: 'Use VIS AI to warn, recommend, route, and support every platform user.',
  },
];

const downloadLinks = [
  {
    title: 'Download for Android',
    subtitle: 'Get VIS Auto on Google Play',
    badge: 'Android',
    icon: Play,
  },
  {
    title: 'Download for iPhone',
    subtitle: 'Get VIS Auto on the App Store',
    badge: 'iOS',
    icon: Apple,
  },
];

export default function VisLandingPage({
  isLoggedIn,
  user,
  theme,
  onToggleTheme,
  onOpenLogin,
  onOpenRegister,
  onOpenDashboard,
  onOpenProfile,
  onSignOut,
  health,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
    setAccountMenuOpen(false);
  }

  function handleRegister(accountType = 'customer') {
    closeMenu();
    onOpenRegister(accountType);
  }

  function handleLogin() {
    closeMenu();
    onOpenLogin();
  }

  function handleDashboard() {
    closeMenu();
    onOpenDashboard();
  }

  function handleProfile() {
    closeMenu();
    onOpenProfile();
  }

  function handleSignOut() {
    closeMenu();
    onSignOut();
  }

  return (
    <section className="landing-shell vis-landing-page" id="top">
      <header className="vis-header">
        <a href="#top" className="vis-brand" onClick={closeMenu}>
          <div className="vis-brand-mark">
            <span>VIS</span>
          </div>
          <div className="vis-brand-copy">
            <strong>VIS Auto</strong>
            <span>Connected vehicle intelligence</span>
          </div>
        </a>

        <nav className="vis-nav">
          {navItems.map((item, index) => (
            <a
              key={item.label}
              href={item.href}
              className="vis-nav-link"
              style={{ transitionDelay: `${index * 50}ms` }}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="vis-header-actions">
          <button
            type="button"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={onToggleTheme}
            className="icon-button"
          >
            {theme === 'dark' ? <Sun /> : <Moon />}
          </button>
          {isLoggedIn ? (
            <div className="vis-landing-account-wrap">
              <button
                type="button"
                aria-label="Open account menu"
                className="icon-button vis-user-menu-button"
                onClick={() => {
                  setAccountMenuOpen((current) => !current);
                  setMenuOpen(false);
                }}
              >
                <User />
              </button>
              {accountMenuOpen ? (
                <div className="dropdown-menu vis-landing-account-menu">
                  <div className="dropdown-head">
                    <strong>{user?.name || 'Account'}</strong>
                    <span>{user?.email || ''}</span>
                  </div>
                  <button type="button" onClick={handleDashboard}>
                    Dashboard
                  </button>
                  <button type="button" onClick={handleProfile}>
                    Profile
                  </button>
                  <button type="button" onClick={handleSignOut}>
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <>
              <button type="button" onClick={handleLogin} className="secondary-cta vis-inline-action">
                Login
              </button>
              <button
                type="button"
                onClick={() => handleRegister('customer')}
                className="primary-cta vis-inline-action"
              >
                Register
              </button>
            </>
          )}
          <button
            type="button"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="icon-button vis-menu-button"
            onClick={() => setMenuOpen((current) => !current)}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      {menuOpen ? (
        <div className="vis-mobile-menu">
          <nav className="vis-mobile-nav">
            {navItems.map((item) => (
              <a key={item.label} href={item.href} className="vis-mobile-link" onClick={closeMenu}>
                {item.label}
              </a>
            ))}
          </nav>
          <div className="vis-mobile-actions">
            <button type="button" onClick={onToggleTheme} className="secondary-cta">
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </button>
            {isLoggedIn ? (
              <button type="button" onClick={handleDashboard} className="primary-cta">
                Dashboard
              </button>
            ) : (
              <>
                <button type="button" onClick={handleLogin} className="secondary-cta">
                  Login
                </button>
                <button type="button" onClick={() => handleRegister('provider')} className="primary-cta">
                  Request demo
                </button>
              </>
            )}
            {isLoggedIn ? (
              <>
                <button type="button" onClick={handleProfile} className="secondary-cta">
                  Profile
                </button>
                <button type="button" onClick={handleSignOut} className="ghost-button">
                  Logout
                </button>
              </>
            ) : (
              <></>
            )}
          </div>
        </div>
      ) : null}

      <section className="vis-hero" aria-labelledby="vis-hero-title">
        <div className="vis-hero-copy">
          <div className="mini-pill">VIS AI powered vehicle intelligence</div>
          <h1 id="vis-hero-title">Your car, connected. Your journey, protected.</h1>
          <p className="landing-copy">
            VIS Auto brings roadside help, vehicle history, garage services, parts access, and
            intelligent insights into one modern platform for Africa.
          </p>
          <div className="cta-row">
            <a href="#offerings" className="primary-cta">
              Explore VIS <ArrowRight />
            </a>
            <button type="button" onClick={() => handleRegister('customer')} className="secondary-cta">
              Register
            </button>
            <button type="button" onClick={handleLogin} className="ghost-button">
              Log in
            </button>
          </div>
          <div className="vis-chip-row">
            {['Roadside support', 'Garage network', 'AI alerts'].map((item) => (
              <div key={item} className="vis-chip">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="vis-hero-panel">
          <div className="vis-hero-console">
            <div className="vis-hero-console-head">
              <div className="vis-hero-avatar">
                <Shield />
              </div>
              <div className="status-pill">
                <span className={`dot ${health?.status === 'ok' ? 'live' : ''}`} />
                {health?.status === 'ok' ? 'API live' : 'API offline'}
              </div>
            </div>

            <p className="vis-hero-greeting">
              Good morning, <span>driver</span>
            </p>
            <h2>How can VIS help?</h2>

            <div className="vis-hero-fields">
              <div className="vis-hero-field">What&apos;s your location</div>
              <div className="vis-hero-field">Select your problem</div>
              <button type="button" onClick={() => handleRegister('customer')} className="vis-hero-button">
                Search for help
              </button>
            </div>
          </div>

          <div className="vis-hero-service">
            <div className="vis-hero-service-head">
              <h3>Nearest service point</h3>
              <span>⌕</span>
            </div>
            <div className="vis-hero-service-card">
              <p>Gear Up Automobiles</p>
              <span>1.2 km away - Available now</span>
              <div className="cta-row">
                <button type="button" onClick={() => handleRegister('provider')} className="secondary-cta">
                  Request
                </button>
                <button type="button" className="ghost-button">
                  Call
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="downloads" className="vis-section-block">
        <div className="vis-section-head">
          <div>
            <p className="eyebrow">Mobile app</p>
            <h2 className="vis-section-title">Download VIS Auto for Android and iPhone.</h2>
            <p className="vis-section-copy">
              Access roadside help, vehicle records, smart alerts, and service support from anywhere.
            </p>
          </div>
        </div>
        <div className="module-grid vis-download-grid">
          {downloadLinks.map((item) => {
            const Icon = item.icon;
            return (
              <a key={item.title} href="#top" className="module-card vis-download-card">
                <div className="mini-pill">
                  <Icon />
                  {item.badge}
                </div>
                <strong>{item.title}</strong>
                <p>{item.subtitle}</p>
                <span className="vis-download-link">
                  Download now <ArrowRight />
                </span>
              </a>
            );
          })}
        </div>
      </section>

      <section id="offerings" className="vis-section-block">
        <div className="vis-section-head">
          <div>
            <p className="eyebrow">Product offerings</p>
            <h2 className="vis-section-title">One platform. Multiple services. Built to work together.</h2>
            <p className="vis-section-copy">
              Start with the services people need most today, then grow into a connected vehicle
              ecosystem.
            </p>
          </div>
        </div>
        <div className="module-grid">
          {offerings.map((item) => (
            <article className="module-card vis-offering-card" key={item.title}>
              <div className="vis-offering-icon">{item.icon}</div>
              <strong>{item.title}</strong>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="ai-layer" className="vis-ai-section">
        <div className="vis-ai-grid">
          <div>
            <p className="eyebrow vis-ai-eyebrow">AI intelligence layer</p>
            <h2 className="vis-section-title vis-ai-title">
              The intelligence layer that supports every user on the platform.
            </h2>
            <p className="vis-section-copy vis-ai-copy">
              VIS AI turns vehicle data, service records, and usage patterns into timely warnings,
              smarter decisions, and better support for owners, garages, insurers, and valuers.
            </p>
            <div className="module-grid vis-signal-grid">
              {aiSignals.map((signal) => (
                <div key={signal} className="module-card vis-signal-card">
                  {signal}
                </div>
              ))}
            </div>
          </div>
          <div className="vis-dark-panel">
            <div className="vis-alert-card">
              <div className="vis-alert-head">
                <p>VIS AI Alert</p>
                <span className="mini-pill">Active</span>
              </div>
              <div className="vis-alert-hero">
                <p className="vis-alert-label">Fuel trend anomaly</p>
                <h3>Fuel use is up 18% this week</h3>
                <p>
                  Likely causes include misfire, injector dirt, or a clogged air intake. Book
                  inspection or send to garage.
                </p>
              </div>
              <div className="vis-alert-actions">
                {['Book inspection', 'Share with garage', 'Save to vehicle history'].map((action) => (
                  <div key={action} className="vis-alert-action">
                    {action}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="audiences" className="vis-section-block">
        <div className="vis-section-head">
          <div>
            <p className="eyebrow">Who VIS is for</p>
            <h2 className="vis-section-title">Clear value for every part of the automotive ecosystem.</h2>
            <p className="vis-section-copy">
              VIS is designed to solve real operational gaps without overwhelming users with complexity.
            </p>
          </div>
        </div>
        <div className="module-grid">
          {audiences.map((group) => (
            <article key={group.title} className="module-card vis-audience-card">
              <strong>{group.title}</strong>
              <div className="vis-audience-points">
                {group.points.map((point) => (
                  <div key={point} className="vis-audience-point">
                    <span>✓</span>
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="vis-gap-section">
        <div>
          <p className="eyebrow">Why VIS</p>
          <h2 className="vis-section-title">Built around the gaps that current vehicle ownership systems leave behind.</h2>
        </div>
        <div className="module-grid vis-gap-grid">
          {[
            'No trusted vehicle history',
            'Roadside support is fragmented',
            'Garages rarely keep digital records',
            'Insurance and valuation data is incomplete',
          ].map((pain) => (
            <div key={pain} className="module-card vis-gap-card">
              {pain}
            </div>
          ))}
        </div>
        <div className="vis-gap-banner">
          <p>
            VIS connects breakdown support, service history, parts access, valuation signals, and AI
            insights into one system that helps people act earlier, price better, and operate with more
            confidence.
          </p>
        </div>
      </section>

      <section className="vis-section-block">
        <div className="module-grid vis-steps-grid">
          {steps.map((item) => (
            <article key={item.step} className="module-card vis-step-card">
              <span className="vis-step-number">{item.step}</span>
              <strong>{item.title}</strong>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="contact" className="vis-cta-section">
        <div className="vis-cta-copy">
          <p className="eyebrow">Start with the landing page. Grow into the platform.</p>
          <h2 className="vis-section-title">
            Launch VIS Auto with a strong story today, then expand feature by feature.
          </h2>
          <p className="vis-section-copy">
            Use this page to attract early users, garages, partners, and insurers while the product grows
            underneath.
          </p>
        </div>
        <div className="cta-row vis-cta-actions">
          <button type="button" onClick={() => handleRegister('provider')} className="primary-cta">
            Request demo
          </button>
          <button type="button" onClick={() => handleRegister('provider')} className="secondary-cta">
            Join as partner
          </button>
        </div>
      </section>

      <footer className="vis-footer">
        <div className="vis-footer-top">
          <div className="vis-footer-brand">
            <div className="vis-brand-mark vis-brand-mark-small">
              <span>VIS</span>
            </div>
            <div>
              <strong>VIS Auto</strong>
              <span>Connected vehicle intelligence</span>
            </div>
          </div>
          <p>
            Roadside support, garage operations, and vehicle intelligence in one platform.
          </p>
        </div>
        <div className="vis-footer-grid">
          <div>
            <h3>Platform</h3>
            <div className="vis-footer-links">
              {['Roadside Assistance', 'Vehicle Intelligence', 'Garage Network'].map((item) => (
                <a key={item} href="#offerings">
                  {item}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3>Company</h3>
            <div className="vis-footer-links">
              {['About VIS', 'Contact', 'Privacy'].map((item) => (
                <a key={item} href="#contact">
                  {item}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3>Get the app</h3>
            <div className="vis-footer-links">
              {downloadLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <a key={item.title} href="#downloads" className="vis-footer-download">
                    <Icon />
                    <span>{item.badge}</span>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
        <div className="vis-footer-bar">
          <p>© 2026 VIS Auto. All rights reserved.</p>
          <p>Built for smarter vehicle ownership.</p>
        </div>
      </footer>
    </section>
  );
}