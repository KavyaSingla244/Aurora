/**
 * SafeSignal - CheckInPrompt (Full Anti-Coercion Retry Pipeline)
 * 
 * DESIGN PRINCIPLES:
 * 1. Default-Secure: Only exact safe word stands down the alert.
 * 2. Anti-Coercion: Any wrong word or generic "I'm fine" is treated as coercion under duress -> Instant SOS.
 * 3. Silence Escalation: Complete silence (no response) gives 3 progressive retry windows before automated SOS dispatch.
 */

import React, { useState } from 'react';
import { useApp } from '../state/useApp';
import { CHECKIN_RESPONSE_WINDOW_SECONDS, CHECKIN_MAX_ATTEMPTS, CHECKIN_RETRY_INTERVAL_SECONDS } from '../engine/checkInConfig';
import './CheckInPrompt.css';

export { CHECKIN_RESPONSE_WINDOW_SECONDS, CHECKIN_MAX_ATTEMPTS, CHECKIN_RETRY_INTERVAL_SECONDS };

export default function CheckInPrompt() {
  const {
    checkInState,
    currentAttempt,
    countdown,
    checkInFeedback,
    submitCheckIn,
    isSOSActive
  } = useApp();

  const [inputWord, setInputWord] = useState('');

  // If SOS is already active or prompt is idle with no toast, render nothing
  if (isSOSActive) {
    return null;
  }

  if (checkInState === 'idle' && !checkInFeedback) {
    return null;
  }

  // Render stand-down success toast if resolved
  if (checkInFeedback && checkInFeedback.type === 'success') {
    return (
      <div className="checkin-toast-success" id="checkin-success-toast">
        <span className="toast-icon">✅</span>
        <span>{checkInFeedback.message}</span>
      </div>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputWord.trim()) return;

    /**
     * ANTI-COERCION PROTOCOL:
     * We pass input directly to submitCheckIn.
     * If input != safeWord, submitCheckIn triggers instant SOS immediately.
     */
    submitCheckIn(inputWord);
    setInputWord('');
  };

  // If waiting in gap interval between attempts
  if (checkInState === 'waiting_retry') {
    return (
      <div className={`checkin-card checkin-retry-waiting attempt-${currentAttempt}`} id="checkin-prompt">
        <div className="checkin-header">
          <span className="retry-beacon" />
          <div className="checkin-titles">
            <span className="checkin-eyebrow">Awaiting Response • Standby</span>
            <h3>No response received (Attempt {currentAttempt} of {CHECKIN_MAX_ATTEMPTS})</h3>
          </div>
          <div className="countdown-pill waiting">
            Re-prompting in {countdown}s
          </div>
        </div>
        <p className="checkin-subtext">
          Silently giving time before retry {currentAttempt + 1}. If unanswered after {CHECKIN_MAX_ATTEMPTS} attempts, Emergency SOS will automatically trigger.
        </p>
      </div>
    );
  }

  // Active Prompting State
  return (
    <div className={`checkin-card checkin-active attempt-${currentAttempt}`} id="checkin-prompt">
      <div className="checkin-header">
        <div className="pulse-indicator">
          <span className="pulse-ring" />
          <span className="pulse-dot" />
        </div>
        <div className="checkin-titles">
          <div className="eyebrow-row">
            <span className="checkin-eyebrow">SAFETY CHECK-IN REQUIRED</span>
            <span className="attempt-badge">Attempt {currentAttempt} of {CHECKIN_MAX_ATTEMPTS}</span>
          </div>
          <h3 className="checkin-prompt-title">Are you safe? Enter verification phrase</h3>
        </div>
        <div className="countdown-pill active">
          ⏱️ {countdown}s remaining
        </div>
      </div>

      <p className="checkin-guidance">
        Enter your secret safe word to stand down this alert. 
        <span className="coercion-warning-inline"> (Typing incorrect words or generic phrases immediately arms Emergency SOS).</span>
      </p>

      {/* Progress Bar for Current Window */}
      <div className="window-progress-bar">
        <div
          className="window-progress-fill"
          style={{ width: `${(countdown / CHECKIN_RESPONSE_WINDOW_SECONDS) * 100}%` }}
        />
      </div>

      <form onSubmit={handleSubmit} className="checkin-form">
        <div className="checkin-input-wrapper">
          <input
            type="text"
            placeholder="Type safe word to confirm safety..."
            value={inputWord}
            onChange={(e) => setInputWord(e.target.value)}
            className="checkin-text-input"
            autoFocus
            autoComplete="off"
          />
          <button type="submit" className="btn-checkin-submit">
            Confirm Safe Word ↵
          </button>
        </div>
      </form>
    </div>
  );
}
