# Timer Reliability: ringing even when the browser is closed

*Design doc, June 2026. The product promise is "timers that actually ring."
This is the plan to make that true in every state a phone can be in.*

## 1. The physics

A closed browser executes zero JavaScript. No in-page trick — wake locks,
silent audio loops, service-worker `setTimeout` — survives the browser
process dying. Exactly **three mechanisms** can make a phone ring at time T
with the browser closed:

1. **Server-sent Web Push.** FCM/APNs keep an OS-level socket open. A `push`
   event wakes the service worker and shows a notification with sound, even
   when the browser is closed (Android: always; desktop: as long as the
   browser process runs in background, which Chrome does by default; iOS:
   only when the PWA is installed to the home screen, 16.4+).
2. **Handing the timer to the OS's native alarm system.** The Clock app
   already has alarm rights, survives reboots, and punches through silent
   mode. The web can reach it on Android (intent URL) and iOS (Shortcuts).
3. **An out-of-band channel** — SMS / phone call. Works on everything,
   costs money per message.

Chrome's Notification Triggers API (`TimestampTrigger`) would have solved
this natively; it was abandoned in 2021 and is not coming back. There is no
fourth mechanism.

## 2. What we have today, and exactly where it dies

| Layer | Exists? | Survives until |
|-------|---------|----------------|
| Web Audio beeps scheduled at `ctx.currentTime + s` | ✅ | Tab discarded by OS |
| Wake lock (screen stays on) | ✅ | User leaves the page |
| `localStorage` fireAt persistence + rehydrate on load | ✅ | Forever (state, not delivery) |
| SW `setTimeout` → `showNotification` | ✅ | **SW termination: ~30s idle on iOS, minutes on Android, instantly on browser close** |
| Web Push | ❌ | — |
| Native OS handoff | ❌ | — |

The gap is precisely the last two rows. Note the state layer is already
correct: we store `startedAt` + `total` and recompute against the wall
clock, so a reopened tab shows the truth. The problem is purely **delivery**.

## 3. The ladder (defense in depth — schedule ALL available layers, dedupe by notification tag)

```
L1  Foreground        Web Audio + wake lock                     (built)
L2  Backgrounded      SW setTimeout notification                (built)
L3  Browser closed    Server Web Push via delayed queue         (build this)
L4  No permission /   One-tap native OS timer handoff           (build this)
    iOS not installed   Android: intent URL · iOS: Shortcut
L5  Optional delight  "Text me when it's done" via Twilio       (later/maybe)
```

Layers are cheap to stack because they share one source of truth (the
`fireAt` epoch) and one notification `tag` per timer (`recdex-timer-${key}`),
so double-delivery collapses into a single alert.

## 4. L3 — Web Push with a delayed queue (the core build)

**Zero-database design.** The delayed message *is* the state:

```
start timer ──► POST /api/timer/schedule { subscription, fireAt, key, title, body }
                  └─► QStash publish, notBefore=fireAt, → returns messageId
                       (client stores messageId in localStorage next to the timer)

fireAt      ──► QStash calls POST /api/timer/fire (signed; verify signature)
                  └─► web-push sends { title, body, tag } to subscription,
                      Urgency: high  (punches through Android Doze)
                       └─► SW 'push' event → showNotification (sound, vibrate)

cancel      ──► POST /api/timer/cancel { messageId } → QStash DELETE
```

- **Scheduler**: Upstash QStash. Second-precision `notBefore`, free tier
  ~500 msgs/day (≈ hundreds of cooks/day), one env var (`QSTASH_TOKEN` +
  signing keys). Vercel cron can't do sub-minute, so a cron sweep would ring
  up to 90s late — unacceptable for "4 min per side." All-Supabase
  alternative: sub-minute `pg_cron` (every 10s) sweeping a `timers` table +
  Edge Function; more moving parts, keeps vendor count down. **Recommend
  QStash** — stateless, no table, no sweep.
- **Keys**: generate VAPID pair once (`npx web-push generate-vapid-keys`);
  `NEXT_PUBLIC_VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` in Vercel env.
- **SW additions** (~30 lines): `push` handler → `showNotification`;
  `pushsubscriptionchange` → re-subscribe + POST new subscription;
  keep existing `notificationclick` focus logic.
