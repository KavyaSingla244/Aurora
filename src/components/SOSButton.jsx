/**
 * SafeSignal - Emergency SOS Component
 * 
 * DESIGN PRINCIPLES:
 * 1. Independent & Always-Available: Fixed red SOS trigger accessible regardless of current tier or pipeline state.
 * 2. Accidental Trigger Defense: 1-second press-and-hold required for manual user tap.
 * 3. Unified SOS State: Automatic triggers (from CheckInPrompt coercion/silence) invoke the exact same state without requiring hold.
 * 4. Transparent Emergency Dialing: Uses tel:112 & tel:100 tap-to-call links — no fake dialer simulations.
 * 5. Default-Secure Stand-Down: Disarming active SOS requires exact safe-word confirmation.
 */

import React, { useState, useRef } from 'react';
import { useApp } from '../state/useApp';
import './SOSButton.css';

export default function SOSButton() {
  const {
    isSOSActive,
    sosReason,
    triggerSOS,
    standDownSOS
  } = useApp();

  const [holdProgress, setHoldProgress] = useState(0); // 0 to 100
  const [standDownInput, setStandDownInput] = useState('');
  const [standDownError, setStandDownError] = useState('');

  const holdIntervalRef = useRef(null);
  const holdStartTimeRef = useRef(0);
  const HOLD_DURATION_MS = 1000; // 1 second hold

  // Press & Hold Handlers
  const startHold = () => {
    if (isSOSActive) return;
    holdStartTimeRef.current = Date.now();
    setHoldProgress(0);

    holdIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - holdStartTimeRef.current;
      const progress = Math.min(100, (elapsed / HOLD_DURATION_MS) * 100);
      setHoldProgress(progress);

      if (elapsed >= HOLD_DURATION_MS) {
        clearInterval(holdIntervalRef.current);
        holdIntervalRef.current = null;
        setHoldProgress(0);
        triggerSOS('manual');
      }
    }, 30);
  };

  const cancelHold = () => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    setHoldProgress(0);
  };

  // Safe-Word Stand-Down Handler
  const handleStandDown = (e) => {
    e.preventDefault();
    if (!standDownInput.trim()) return;

    const success = standDownSOS(standDownInput);
    if (success) {
      setStandDownInput('');
      setStandDownError('');
    } else {
      setStandDownError('Incorrect safe word. Emergency alert remains armed (Anti-Coercion Protocol).');
    }
  };

  const getReasonLabel = (reason) => {
    switch (reason) {
      case 'manual':
        return 'Manual User SOS (1-Second Press & Hold)';
      case 'coercion_wrong_word':
        return 'Anti-Coercion Protocol (Incorrect Safe-Word / Coercion Signal)';
      case 'silence_timeout':
        return 'Silence Escalation (3 Consecutive Unanswered Check-In Windows)';
      default:
        return 'Critical Safety Escalation';
    }
  };

  return (
    <>
      {/* 1. Fixed Always-Available Floating SOS Button */}
      <div className="sos-fixed-container" id="sos-button-wrapper">
        <button
          type="button"
          className={`sos-floating-btn ${isSOSActive ? 'sos-active-pulse' : ''} ${holdProgress > 0 ? 'holding' : ''}`}
          onMouseDown={startHold}
          onMouseUp={cancelHold}
          onMouseLeave={cancelHold}
          onTouchStart={startHold}
          onTouchEnd={cancelHold}
          title={isSOSActive ? 'Emergency Active' : 'Press and hold 1 second for Emergency SOS'}
        >
          <div className="sos-btn-content">
            <span className="sos-icon">🚨</span>
            <span className="sos-text">SOS</span>
          </div>

          {/* Radial progress ring during press-and-hold */}
          {holdProgress > 0 && !isSOSActive && (
            <svg className="sos-hold-ring" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="46"
                strokeWidth="6"
                className="hold-ring-bg"
              />
              <circle
                cx="50"
                cy="50"
                r="46"
                strokeWidth="6"
                strokeDasharray="289"
                strokeDashoffset={289 - (holdProgress / 100) * 289}
                className="hold-ring-fill"
              />
            </svg>
          )}
        </button>
        <span className="sos-help-hint">
          {isSOSActive ? '🚨 ALERT ACTIVE' : holdProgress > 0 ? 'Hold 1s...' : 'Hold 1s for SOS'}
        </span>
      </div>

      {/* 2. Active Emergency Modal & Direct Emergency Dispatch Panel */}
      {isSOSActive && (
        <div className="emergency-modal-overlay" id="emergency-active-modal">
          <div className="emergency-card">
            {/* Header */}
            <div className="emergency-card-header">
              <div className="emergency-siren-badge">🚨</div>
              <h2>CRITICAL EMERGENCY ACTIVE</h2>
              <p className="emergency-subtitle">Simulated Alert Broadcasted to Trusted Circle</p>
            </div>

            {/* Trigger Reason */}
            <div className="emergency-reason-banner">
              <span className="reason-tag">SOURCE:</span>
              <span className="reason-text">{getReasonLabel(sosReason)}</span>
            </div>

            {/* Tap-to-Call Links */}
            <div className="emergency-call-section">
              <span className="call-section-title">DIRECT EMERGENCY DISPATCH (INDIA)</span>
              <div className="emergency-call-grid">
                <a href="tel:112" className="emergency-call-btn call-112">
                  <span className="call-icon">📞</span>
                  <div className="call-text-block">
                    <span className="call-number">112</span>
                    <span className="call-desc">National Emergency Service</span>
                  </div>
                  <span className="call-action">Tap to Call ↗</span>
                </a>

                <a href="tel:100" className="emergency-call-btn call-100">
                  <span className="call-icon">🚔</span>
                  <div className="call-text-block">
                    <span className="call-number">100</span>
                    <span className="call-desc">Police Control Room</span>
                  </div>
                  <span className="call-action">Tap to Call ↗</span>
                </a>
              </div>
            </div>

            {/* Default-Secure Stand-Down Section */}
            <div className="emergency-stand-down-section">
              <h3>Disarm Alert with Secret Safe Word</h3>
              <p className="stand-down-instruction">
                Emergency broadcast will remain active until your configured safe word is verified.
              </p>

              <form onSubmit={handleStandDown} className="stand-down-form">
                <div className="stand-down-input-wrapper">
                  <input
                    type="text"
                    placeholder="Enter safe word to stand down..."
                    value={standDownInput}
                    onChange={(e) => {
                      setStandDownInput(e.target.value);
                      if (standDownError) setStandDownError('');
                    }}
                    className="stand-down-input"
                    autoFocus
                    autoComplete="off"
                  />
                  <button type="submit" className="btn-stand-down">
                    Disarm Alert
                  </button>
                </div>
                {standDownError && <p className="stand-down-error">{standDownError}</p>}
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
