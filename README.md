# Aurora

A privacy-first personal safety web application built around a composite,
multi-signal risk-scoring engine rather than a single manual panic button.

## The Problem

Most personal safety apps depend on the user recognizing danger and acting
in the moment — pressing a button, opening an app, calling someone. In a
real threat scenario, that assumption often doesn't hold: a person may be
distracted, restrained, coerced, or simply unable to act quickly enough.

Aurora is built around a different premise: safety systems should default
toward caution and act on passive signals, not wait for an explicit request
for help. It continuously evaluates behavioral and environmental context —
movement, time, location familiarity, device state — and escalates on its
own when those signals suggest something may be wrong, while still keeping
a manual override always available.

## Who This Is For

Anyone who walks, commutes, or travels alone and wants a safety layer that
doesn't depend on remembering to open an app mid-crisis — with a particular
focus on scenarios like walking home at night, waiting alone in an
unfamiliar area, or being in a situation where speaking freely isn't safe.

## How It Works

### Composite Risk Scoring

The core of the app is a pure-function scoring engine (`src/engine/riskScore.js`)
that combines multiple signals into a single 0–100 risk score, mapped to
four tiers: **Low, Elevated, High, Critical.**

Signals include:
- Movement pace (walking, accelerating, running)
- Duration of stillness
- Crowd density nearby
- Time of day
- Familiarity with the current location
- Battery level and discharge pattern (sudden vs. gradual)

Signals don't just add up — when multiple risk indicators occur together
(e.g., night, an unfamiliar area, no one nearby, and an accelerating pace),
the engine applies a compounding multiplier, because correlated risk
factors indicate something more significant than the sum of their parts.
The score decays gradually back to baseline when signals return to normal,
but escalates instantly when new danger signals appear — de-escalation is
gradual and earned; escalation is immediate.

### Anti-Coercion Check-In

When risk crosses into the Elevated tier, the app doesn't sound an alarm —
it quietly asks the user to confirm they're okay. The response mechanism
is deliberately strict: during setup, the user chooses a private safe word
known only to them. Only that exact word stands the alert down. Any other
response — including a reassuring "I'm fine" — is treated as a potential
coercion signal and immediately escalates to an SOS, on the reasoning that
a person forced to respond under duress can be made to type something
reassuring, but is far less likely to know or reveal an arbitrary private
word to their attacker. Three consecutive unanswered check-ins are treated
the same way.

### Manual Override

A press-and-hold SOS control is always available regardless of the current
risk tier, for situations the passive system doesn't catch on its own.

### Sharing Model

There's no login or account system — configuration (safe word, contacts,
mode) is stored on-device. Users choose between:
- **Solo** — nothing is ever shared with anyone except during a real SOS.
- **Connected** — a small Trusted Circle can be notified during a genuine
  emergency (Critical tier or SOS).

Ambient, always-on location sharing was deliberately excluded — it drains
battery, erodes privacy, and tends to cause notification fatigue for the
people receiving it, which over time leads users to disable safety features
altogether. Instead, a **Live Journey Share** session can be started
manually before a specific situation (e.g., a walk home at night) and ends
either manually or automatically on arrival — sharing stays scoped to
moments the user actually chooses, not continuous by default.

### Real Signals, With Honest Fallbacks

Where browser APIs genuinely allow it, signals are sourced from real device
data rather than simulated:
- Time of day — from the system clock
- Pace and stillness — derived from live GPS movement
- Route familiarity — computed against user-saved familiar locations
- Battery level and discharge pattern — from the Battery Status API where
  the browser supports it

Crowd density is intentionally left as a manual input in this version —
real-time crowd density has no reliable free data source and would require
either a paid location-density API or an existing base of live users
sharing location, neither of which is available here. Where a real signal
isn't available (permission denied, unsupported browser), the app falls
back to manual input and states this clearly in the interface rather than
failing silently.

## Architecture

There is no backend or database. All state — safe word, Trusted Circle,
saved locations, session state — lives in the browser's local storage.
This was a deliberate choice: it keeps the trust model simple (nothing
leaves the device except an explicit, user-initiated action) and avoids
the security surface of an account system for something this sensitive.

The scoring engine is written as pure functions, independent of the UI —
it takes a signal object and returns a score, tier, and a plain-language
explanation of what drove that score. This separation means the same
engine could be reused in a different frontend, a mobile app, or a backend
service without modification.

## Known Limitations

This is an early proof of concept, not a production-ready safety system,
and some gaps are worth stating plainly:

- **No real notification delivery.** Trusted Circle and SOS notifications
  are simulated in the UI. A production version would need a backend and
  a messaging service (e.g., Twilio, push notifications) to actually
  reach another device.
