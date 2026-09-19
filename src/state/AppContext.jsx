import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { AppContext } from './context';
import { DEFAULT_SIGNALS } from './constants';
import { calculateRiskScore } from '../engine/riskScore';
import { storage } from './storage';
import { CHECKIN_RESPONSE_WINDOW_SECONDS, CHECKIN_MAX_ATTEMPTS, CHECKIN_RETRY_INTERVAL_SECONDS } from '../engine/checkInConfig';
import { useTimeOfDaySignal } from '../signals/useTimeOfDaySignal';
import { useBatterySignal } from '../signals/useBatterySignal';
import { useGeolocationSignals } from '../signals/useGeolocationSignals';

export { CHECKIN_RESPONSE_WINDOW_SECONDS, CHECKIN_MAX_ATTEMPTS, CHECKIN_RETRY_INTERVAL_SECONDS };

export function AppProvider({ children }) {
  // Onboarding & Security Settings State
  const [safeWord, setSafeWordState] = useState(() => storage.getSafeWord());
  const [isOnboarded, setIsOnboarded] = useState(() => storage.isOnboarded());
  const [mode, setModeState] = useState(() => storage.getMode()); // 'Solo' | 'Connected'
  const [trustedCircle, setTrustedCircleState] = useState(() => storage.getTrustedCircle());
  const [familiarPlaces, setFamiliarPlacesState] = useState(() => storage.getFamiliarPlaces());
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Manual Simulation Dials (used when real sensors are inactive or for crowd density)
  const [manualSignals, setManualSignals] = useState(DEFAULT_SIGNALS);

  // Real Signal Hooks
  const timeSignal = useTimeOfDaySignal();
  const batterySignal = useBatterySignal(manualSignals.batteryLevel, manualSignals.batteryDropType);
  const geoSignals = useGeolocationSignals({
    manualPace: manualSignals.pace,
    manualStillnessSeconds: manualSignals.stillnessSeconds,
    manualRouteFamiliarity: manualSignals.routeFamiliarity,
    savedPlaces: familiarPlaces
  });

  // Live Journey Share State
  const [journey, setJourney] = useState({
    isActive: false,
    label: '',
    startedAt: null
  });

  // Simulated Notification Toasts
  const [circleNotifications, setCircleNotifications] = useState([]);

  // Emergency SOS State
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [sosReason, setSosReason] = useState(null); // 'manual' | 'coercion_wrong_word' | 'silence_timeout'
  const [sosTriggeredAt, setSosTriggeredAt] = useState(null);

  // Check-In Retry Pipeline State
  const [checkInState, setCheckInState] = useState('idle');
  const [currentAttempt, setCurrentAttempt] = useState(1);
  const [countdown, setCountdown] = useState(CHECKIN_RESPONSE_WINDOW_SECONDS);
  const [checkInFeedback, setCheckInFeedback] = useState(null);

  const lastUpdatedRef = useRef(0);
  const prevScoreRef = useRef(0);
  const prevTierRef = useRef('LOW');

  useEffect(() => {
    lastUpdatedRef.current = Date.now();
  }, []);

  // Compute effective composite signals combining real sensors and fallback simulation
  const effectiveSignals = useMemo(() => {
    return {
      // Pace: Real GPS speed if active, else manual fallback
      pace: geoSignals.isGeolocationActive ? geoSignals.pace : manualSignals.pace,
      
      // Stillness: Real GPS stillness if active, else manual fallback
      stillnessSeconds: geoSignals.isGeolocationActive ? geoSignals.stillnessSeconds : manualSignals.stillnessSeconds,
      
      // Crowd Density: Strictly manual simulation (no free real-time crowd API)
      crowdDensity: manualSignals.crowdDensity,
      
      // Time of Day: Fully real from browser clock
      timeOfDay: timeSignal.timeOfDay,
      
      // Route Familiarity: Real GPS distance to saved places if GPS active & places exist, else manual
      routeFamiliarity: (geoSignals.isGeolocationActive && familiarPlaces.length > 0)
        ? geoSignals.routeFamiliarity
        : manualSignals.routeFamiliarity,
      
      // Battery Level: Real battery if supported, else manual
      batteryLevel: batterySignal.isBatterySupported ? batterySignal.batteryLevel : manualSignals.batteryLevel,
      
      // Battery Drop Type: Real battery anomaly if supported, else manual
      batteryDropType: batterySignal.isBatterySupported ? batterySignal.batteryDropType : manualSignals.batteryDropType,
      
      // Journey Share State
      journeyShareActive: journey.isActive
    };
  }, [
    geoSignals.isGeolocationActive,
    geoSignals.pace,
    geoSignals.stillnessSeconds,
    geoSignals.routeFamiliarity,
    manualSignals,
    timeSignal.timeOfDay,
    familiarPlaces.length,
    batterySignal.isBatterySupported,
    batterySignal.batteryLevel,
    batterySignal.batteryDropType,
    journey.isActive
  ]);

  // Telemetry metadata explaining the exact source (real vs simulated) of every signal
  const signalSourcesMeta = useMemo(() => {
    return {
      timeOfDay: {
        isReal: true,
        source: 'Real Browser System Clock',
        displayVal: `${timeSignal.formattedTime} (${timeSignal.timeOfDay === 'day' ? '☀️ Day' : '🌙 Night'})`,
        note: 'Calculated from local browser time (Day: 6 AM - 7 PM)'
      },
      pace: {
        isReal: geoSignals.isGeolocationActive,
        source: geoSignals.isGeolocationActive ? 'Real GPS Telemetry' : 'Manual Simulation (Fallback)',
        displayVal: geoSignals.isGeolocationActive ? `${geoSignals.speedKmh} km/h (${geoSignals.pace})` : manualSignals.pace,
        fallbackReason: geoSignals.fallbackReason
      },
      stillness: {
        isReal: geoSignals.isGeolocationActive,
        source: geoSignals.isGeolocationActive ? 'Real GPS Stillness' : 'Manual Simulation (Fallback)',
        displayVal: `${geoSignals.isGeolocationActive ? geoSignals.stillnessSeconds : manualSignals.stillnessSeconds}s stationary`,
        fallbackReason: geoSignals.fallbackReason
      },
      routeFamiliarity: {
        isReal: geoSignals.isGeolocationActive && familiarPlaces.length > 0,
        source: (geoSignals.isGeolocationActive && familiarPlaces.length > 0) ? 'Real GPS Geofence' : 'Manual Simulation',
        displayVal: (geoSignals.isGeolocationActive && familiarPlaces.length > 0) ? geoSignals.routeFamiliarity : manualSignals.routeFamiliarity,
        nearestPlaceInfo: geoSignals.nearestPlaceInfo,
        fallbackReason: !geoSignals.isGeolocationActive
          ? 'GPS inactive — using manual selection'
          : familiarPlaces.length === 0
          ? 'No familiar places configured — using manual selection'
          : null
      },
      battery: {
        isReal: batterySignal.isBatterySupported,
        source: batterySignal.isBatterySupported ? 'Real Battery Status API' : 'Manual Simulation (Fallback)',
        displayVal: `${batterySignal.isBatterySupported ? batterySignal.batteryLevel : manualSignals.batteryLevel}% (${batterySignal.batteryDropType})`,
        fallbackReason: batterySignal.fallbackReason
      },
      crowdDensity: {
        isReal: false,
        source: 'Manual Simulation Only',
        displayVal: manualSignals.crowdDensity,
        note: 'Real-time bystander density requires paid location-density APIs or aggregated user-base signals not viable at hackathon scale.'
      }
    };
  }, [timeSignal, batterySignal, geoSignals, manualSignals, familiarPlaces.length]);

  // Risk Assessment Evaluation
  const [riskAssessment, setRiskAssessment] = useState(() => calculateRiskScore(effectiveSignals, 0, 0));
  const [previousScore, setPreviousScore] = useState(0);
  const [isCriticalFlash, setIsCriticalFlash] = useState(false);

  // Helper to format circle names
  const getCircleNames = useCallback(() => {
    if (!trustedCircle || trustedCircle.length === 0) return 'Trusted Circle';
    return trustedCircle.map(c => c.name).filter(Boolean).join(', ') || 'Trusted Circle';
  }, [trustedCircle]);

  // Toast Dispatcher (Simulated Circle Ping)
  const dispatchCircleNotification = useCallback((message, type = 'info') => {
    const newNotif = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      message,
      type,
      timestamp: Date.now()
    };

    setCircleNotifications(prev => [...prev.slice(-3), newNotif]);

    setTimeout(() => {
      setCircleNotifications(prev => prev.filter(n => n.id !== newNotif.id));
    }, 4500);
  }, []);

  // Save mode & circle
  const setMode = useCallback((newMode) => {
    storage.setMode(newMode);
    setModeState(newMode);
  }, []);

  const setTrustedCircle = useCallback((newCircle) => {
    storage.setTrustedCircle(newCircle);
    setTrustedCircleState(newCircle);
  }, []);

  const setFamiliarPlaces = useCallback((newPlaces) => {
    storage.setFamiliarPlaces(newPlaces);
    setFamiliarPlacesState(newPlaces);
  }, []);

  // Save complete onboarding configuration
  const completeOnboarding = useCallback((word, newMode, circleContacts, places = []) => {
    const trimmed = word.trim();
    if (!trimmed) return false;
    storage.setSafeWord(trimmed);
    setSafeWordState(trimmed);
    
    storage.setMode(newMode);
    setModeState(newMode);

    if (newMode === 'Connected') {
      const validContacts = circleContacts.filter(c => c.name.trim() || c.phone.trim());
      storage.setTrustedCircle(validContacts);
      setTrustedCircleState(validContacts);
    } else {
      storage.setTrustedCircle([]);
      setTrustedCircleState([]);
    }

    const validPlaces = places.filter(p => p.name && typeof p.latitude === 'number');
    storage.setFamiliarPlaces(validPlaces);
    setFamiliarPlacesState(validPlaces);

    setIsOnboarded(true);
    setShowSettingsModal(false);
    return true;
  }, []);

  // Reset safe word & onboarding
  const resetSafeWord = useCallback(() => {
    storage.resetOnboarding();
    setSafeWordState('');
    setIsOnboarded(false);
    setModeState('Solo');
    setTrustedCircleState([]);
    setFamiliarPlacesState([]);
    setJourney({ isActive: false, label: '', startedAt: null });
  }, []);

  // UNIFIED SOS TRIGGER ACTION
  const triggerSOS = useCallback((reason = 'manual') => {
    setIsSOSActive(true);
    setSosReason(reason);
    setSosTriggeredAt(Date.now());
    setIsCriticalFlash(true);
    setTimeout(() => setIsCriticalFlash(false), 1500);

    setCheckInState('idle');
    setCheckInFeedback(null);

    let reasonText = 'Manual Emergency SOS Activated';
    if (reason === 'coercion_wrong_word') {
      reasonText = 'CRITICAL ALERT: Potential coercion/duress detected (non-matching safe word)';
    } else if (reason === 'silence_timeout') {
      reasonText = 'CRITICAL ALERT: Emergency response window expired after 3 unanswered check-ins';
    }

    setRiskAssessment({
      score: 100,
      tier: 'CRITICAL',
      contributingFactors: [
        reasonText,
        'Simulated alert broadcast to Trusted Circle & Emergency Links Armed',
        'Strict safe-word stand-down required'
      ]
    });
    prevScoreRef.current = 100;
    prevTierRef.current = 'CRITICAL';

    if (mode === 'Connected') {
      const names = getCircleNames();
      dispatchCircleNotification(`🚨 EMERGENCY SOS DISPATCH: Notifying ${names} — Immediate assistance requested`, 'alert');
    } else {
      dispatchCircleNotification(`🚨 LOCAL SOS ARMED: Solo Mode active (Local emergency links ready)`, 'alert');
    }
  }, [mode, getCircleNames, dispatchCircleNotification]);

  // Stand down SOS via exact safe word match
  const standDownSOS = useCallback((enteredWord) => {
    if (!safeWord) return false;
    const isMatch = enteredWord.trim().toUpperCase() === safeWord.trim().toUpperCase();

    if (isMatch) {
      setIsSOSActive(false);
      setSosReason(null);
      setSosTriggeredAt(null);
      setManualSignals(DEFAULT_SIGNALS);
      const res = calculateRiskScore(effectiveSignals, 0, 0);
      setRiskAssessment(res);
      prevScoreRef.current = res.score;
      prevTierRef.current = res.tier;
      setPreviousScore(0);
      setCheckInState('resolved');
      setCheckInFeedback({ type: 'success', message: 'Safe word verified • Emergency stand-down confirmed' });
      
      if (mode === 'Connected') {
        const names = getCircleNames();
        dispatchCircleNotification(`✅ STAND-DOWN: Notifying ${names} — Safe word confirmed. Alert resolved.`, 'success');
      }

      setTimeout(() => setCheckInFeedback(null), 5000);
      return true;
    }
    return false;
  }, [safeWord, mode, getCircleNames, dispatchCircleNotification, effectiveSignals]);

  // Journey Share Actions
  const startJourney = useCallback((label = 'Heading Home') => {
    const cleanLabel = label.trim() || 'Active Journey';
    setJourney({
      isActive: true,
      label: cleanLabel,
      startedAt: Date.now()
    });

    const names = getCircleNames();
    dispatchCircleNotification(`📍 JOURNEY STARTED: Notifying ${names} — "${cleanLabel}" (Live monitoring enabled)`, 'info');
  }, [getCircleNames, dispatchCircleNotification]);

  const endJourney = useCallback(() => {
    setJourney({
      isActive: false,
      label: '',
      startedAt: null
    });

    const names = getCircleNames();
    dispatchCircleNotification(`🏠 JOURNEY ENDED: Notifying ${names} — Arrived safely`, 'success');
  }, [getCircleNames, dispatchCircleNotification]);

  // Recalculate risk whenever effective signals update
  useEffect(() => {
    if (isSOSActive) return;

    const now = Date.now();
    const lastTime = lastUpdatedRef.current || now;
    const secondsElapsed = Math.max(0, (now - lastTime) / 1000);
    lastUpdatedRef.current = now;

    const currentPrev = prevScoreRef.current;
    const result = calculateRiskScore(effectiveSignals, currentPrev, secondsElapsed);

    if (result.tier === 'CRITICAL' && currentPrev < 60) {
      setIsCriticalFlash(true);
      setTimeout(() => setIsCriticalFlash(false), 1200);
    }

    // Check-in trigger condition: crosses into ELEVATED or above
    if (
      (result.tier === 'ELEVATED' || result.tier === 'HIGH' || result.tier === 'CRITICAL') &&
      checkInState === 'idle'
    ) {
      setCheckInState('prompting');
      setCurrentAttempt(1);
      setCountdown(CHECKIN_RESPONSE_WINDOW_SECONDS);
    }

    // Circle Notification Trigger Matrix
    if (mode === 'Connected' && journey.isActive && prevTierRef.current !== result.tier) {
      const names = getCircleNames();
      const tierType = (result.tier === 'HIGH' || result.tier === 'CRITICAL') ? 'warning' : 'info';
      dispatchCircleNotification(`⚠️ LIVE JOURNEY UPDATE: Notifying ${names} — Threat level shifted to [${result.tier}]`, tierType);
    } else if (mode === 'Connected' && !journey.isActive && result.tier === 'CRITICAL' && prevTierRef.current !== 'CRITICAL') {
      const names = getCircleNames();
      dispatchCircleNotification(`🚨 CRITICAL THREAT: Notifying ${names} — Risk engine crossed Critical threshold`, 'alert');
    }

    prevTierRef.current = result.tier;
    setPreviousScore(currentPrev);
    prevScoreRef.current = result.score;
    setRiskAssessment(result);
  }, [effectiveSignals, isSOSActive, checkInState, mode, journey.isActive, getCircleNames, dispatchCircleNotification]);

  // Update a single manual signal property (for sliders / simulation fallbacks)
  const updateSignal = useCallback((key, value) => {
    setManualSignals(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateSignals = useCallback((newSignalsPartial) => {
    setManualSignals(prev => ({ ...prev, ...newSignalsPartial }));
  }, []);

  const resetToSafeBaseline = useCallback(() => {
    if (isSOSActive) return;
    lastUpdatedRef.current = Date.now();
    prevScoreRef.current = 0;
    prevTierRef.current = 'LOW';
    setPreviousScore(0);
    setManualSignals(DEFAULT_SIGNALS);
    setCheckInState('idle');
    setCheckInFeedback(null);
  }, [isSOSActive]);

  const submitCheckIn = useCallback((inputText) => {
    const trimmedInput = inputText.trim();

    if (safeWord && trimmedInput.toUpperCase() === safeWord.toUpperCase()) {
      lastUpdatedRef.current = Date.now();
      prevScoreRef.current = 0;
      prevTierRef.current = 'LOW';
      setPreviousScore(0);
      setManualSignals(DEFAULT_SIGNALS);
      setCheckInState('resolved');
      setCheckInFeedback({ type: 'success', message: 'Safe word verified • Alert stood down' });

      if (mode === 'Connected' && journey.isActive) {
        const names = getCircleNames();
        dispatchCircleNotification(`✅ CHECK-IN VERIFIED: Notifying ${names} — Safe confirmation received`, 'info');
      }

      setTimeout(() => {
        setCheckInState('idle');
        setCheckInFeedback(null);
      }, 4000);
      return { success: true };
    }

    triggerSOS('coercion_wrong_word');
    return { success: false, reason: 'coercion' };
  }, [safeWord, journey.isActive, mode, getCircleNames, dispatchCircleNotification, triggerSOS]);

  // Check-In Countdown & Retry Interval Timer
  useEffect(() => {
    if (isSOSActive || checkInState === 'idle' || checkInState === 'resolved') {
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prevCountdown) => {
        if (prevCountdown > 1) {
          return prevCountdown - 1;
        }

        if (checkInState === 'prompting') {
          if (currentAttempt < CHECKIN_MAX_ATTEMPTS) {
            setCheckInState('waiting_retry');
            return CHECKIN_RETRY_INTERVAL_SECONDS;
          } else {
            triggerSOS('silence_timeout');
            return 0;
          }
        } else if (checkInState === 'waiting_retry') {
          setCurrentAttempt((prev) => prev + 1);
          setCheckInState('prompting');
          return CHECKIN_RESPONSE_WINDOW_SECONDS;
        }

        return 0;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [checkInState, currentAttempt, isSOSActive, triggerSOS]);

  // Periodic temporal decay tick
  useEffect(() => {
    if (isSOSActive || checkInState === 'prompting' || checkInState === 'waiting_retry') {
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const lastTime = lastUpdatedRef.current || now;
      const secondsElapsed = Math.max(0, (now - lastTime) / 1000);
      
      const instant = calculateRiskScore(effectiveSignals, 0, 0);
      
      if (prevScoreRef.current > instant.score && secondsElapsed >= 1) {
        lastUpdatedRef.current = now;
        const result = calculateRiskScore(effectiveSignals, prevScoreRef.current, secondsElapsed);
        setPreviousScore(prevScoreRef.current);
        prevScoreRef.current = result.score;
        prevTierRef.current = result.tier;
        setRiskAssessment(result);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [effectiveSignals, isSOSActive, checkInState]);

  const value = {
    // Onboarding & Security
    safeWord,
    isOnboarded,
    mode,
    setMode,
    trustedCircle,
    setTrustedCircle,
    familiarPlaces,
    setFamiliarPlaces,
    completeOnboarding,
    resetSafeWord,
    showSettingsModal,
    setShowSettingsModal,
    getCircleNames,

    // Real Sensor Hooks & Meta
    geoSignals,
    batterySignal,
    timeSignal,
    signalSourcesMeta,

    // Live Journey Share
    journey,
    startJourney,
    endJourney,

    // Simulated Circle Notifications
    circleNotifications,
    dispatchCircleNotification,

    // Telemetry & Risk
    signals: effectiveSignals,
    manualSignals,
    updateSignal,
    updateSignals,
    resetToSafeBaseline,
    riskAssessment,
    previousScore,
    isCriticalFlash,

    // Emergency SOS
    isSOSActive,
    sosReason,
    sosTriggeredAt,
    triggerSOS,
    standDownSOS,

    // Check-In Retry Pipeline
    checkInState,
    currentAttempt,
    countdown,
    checkInFeedback,
    submitCheckIn,
    CHECKIN_MAX_ATTEMPTS,
    CHECKIN_RESPONSE_WINDOW_SECONDS,
    CHECKIN_RETRY_INTERVAL_SECONDS
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}
