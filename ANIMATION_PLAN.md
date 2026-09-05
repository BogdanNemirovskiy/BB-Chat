# BB Chat — Animation & Motion Plan

> Full motion pass for the app, phased from lowest to highest risk.
> Nothing here is implemented yet — review, then we build it phase by phase.

---

## Starting point

The codebase currently has **zero** `@keyframes` and **zero** `animation`
declarations in `src/`. The only motion that exists is a handful of hover
`transition`s on `$transition-base` (0.18s ease) and the fade-out on
`DemoBanner`. Clean slate.

---

## Approach & assumptions

**No new dependencies.** Everything below is pure CSS transitions/keyframes plus
the "state flag → CSS class → delayed unmount" pattern already established in
`src/components/common/DemoBanner.jsx:16-26`. This matches existing code style
and keeps the CRA bundle untouched.

> If we'd rather have spring physics and gesture-driven transitions, Framer
> Motion would make Phase 3 and 4 substantially easier — that changes this plan.

### Three rules that separate "has animations" from "feels good"

1. **Animate only `transform` and `opacity`.** Never `width`, `height`, `top`,
   `margin`, or `box-shadow` in anything that runs frequently. One deliberate
   exception, noted in item 10.
2. **Entrances decelerate, exits accelerate — and exits are faster.** Things
   arriving should settle; things leaving should get out of the way. Symmetric
   timing is the #1 reason motion feels sluggish.
3. **Nothing over ~300ms.** In a chat app these actions happen dozens of times
   per session. What feels "elegant" the first time feels slow the fortieth.

---

## PHASE 0 — Foundations

Everything else depends on this. Do it first.

### A. Extend the motion section of `src/styles/_tokens.sass:48-50`

```sass
// ── Motion ───────────────────────────────────────────────────
$transition-base: 0.18s ease        // existing — hover / color / bg micro-interactions

$duration-fast:     120ms           // press feedback, icon toggles
$duration-entrance: 260ms           // things arriving
$duration-exit:     170ms           // things leaving — deliberately quicker

// Decelerate on the way in, accelerate on the way out.
$ease-out-soft: cubic-bezier(0.16, 1, 0.3, 1)
$ease-in-soft:  cubic-bezier(0.7, 0, 0.84, 0)
```

### B. Global reduced-motion guard in `src/index.sass`

Non-negotiable, and it's 5 lines:

```sass
@media (prefers-reduced-motion: reduce)
    *, *::before, *::after
        animation-duration: 0.01ms !important
        animation-iteration-count: 1 !important
        transition-duration: 0.01ms !important
        scroll-behavior: auto !important
```

### C. Keyframes must live inside each `.module.sass` that uses them

CSS Modules localizes `animation-name`. A keyframe defined in one module and
referenced from another **silently breaks**. The clean fix is a shared mixin in
a new `src/styles/_motion.sass` that *emits* keyframes into whichever module
includes it:

```sass
@mixin rise-in-keyframes
    @keyframes rise-in
        from
            opacity: 0
            transform: translateY(10px)
        to
            opacity: 1
            transform: translateY(0)
```

Costs a few duplicated bytes per module; buys correctness and one source of truth.

---

## PHASE 1 — Quick wins (CSS-only, no logic changes)

All mount-triggered keyframes on elements that are **already** conditionally
rendered, so no JSX changes except where noted.

### 1. Search result appears
- **File:** `src/components/Chat/Sidebar.module.sass:96` (`.found__user`)
- `animation: rise-in $duration-entrance $ease-out-soft` with a `translateY(-6px)`
  start, so it reads as dropping out of the search field above it.

### 2. Demo banner entrance
- **File:** `src/components/common/DemoBanner.module.sass`
- Already animates its exit but snaps in. Add a matching entrance keyframe.
- ⚠️ **Detail that matters:** the exit uses
  `transform: translateX(-50%) translateY(0.5rem)` while the base uses
  `translateX(-50%)`. The entrance keyframe **must** use an identical transform
  function order (unify both to `translate(-50%, ...)`) or the element jumps
  between the keyframe's end state and the transition's start state.

### 3. Sign-in page stagger
- **File:** `src/components/Login/Signin.jsx:120-166`
- Apply `rise-in` to `.logo`, `.sign_in__text`, `.demo__container`, `form` with
  `animation-delay` of `0 / 60ms / 120ms / 180ms` and `animation-fill-mode: both`.