- **No real emergency dispatch integration.** The SOS flow surfaces
  tap-to-call links (112, 100 for India) rather than auto-dialing or
  integrating with dispatch systems, which would require official
  partnerships and infrastructure beyond this project's scope.
- **No area-level risk data.** Real crime/incident statistics (e.g., from
  public sources like NCRB) could inform location risk beyond personal
  familiarity, but weren't integrated here.
- **Coercion resistance has a hard limit.** No phone-based system can
  fully defend against a determined, in-person coercive attacker — a
  private safe word raises the cost of faking a stand-down, but doesn't
  eliminate it. This is treated as an honest constraint of the approach,
  not something the app claims to solve completely.

## Running Locally

```bash
npm install
npm run dev
```

Requires HTTPS (or localhost) for geolocation and battery API access, per
standard browser security requirements.

## Live Deployment

- **Production URL:** [https://safesignal-five.vercel.app](https://safesignal-five.vercel.app)
- **Deployment Mirror:** [https://safesignal-fdlffbafs-kavyasingla24-1235.vercel.app](https://safesignal-fdlffbafs-kavyasingla24-1235.vercel.app)

## Future Scope

### Genuinely Novel — Not Present in Current Market Apps

Most existing personal safety apps on the market today — including
established players like Life360, Noonlight, bSafe, and Safetipin — are
built around **manual triggers or static, pre-computed data**: you press a
button, or you check a neighborhood's safety score before you go. None of
them continuously fuse live behavioral signals into a single adaptive
risk state. The following are directions this project points toward that,
to our knowledge, no current consumer safety app implements:

- **Continuous multi-signal behavioral fusion, in real time.** Rather than
  a single static score or a manually-pressed alert, combining live pace,
  stillness, location familiarity, time, and device state into one
  constantly-updating composite score — with compounding logic that
  weighs *combinations* of signals more heavily than any single one.
  Existing apps score an area once, in advance; this scores a moment, as
  it happens.

- **A safe-word system where silence and false confirmation both fail
  closed.** Existing panic-button and check-in features generally treat
  "user pressed a button" or "user replied" as sufficient confirmation of
  safety. This project inverts that assumption: the alarm is the default
  state, and only a private word known solely to the user stands it down
  — a generic "I'm fine," a wrong word, or no response at all all
  continue the escalation. This is a meaningfully different trust model
  from anything found in the reviewed market apps, and one built
  specifically around the possibility of a coerced device.

- **Session-scoped sharing instead of always-on tracking.** Family-safety
  apps like Life360 are built around continuous, standing location
  visibility. This project deliberately avoids that model — sharing is
  either fully off (Solo), emergency-only (Critical/SOS), or explicitly
  time-boxed to a session the user starts herself (Live Journey Share).
  This targets a documented failure mode of the whole app category:
  always-on monitoring causes notification fatigue and privacy discomfort
  on both ends, which leads to features being disabled altogether.

- **A single scoring engine with swappable risk "lenses," rather than
  one-size-fits-all logic.** The same underlying engine could support
  materially different interpretations of the same signals — a threat
  lens for general use, a fall/medical lens for elderly users, a
  pregnancy-aware lens — as a configuration change rather than a
  separate app or rebuilt logic. Existing apps in this space tend to
  ship one fixed feature set rather than a reusable, re-weightable core.

### Planned Technical Additions

- **Predictive area-risk scoring from real historical data**, incorporating
  public incident data sources (e.g., NCRB crime statistics) as one input
  into the composite score, rather than relying solely on personal
  movement and familiarity signals.
- **Ambient distress-sound detection** using a pre-trained audio
  classification model (e.g., Google's YAMNet) to recognize sounds like
  screaming or breaking glass as an additional passive signal, without
  transcribing or storing any actual audio.
- **Duress-specific biometric confirmation** — for example, an alternate
  finger or a slightly altered spoken phrase that visually/audibly appears
  to be a normal "I'm fine" confirmation to an onlooker, but silently
  triggers escalation instead. This extends the existing safe-word concept
  into biometric and voice confirmation without weakening its coercion
  resistance.
- **Wearable device integration**, both for confirmation gestures that
  don't require unlocking a phone, and for physiological signals like
  heart-rate spikes as an additional real-time stress indicator.
- **Real backend and messaging integration** (e.g., Twilio, push
  notifications) so Trusted Circle and SOS alerts are actually delivered
  to another device, replacing the current UI-simulated notification flow.
- **Official emergency dispatch integration**, contingent on partnerships
  and access not available to an independent project — the current
  tap-to-call flow is an interim, honest substitute for this.
