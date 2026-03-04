---
trigger: always_on
---

# AI Agent Rules: UI/UX, Mobile-First & PWA (Aviation EFB App)

You are building an Electronic Flight Bag (EFB) and Logbook application in Next.js + Tailwind CSS. The app will be heavily used as an installed PWA on iPads and iPhones in airplane cockpits. 

1. MOBILE-FIRST & RESPONSIVE DESIGN (RWD)
- Always write Tailwind classes mobile-first. Define the base utility for small screens first, then scale up using `md:` and `lg:` breakpoints (e.g., `w-full md:w-1/2`).
- Assume the app will frequently be used in iPad Split View. Layouts must be fluid and flexible using Flexbox or CSS Grid.

2. NATIVE APP FEEL (ANTI-WEB BEHAVIORS)
- Apply `select-none` to all interactive UI elements (buttons, cards, headers) so text cannot be accidentally highlighted during turbulence. Allow text selection ONLY in input fields.
- Prevent accidental pull-to-refresh by ensuring the global layout handles `overscroll-behavior-y: none` appropriately.
- Handle iOS safe areas. Use Tailwind classes like `pb-safe`, `pt-safe` or standard CSS `env(safe-area-inset-bottom)` to ensure UI elements do not hide under the iPhone notch or home indicator.

3. TOUCH TARGETS & ERGONOMICS
- All clickable elements (buttons, dropdowns, list items) MUST have a minimum size of 44x44 pixels (Apple HIG standard). 
- Add ample padding around interactive icons.

4. MICRO-INTERACTIONS (HAPTICS)
- When generating code for primary actions (e.g., saving a logbook entry, calculating a route, activating a PRO account), include subtle haptic feedback using `if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);`.

5. OFFLINE-FIRST ARCHITECTURE MINDSET
- Remember the user might lose cellular reception at 3000 ft. 
- When generating search or filter functions for VFR waypoints/airports, do NOT default to calling a Next.js server API. Assume the data is queried from a local IndexedDB/Dexie instance unless instructed otherwise.
- Build UI components with loading states and offline fallbacks in mind.