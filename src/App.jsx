import React, { useState } from 'react';
import { AppProvider } from './state/AppContext';
import { useApp } from './state/useApp';
import OnboardingSetup from './components/OnboardingSetup';
import RiskDisplay from './components/RiskDisplay';
import CheckInPrompt from './components/CheckInPrompt';
import JourneyShare from './components/JourneyShare';
import SimulationPanel from './components/SimulationPanel';
import SOSButton from './components/SOSButton';
import './App.css';

function MainAppContent() {
  const {
    mode,
    safeWord,
    trustedCircle,
    familiarPlaces,
    timeSignal,
    batterySignal,
    geoSignals,
    setShowSettingsModal,
    resetToSafeBaseline,
    updateSignals
  } = useApp();

  const [activeTab, setActiveTab] = useState('shield'); // 'shield' | 'journey' | 'circle' | 'telemetry'
  const [showQuickPresets, setShowQuickPresets] = useState(false);

  // Quick preset scenarios for instant judge testing anywhere in the app
  const DEMO_PRESETS = [
    { label: 'Safe Baseline', icon: '🟢', values: { pace: 'normal', stillnessSeconds: 0, crowdDensity: 'large', routeFamiliarity: 'familiar', batteryLevel: 95, batteryDropType: 'none' } },
    { label: 'Night Walk', icon: '🌙', values: { pace: 'normal', stillnessSeconds: 0, crowdDensity: 'large', routeFamiliarity: 'familiar', batteryLevel: 80, batteryDropType: 'none' } },
    { label: 'Deserted Run (High)', icon: '⚠️', values: { pace: 'increasing', stillnessSeconds: 0, crowdDensity: 'none', routeFamiliarity: 'unfamiliar', batteryLevel: 65, batteryDropType: 'none' } },
    { label: 'Stationary Isolated (High)', icon: '🛑', values: { pace: 'normal', stillnessSeconds: 120, crowdDensity: 'none', routeFamiliarity: 'familiar', batteryLevel: 50, batteryDropType: 'none' } },
    { label: 'Compound Threat + Battery Drop (Critical)', icon: '🚨', values: { pace: 'running', stillnessSeconds: 0, crowdDensity: 'small', routeFamiliarity: 'unfamiliar', batteryLevel: 8, batteryDropType: 'instant' } }
  ];

  return (
    <div className="app-shell">
      {/* Mobile-Friendly App Container */}
      <div className="app-phone-frame">
        {/* Top App Header & Live Security Bar */}
        <header className="app-top-header">
          <div className="header-top-row">
            <div className="app-brand-lockup">
              <div className="brand-logo-icon">
                <span className="logo-symbol">🛡️</span>
                <span className="logo-halo" />
              </div>
              <div>
                <h1 className="brand-title">Aurora</h1>
                <span className="brand-subtitle">Personal Guardian AI</span>
              </div>
            </div>

            <div className="header-actions">
              <button
                type="button"
                className="btn-header-settings"
                onClick={() => setShowSettingsModal(true)}
                title="Security & Sharing Settings"
              >
                <span className="settings-gear">⚙️</span>
                <span className="settings-text">Settings</span>
              </button>
            </div>
          </div>

          {/* Real-Time Live Signal Status Chips */}
          <div className="header-status-strip">
            <div className="status-chip live-guard-chip">
              <span className="pulsing-green-dot" />
              <span>Guard Active ({mode})</span>
            </div>

            <div className="status-chip" title="System Clock Signal">
              <span>{timeSignal.timeOfDay === 'day' ? '☀️' : '🌙'} {timeSignal.formattedTime}</span>
            </div>

            <div className="status-chip" title="Battery Status Signal">
              <span>⚡ {batterySignal.batteryLevel}%</span>
            </div>

            <div className={`status-chip ${geoSignals.isGeolocationActive ? 'chip-gps-active' : ''}`} title="GPS Kinematics">
              <span>📍 {geoSignals.isGeolocationActive ? `${geoSignals.speedKmh} km/h` : 'GPS Fallback'}</span>
            </div>
          </div>
        </header>

        {/* Minimal Onboarding / Safe Word Security Bar */}
        <OnboardingSetup />

        {/* Navigation Tabs */}
        <nav className="app-navigation-tabs">
          <button
            type="button"
            className={`nav-tab-btn ${activeTab === 'shield' ? 'active' : ''}`}
            onClick={() => setActiveTab('shield')}
          >
            <span className="tab-icon">🛡️</span>
            <span className="tab-title">Guardian</span>
          </button>

          <button
            type="button"
            className={`nav-tab-btn ${activeTab === 'journey' ? 'active' : ''}`}
            onClick={() => setActiveTab('journey')}
          >
            <span className="tab-icon">📍</span>
            <span className="tab-title">Live Walk</span>
          </button>

          <button
            type="button"
            className={`nav-tab-btn ${activeTab === 'circle' ? 'active' : ''}`}
            onClick={() => setActiveTab('circle')}
          >
            <span className="tab-icon">👥</span>
            <span className="tab-title">Circle & Zones</span>
          </button>

          <button
            type="button"
            className={`nav-tab-btn nav-tab-inspector ${activeTab === 'telemetry' ? 'active' : ''}`}
            onClick={() => setActiveTab('telemetry')}
          >
            <span className="tab-icon">🧪</span>
            <span className="tab-title">Telemetry Lab</span>
          </button>
        </nav>

        {/* Main Content Area */}
        <main className="app-main-content">
          {/* Active Check-In & Anti-Coercion Stand-Down Prompt (Universal Priority) */}
          <CheckInPrompt />

          {/* TAB 1: GUARDIAN SHIELD (Primary Safety Dashboard) */}
          {activeTab === 'shield' && (
            <div className="tab-view-container animate-fade-in">
              <RiskDisplay />

              {/* Quick Action Cards in Guardian View */}
              <div className="guardian-quick-cards">
                <div className="quick-action-card" onClick={() => setActiveTab('journey')}>
                  <div className="quick-card-icon">📍</div>
                  <div className="quick-card-content">
                    <h4>Heading Somewhere?</h4>
                    <p>Start a time-boxed Live Journey Share with your Circle.</p>
                  </div>
                  <span className="quick-card-arrow">→</span>
                </div>

                <div className="quick-action-card" onClick={() => setShowSettingsModal(true)}>
                  <div className="quick-card-icon">🛡️</div>
                  <div className="quick-card-content">
                    <h4>Safe Word Armed</h4>
                    <p>{safeWord ? `Active (${safeWord.length} chars) • Anti-coercion ready` : 'Click to configure safe word'}</p>
                  </div>
                  <span className="quick-card-arrow">⚙️</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE JOURNEY SHARING */}
          {activeTab === 'journey' && (
            <div className="tab-view-container animate-fade-in">
              <JourneyShare />
            </div>
          )}

          {/* TAB 3: CIRCLE & GEOFENCED ZONES */}
          {activeTab === 'circle' && (
            <div className="tab-view-container animate-fade-in circle-zones-view">
              <div className="section-card">
                <div className="section-card-header">
                  <div className="section-title-wrap">
                    <span className="section-icon">👥</span>
                    <div>
                      <h3>Trusted Circle Contacts</h3>
                      <p>Emergency recipients in Connected Mode</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-card-action"
                    onClick={() => setShowSettingsModal(true)}
                  >
                    Edit Circle
                  </button>
                </div>

                {trustedCircle.filter(c => c.name.trim()).length > 0 ? (
                  <div className="circle-member-list">
                    {trustedCircle.filter(c => c.name.trim()).map((contact, i) => (
                      <div key={i} className="circle-member-item">
                        <div className="member-avatar">{contact.name.charAt(0).toUpperCase()}</div>
                        <div className="member-details">
                          <span className="member-name">{contact.name}</span>
                          <span className="member-phone">{contact.phone || 'SMS Alert Enabled'}</span>
                        </div>
                        <span className="member-badge">Active Link</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state-box">
                    <p>No contacts added yet. {mode === 'Solo' ? 'You are currently in Solo Mode.' : 'Add 1-3 contacts to enable emergency broadcasting.'}</p>
                    <button
                      type="button"
                      className="btn-inline-link"
                      onClick={() => setShowSettingsModal(true)}
                    >
                      + Configure Trusted Circle
                    </button>
                  </div>
                )}
              </div>

              <div className="section-card">
                <div className="section-card-header">
                  <div className="section-title-wrap">
                    <span className="section-icon">📍</span>
                    <div>
                      <h3>Geofenced Safety Zones</h3>
                      <p>500m radius around familiar places</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-card-action"
                    onClick={() => setShowSettingsModal(true)}
                  >
                    Manage Places
                  </button>
                </div>

                {familiarPlaces.length > 0 ? (
                  <div className="places-chip-list">
                    {familiarPlaces.map((place, i) => (
                      <div key={i} className="place-chip-card">
                        <div className="place-icon-wrap">🏡</div>
                        <div className="place-info">
                          <span className="place-name">{place.name}</span>
                          <span className="place-geo">
                            {place.latitude ? `${place.latitude.toFixed(4)}, ${place.longitude.toFixed(4)}` : 'Coordinates pending'}
                          </span>
                        </div>
                        <span className="place-radius-pill">500m Zone</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state-box">
                    <p>No familiar places saved. Save Home, Work, or Campus to automatically verify route familiarity.</p>
                    <button
                      type="button"
                      className="btn-inline-link"
                      onClick={() => setShowSettingsModal(true)}
                    >
                      + Add Familiar Place
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: TELEMETRY LAB & SENSOR INSPECTION (For Developers & Judges) */}
          {activeTab === 'telemetry' && (
            <div className="tab-view-container animate-fade-in">
              <SimulationPanel />
            </div>
          )}
        </main>

        {/* Floating Quick Scenario Injector for Judges/Evaluation */}
        <div className="judge-eval-fab-container">
          <button
            type="button"
            className={`btn-judge-fab ${showQuickPresets ? 'open' : ''}`}
            onClick={() => setShowQuickPresets(!showQuickPresets)}
            title="Open Benchmark Scenario Quick-Injector"
          >
            <span className="fab-icon">⚡</span>
            <span className="fab-label">Judge Presets</span>
          </button>

          {showQuickPresets && (
            <div className="quick-presets-flyout">
              <div className="flyout-header">
                <span className="flyout-title">⚡ Instant Scenario Injector</span>
                <button
                  type="button"
                  className="btn-close-flyout"
                  onClick={() => setShowQuickPresets(false)}
                >
                  ✕
                </button>
              </div>
              <p className="flyout-subtext">Click any preset to test the composite risk scoring engine live:</p>
              
              <div className="flyout-buttons">
                {DEMO_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="flyout-preset-btn"
                    onClick={() => {
                      updateSignals(p.values);
                      setShowQuickPresets(false);
                      setActiveTab('shield');
                    }}
                  >
                    <span>{p.icon}</span>
                    <span>{p.label}</span>
                  </button>
                ))}
                <button
                  type="button"
                  className="flyout-preset-btn reset-flyout-btn"
                  onClick={() => {
                    resetToSafeBaseline();
                    setShowQuickPresets(false);
                    setActiveTab('shield');
                  }}
                >
                  <span>↺</span>
                  <span>Reset Safe Baseline</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Universal Floating Emergency SOS Button & Overlay */}
        <SOSButton />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
