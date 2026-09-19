import React, { useState, useEffect } from 'react';
import { useApp } from '../state/useApp';
import './JourneyShare.css';

export default function JourneyShare() {
  const {
    mode,
    journey,
    startJourney,
    endJourney,
    circleNotifications,
    getCircleNames,
    setShowSettingsModal,
    geoSignals
  } = useApp();

  const [customLabel, setCustomLabel] = useState('');
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (!journey.isActive || !journey.startedAt) return;

    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [journey.isActive, journey.startedAt]);

  const elapsedSeconds = journey.isActive && journey.startedAt
    ? Math.max(0, Math.floor((currentTime - journey.startedAt) / 1000))
    : 0;

  const formatElapsed = (sec) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  // If in Solo Mode, render a sleek informational card explaining sharing model
  if (mode === 'Solo') {
    return (
      <div className="journey-view-shell" id="journey-share">
        <div className="solo-mode-guard-card">
          <div className="solo-shield-header">
            <span className="solo-shield-icon">👤</span>
            <div>
              <h3>Solo Mode Active</h3>
              <p>On-Device Privacy Mode</p>
            </div>
          </div>
          <p className="solo-mode-explainer">
            In <strong>Solo Mode</strong>, telemetry and threat assessments stay strictly on-device. If you want your <strong>Trusted Circle</strong> to receive live transit updates and emergency broadcasts, enable Connected Mode.
          </p>
          <button
            type="button"
            className="btn-enable-connected"
            onClick={() => setShowSettingsModal(true)}
          >
            Switch to Connected Mode →
          </button>
        </div>
      </div>
    );
  }

  const handleStart = (e) => {
    e.preventDefault();
    startJourney(customLabel || 'Heading Home');
    setCustomLabel('');
  };

  const circleNames = getCircleNames();

  return (
    <div className="journey-view-shell" id="journey-share">
      
      {/* 1. Main Journey Live Card */}
      <div className={`journey-companion-card ${journey.isActive ? 'card-journey-active' : ''}`}>
        <div className="journey-card-top">
          <div className="journey-title-wrap">
            <span className="journey-live-icon">{journey.isActive ? '🛰️' : '📍'}</span>
            <div>
              <h3>Live Journey Companion</h3>
              <p className="circle-recipient-text">Connected with: <strong>{circleNames}</strong></p>
            </div>
          </div>
          {journey.isActive ? (
            <div className="live-pulsing-badge">
              <span className="pulsar-dot" />
              <span>STREAMING</span>
            </div>
          ) : (
            <span className="standby-badge">STANDBY</span>
          )}
        </div>

        {/* Live Route Visual Progress Tracker (when active) */}
        {journey.isActive && (
          <div className="transit-visualizer">
            <div className="transit-map-preview">
              <div className="map-grid-lines" />
              <div className="transit-route-line">
                <div className="route-pulse-runner" />
              </div>
              <div className="route-node origin">
                <span>📍 Origin</span>
              </div>
              <div className="route-node destination">
                <span>🏡 Destination</span>
              </div>
            </div>

            <div className="transit-stats-row">
              <div className="transit-stat-block">
                <span className="stat-label">Elapsed Time</span>
                <span className="stat-val timer-highlight">{formatElapsed(elapsedSeconds)}</span>
              </div>
              <div className="transit-stat-block">
                <span className="stat-label">Current Velocity</span>
                <span className="stat-val">{geoSignals.isGeolocationActive ? `${geoSignals.speedKmh} km/h` : '3.8 km/h'}</span>
              </div>
              <div className="transit-stat-block">
                <span className="stat-label">Circle Link</span>
                <span className="stat-val status-online">Connected</span>
              </div>
            </div>
          </div>
        )}

        {journey.isActive ? (
          <div className="journey-active-actions">
            <p className="journey-active-hint">
              Streaming live threat advisories for <strong>"{journey.label}"</strong>. Your circle is notified automatically if your threat level changes.
            </p>
            <button
              type="button"
              className="btn-complete-journey"
              onClick={endJourney}
            >
              🏠 I've Arrived Safely (End Walk)
            </button>
          </div>
        ) : (
          <div className="journey-start-section">
            <p className="journey-start-intro">
              Walking home alone or taking late transit? Share a live time-boxed monitoring session with <strong>{circleNames}</strong>.
            </p>
            <form onSubmit={handleStart} className="journey-start-form">
              <input
                type="text"
                placeholder="Trip label (e.g. Walking home, Late cab) — optional"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                className="journey-input-field"
              />
              <button type="submit" className="btn-start-walk">
                ▶ Start Live Journey Share
              </button>
            </form>
          </div>
        )}
      </div>

      {/* 2. Simulated Circle Notification Stream */}
      {circleNotifications.length > 0 && (
        <div className="simulated-toast-stream">
          <div className="stream-header">
            <span className="stream-radar-icon">📡</span>
            <span className="stream-title">Live Circle Notification Feed</span>
          </div>
          <div className="stream-list">
            {circleNotifications.map((notif) => (
              <div key={notif.id} className={`stream-toast toast-${notif.type}`}>
                <span className="toast-type-dot" />
                <span className="toast-text">{notif.message}</span>
                <span className="toast-timestamp">Just now</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