- **Client additions**: on first timer start, after the existing
  notification-permission grant, `registration.pushManager.subscribe()`
  (userVisibleOnly, VAPID key) and include the subscription in the schedule
  call. Schedule/cancel calls piggyback on existing timer start/dismiss
  paths. If `/api/timer/schedule` fails (offline kitchen!), L1/L2 still run —
  the ladder degrades, never breaks.
- **Security**: verify QStash signature on `/api/timer/fire`; rate-limit
  `/api/timer/schedule` (`applyRateLimit`, exists); cap fireAt at +24h.
  Add `qstash.upstash.io` to nothing (server-to-server, not CSP).
- **iOS condition**: push only works installed-to-home-screen. Detect
  (`!navigator.standalone` on iOS) and, on first timer start, show a one-time
  "Timers ring with your phone locked if you add RecDex to your Home
  Screen" sheet. After install, the same code path works.

## 5. L4 — Native OS handoff (the creative escape hatch, zero infra)

For users who deny notifications, won't install, or are on iOS Safari — let
the OS Clock app do what it was born to do.

**Android (works today, no permission, no install):** Chrome on Android
follows `intent:` URLs into system actions. One anchor sets a real Clock
timer that survives reboot:

```ts
// "Also set a phone timer" — shown on Android when push isn't available
const setNativeTimer = (seconds: number, label: string) =>
  `intent:#Intent;action=android.intent.action.SET_TIMER;` +
  `i.android.intent.extra.alarm.LENGTH=${seconds};` +
  `S.android.intent.extra.alarm.MESSAGE=${encodeURIComponent(label)};` +
  `B.android.intent.extra.alarm.SKIP_UI=true;end`
```

One tap → native timer named "Sear chicken — RecDex" is running. This is
alarm-grade reliability for free and nobody in the category does it.

**iOS (one-time setup, then one tap):** publish a "RecDex Timer" Apple
Shortcut (iCloud link) that accepts seconds as input and runs the Clock
"Start Timer" action. After the one-time add, cook mode deep-links:
`shortcuts://run-shortcut?name=RecDex%20Timer&input=${seconds}`. Surface it
as the iOS fallback in the same spot the Android intent button lives.
(Considered and rejected: `.ics` calendar alarms — 3 taps, minute-granular,
feels broken.)

## 6. Trust UI (make reliability *visible*)

Users don't trust web timers — show the ladder working. Under a running
timer, render the protection state:

> 🔔 Rings at **7:42 PM** · ✓ here · ✓ phone locked · *+ set phone timer too*

Each check reflects a real layer (page audio / push scheduled / native
handoff offered). When only L1 is active, the missing checks become the
upsell for permission/install — honest, not naggy. Also: Badging API dot on
the installed-PWA icon while a timer runs (2 lines, nice touch).

## 7. Rollout order

1. **Android intent handoff** — zero infra, additive UI, ships in an hour,
   immediately gives Android users perfect timers with the browser closed.
2. **Web Push via QStash** — needs Ben: QStash account (free), VAPID keygen,
   3 Vercel env vars. ~1 session of work: 2 API routes, ~30 SW lines,
   subscribe + schedule calls in cook mode.
3. **Trust UI row** under running timers (with #2).
4. **iOS Shortcut** — author + publish the shortcut, add the deep link.
5. *(maybe, later)* "Text me" via Twilio — costs ~$0.008/SMS; could be the
   first paid-tier feature. The marketing demo of a flip phone getting a
   RecDex timer text writes itself.

## 8. Rejected alternatives

| Idea | Why not |
|------|---------|
| Notification Triggers API | Abandoned by Chrome 2021, never shipped anywhere |
| Silent-audio loop keepalive | Survives backgrounding, not close; battery cost; push covers it |
| Vercel cron sweep (1/min) | Up to ~90s late — wrong for cooking precision |
| Periodic Background Sync | Chrome-only, browser-chosen timing (hours), not alarms |
| `.ics` calendar alarms | 3 taps, minute precision, feels broken |
| Keep a `timers` DB table | QStash delayed message already is durable state; less to operate |
