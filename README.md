# SafeSignal — Personal Guardian AI

> **Live Production Submission Link:** [https://safesignal-five.vercel.app](https://safesignal-five.vercel.app)  
> **Fallback Mirror:** [https://safesignal-jftg3t8mh-kavyasingla24-1235.vercel.app](https://safesignal-jftg3t8mh-kavyasingla24-1235.vercel.app)

---

## Overview

**SafeSignal** is an intelligent, privacy-first personal safety web application designed around a **multi-signal composite risk-scoring engine**. Rather than relying on single-trigger panic buttons, SafeSignal synthesizes real-world sensor telemetry and behavioral cues in real time to proactively detect danger, initiate non-intrusive safety check-ins, and escalate to emergency dispatch under duress or silence.

---

## Key Features & Innovations

1. **Composite Risk-Scoring Engine (`0 – 100`)**:
   - Compounding multi-factor evaluation (Pace, Stillness, Diurnal Cycle, Route Familiarity, Battery Signature, and Crowd Density).
   - Dynamic cross-signal compounding multipliers (up to 1.35× when correlated threats co-occur).
   - Smooth temporal de-escalation decay (`0.5 pts/sec`) when signals return to baseline.

2. **Real Browser Sensor Telemetry + Graceful Simulation Fallbacks**:
   - **System Clock:** Continuous diurnal cycle classification (Day: 6 AM – 7 PM vs Night).
   - **GPS Kinematics:** Live velocity (km/h), stillness accumulation, and geofenced distance calculations via Haversine formula (with jitter filtering).
   - **Battery API:** Hardware battery percentage and rapid-discharge tampering anomaly detection.
   - **Interactive Telemetry Lab:** Full slider & segmented controls for hackathon evaluation and stress-testing.

3. **Anti-Coercion Protocol & Silence Escalation**:
   - **Strict Safe-Word Stand-Down:** Only the user's secret phrase disarms alerts.
   - **Coercion Trap:** Entering generic reassurance phrases like *"I'm fine"* or incorrect words immediately triggers Emergency SOS.
   - **Silence Retries:** 3 progressive response windows (`30s` window + `10s` standby) before automated SOS broadcast.

4. **100% On-Device & Zero-Data Leakage**:
   - All state, safe words, contact configurations, and GPS coordinates persist strictly in local `localStorage` and memory. No tracking database.

5. **Direct Emergency Dispatch**:
   - Native tap-to-call links (`tel:112` National Emergency, `tel:100` Police Control Room).
   - 1-second press-and-hold accidental trigger defense for manual SOS.

---

## ⚡ Quick Guide for Hackathon Judges

1. **Open the Live Link:** [https://safesignal-five.vercel.app](https://safesignal-five.vercel.app)
2. **Setup Onboarding:** Enter any safe word (e.g. `AURORA`) and select *Connected Mode* with sample emergency contacts.
3. **Instant Scenario Injector:**
   - Tap the floating **⚡ Judge Presets** button at the bottom right.
   - Click **"Deserted Run (High)"** or **"Compound Threat + Battery Drop (Critical)"** to observe immediate risk escalation.
4. **Test Anti-Coercion:**
   - When the Check-In prompt appears, type `"I'm fine"` or any wrong word $\rightarrow$ Watch the app instantly arm Emergency SOS.
   - Disarm the SOS modal by entering your exact safe word.
5. **Inspect Sensor Feeds:**
   - Switch to the **Telemetry Lab** tab to inspect live sensor feeds, authorize real GPS tracking, or adjust individual behavioral dials.

---

## Project Architecture

```
safesignal/
├── src/
│   ├── engine/
│   │   ├── riskScore.js            # Pure functional composite risk engine
│   │   ├── checkInConfig.js        # Timing & retry constants
│   │   ├── riskScore.test-scenarios.js # 10 benchmark scenario tests
│   │   └── pipeline.test.js        # Check-in & sharing state tests
│   ├── signals/
│   │   ├── geoUtils.js             # Haversine distance, speed & pace derivation
│   │   ├── useGeolocationSignals.js # Real GPS watcher hook & fallback state
│   │   ├── useBatterySignal.js     # Battery Status API hook
│   │   └── useTimeOfDaySignal.js   # Browser diurnal clock hook
│   ├── state/
│   │   ├── AppContext.jsx          # Unified state management & dispatch
│   │   └── storage.js              # On-device localStorage persistence
│   └── components/
│       ├── RiskDisplay.jsx         # Circular threat radar & active factor cards
│       ├── CheckInPrompt.jsx       # 3-attempt anti-coercion check-in UI
│       ├── SOSButton.jsx           # 1s press-and-hold trigger & dispatch modal
│       ├── JourneyShare.jsx        # Live walk sharing status
│       ├── SimulationPanel.jsx     # Telemetry lab & sensor inspection dials
│       └── OnboardingSetup.jsx     # Safe word & circle configuration modal
├── public/
│   ├── favicon.svg                 # Glowing SVG shield brand icon
│   ├── manifest.json               # PWA standalone configuration
│   └── og-image.svg                # Open Graph social preview card
├── vercel.json                     # Static routing & SPA rewrites
└── netlify.toml                    # Netlify deployment configuration
```

---

## Local Development & Testing

```bash
# Install dependencies
npm install

# Run local development server
npm run dev

# Run automated unit tests & scenario benchmarks
npm test

# Build production bundle
npm run build
```