- The `both` is what stops elements flashing at full opacity before their turn.
- Sequence ends at 440ms — under the point where a first impression starts to
  feel like a loading screen.

### 4. Sign-in error gets noticed
- **File:** `src/components/Login/Signin.jsx:143`
- 3-step keyframe (`translateX(-4px) → 3px → 0`) combined with a fade.
- Not a violent shake — one damped oscillation reads as "attention" rather than
  "error alarm".

### 5. 404 icon idles
- **File:** `src/components/error/ErrorElement.jsx:11-16`
- Slow infinite float (`translateY(0 → -6px → 0)`, 2.6s, `ease-in-out`).
- Iconify's `<Icon>` accepts `className` directly (codebase already passes
  `style` to it), so this is one added prop.
- The global reduced-motion rule kills the infinite loop automatically.

### 6. Send button press
- **File:** `src/components/Chat/MessageBoard.module.sass:88-91` (`.baseline__send`)
- Pure `:active { transform: scale(0.88) }` with a `$duration-fast` transition. No JS.
- **Highest ratio of "feels responsive" to lines of code in the whole plan**,
  especially on touch.

### 7. Avatar fade-in
- **File:** `src/components/common/Avatar.jsx:37-44`
- `onLoad` → sets a `loaded` class → `opacity: 0 → 1` over `$duration-fast`.
- Kills the flash-in as Cloudinary photos arrive, and makes the initials
  fallback and the photo feel like the same component.

### 8. Hover refinement (existing code)
- **File:** `src/components/Chat/Sidebar.module.sass:83-94` (`.user__item`)
- Currently `transform: scale(1.015)` on hover. Scaling a flex row containing
  text causes subpixel shimmer on the username.
- `translateX(3px)` gives the same "responds to me" signal with crisper text.

---

## PHASE 2 — Show/hide toggles (needs enter *and* exit)

React unmounts instantly, so an exit animation requires keeping the node in the
DOM until it finishes. Rather than repeat DemoBanner's `setTimeout` dance three
more times, add one small hook:

```js
// src/hooks/useDelayedUnmount.js  (new folder — flag if it should live elsewhere)
export function useDelayedUnmount(isOpen, exitMs) {
    // returns { mounted, closing }
    // mounted → keeps it in the DOM; closing → drives the exit class
}
```

### 9. Emoji picker
- **File:** `src/components/Chat/MessageBoard.jsx:246-259`
- **Enter:** `opacity 0→1` + `scale(0.95)→1` + `translateY(8px)→0`
- **`transform-origin: bottom right`** so it grows *out of* the emoji button
  rather than materializing in space. Origin-anchoring is what makes a popover
  feel attached to its trigger.
- **Exit:** reverse, at `$duration-exit`.

### 10. Mobile search toggle
- **File:** `src/components/Chat/Sidebar.jsx:198-217`
- **Option A (recommended):** crossfade — title fades/slides out left while the
  input fades/slides in from right, header height fixed. Cheap, no layout animation.
- **Option B (fancier):** input expands from the search icon (`width: 0 → 10rem`).
  This *does* animate `width` — normally rejected, but it's one small element on
  an explicit tap, so it's defensible. More fiddling to get right at the 400px
  breakpoint.

### 11. Inline profile editing
- **File:** `src/components/edit-profile/UserInfo.jsx:32-57`
- Crossfade between the display `<li>` and the edit row, plus confirm/cancel
  icons scaling in from `0.8`.
- ⚠️ Keep the row height fixed during the swap or the whole list jumps.

---

## PHASE 3 — Message bubbles (the important one)

- **File:** `src/components/Chat/MessageBoard.jsx:222-243`

### The animation

Bubbles arrive **from their own side** — sent from the right, received from the
left — with a slight scale-up:

```sass
@keyframes bubble-in-sent
    from
        opacity: 0
        transform: translate(12px, 6px) scale(0.96)
    to
        opacity: 1
        transform: translate(0, 0) scale(1)
```

`transform-origin: bottom right` for sent, `bottom left` for received.
260ms, `$ease-out-soft`.

### The hard part: only animate genuinely new messages

A naive mount animation makes the **entire chat history cascade in** every time
you open a chat. 50 bubbles animating at once looks broken. The snapshot handler
must distinguish initial load from live arrivals:

```jsx
const animatedIds = useRef(new Map()); // id -> isNew, computed once and sticky
const isInitialLoad = useRef(true);

// reset both when selectedChat changes

const unsubscribe = onSnapshot(q, (snapshot) => {
    const msgs = snapshot.docs.map((doc) => {
        if (!animatedIds.current.has(doc.id)) {
            animatedIds.current.set(doc.id, !isInitialLoad.current);
        }
        return { id: doc.id, isNew: animatedIds.current.get(doc.id), ...doc.data() };
    });
    isInitialLoad.current = false;
    setMessages(msgs);
});
```

### ⚠️ Why the flag must be sticky (the subtle bug)

`serverTimestamp()` means every sent message fires **two** snapshots — first with
`createdAt: null` (the "Sending..." state), then again when the server timestamp
resolves. If `isNew` were recomputed per snapshot, the class would be stripped
mid-animation and the bubble would snap to its final position. Caching the
verdict per message id the first time it's seen prevents that.

### ⚠️ Watch for

`scrollToBottom` fires on every `messages` change with `behavior: "smooth"`,
running concurrently with the bubble's `translateY`. Test that the scroll lands
cleanly — if it comes up a few pixels short, drop the Y component and keep only
the X-offset + scale.

---

## PHASE 4 — Mobile page transition

- **File:** `src/components/pages/ChatPage.jsx:30-44` (the ternary)

### Recommended (pragmatic)

Direction-aware slide-in on whichever panel mounts. Opening a chat slides
MessageBoard in from the right; going back slides Sidebar in from the left. The
outgoing panel just unmounts — no cross-fade — which is ~90% of the perceived
quality for ~20% of the work.

Requires two changes:
- `direction` state in ChatPage, set to `'forward'` in `handleSelectChat` and
  `'back'` in a new wrapped handler.
- `src/components/Chat/MessageBoard.jsx:197` currently calls `setSelectedChat(null)`
  directly, bypassing ChatPage. Pass it a wrapped `onBack` prop instead so
  ChatPage can record the direction.

### Stretch — true native feel (deferred)

Wrap both panels in a `position: relative; overflow: hidden` container,
absolutely position both, keep the outgoing one mounted during the transition,
and slide them together (incoming `100% → 0`, outgoing `0 → -30%` with a slight
dim). This is the real iOS push transition. It's a genuine layout restructure of
ChatPage — only worth doing after Phase 4-simple is in and felt on a device.

---

## 🟡 FLAGGED — not strictly animation

### Selected chat is never indicated

`.selected_user__item` in `src/components/Chat/Sidebar.module.sass:114-126` is
fully styled — gold left border, raised background — but **never referenced in
`Sidebar.jsx`**. The sidebar doesn't indicate which chat is open at all. On
desktop, where both panels are visible simultaneously, that's a real usability
gap, not a polish one.

Wiring it up is ~10 lines (pass the active `chatId` down from ChatPage,
conditional className), and *then* the border can animate in. Belongs in Phase 1,
but it's a small feature addition rather than pure animation — needs a decision.

### Two unrelated things worth fixing while in these files

- `.messages` is declared **twice** in `src/components/Chat/MessageBoard.module.sass`
  with conflicting heights (`78vh` then `76vh`; the second wins).
- Leftover `console.log`s in the resize effect at `src/components/Chat/Sidebar.jsx:105`
  and `:110`.

---

## Verification

Per project convention, CSS-only changes get made and left for visual review —
no screenshot verification. The logic changes (Phase 3 snapshot tracking,
Phase 4 direction state, the delayed-unmount hook) get verified properly.
Dev server / builds only on request.

**Manual checklist:**

- [ ] All four breakpoints: `>768`, `600–768`, `<600`, `<400`
- [ ] OS reduced-motion toggled on — everything instant, nothing broken
- [ ] A chat with 50+ messages: opening it must **not** cascade
- [ ] Send two messages rapidly: neither bubble snaps mid-animation
- [ ] Emoji panel close: no flash, no layout shift
- [ ] Sign-in stagger doesn't delay the first interactive element

---

## Order & risk

| Phase | Scope | Risk |
|---|---|---|
| 0 + 1 | Tokens, reduced-motion, 8 CSS-only wins | Very low |
| 2 | 3 toggles + shared hook | Low |
| 3 | Message bubbles | Medium — snapshot logic |
| 4 | Mobile transition (simple) | Medium — prop refactor |
| 4b | Dual-panel push | Deferred |
