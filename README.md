# motion-kit

[![live](https://img.shields.io/badge/live-online-22c55e)](https://drsamonline.github.io/motion-kit/)
[![test](https://github.com/drsamonline/motion-kit/actions/workflows/test.yml/badge.svg)](https://github.com/drsamonline/motion-kit/actions/workflows/test.yml)
[![License: PolyForm Noncommercial 1.0.0](https://img.shields.io/badge/license-PolyForm%20Noncommercial%201.0.0-blue)](LICENSE)

**Springs, easings and transitions as numbers.** Zero dependencies. One file. The motion
vocabulary the drsamonline apps keep hand-rolling — 127 files across 21 repos write their
own `cubic-bezier`, and each one is slightly different.

## Use it

```js
var M = require("./motion-kit.js");           // Node; in a browser it is window.Motion

el.style.transition = "transform " + M.css(M.transition.modal);
M.apply(el, M.transition.popup(), "enter");   // returns a promise

var s = M.spring(M.smooth(300));              // a spring that settles in 300ms
s.at(150);                                    // -> 0.87..., halfway there
```

## What it does

- **11 easing curves** — the Lobe UI set: `soft`, `exit`, `out`, `inOut`, `outBack`,
  `outQuint`, `outCirc`, `css`, `cssIn`, `toast`, `linear`, each with its `.css` string so
  the same curve works in CSS and in a tween
- **a real cubic-bezier solver** — Newton, then bisection when the derivative is flat, the
  way a browser solves it, so `M.ease.out(0.25)` and CSS agree
- **springs you can ask for by settle time** — `M.smooth(300)`, `M.snappy(250)`,
  `M.bouncy(280)`: a damping ratio and a settle time converted into stiffness and damping,
  exactly as lobe-mygo's `pkg/motion` does it
- **`M.spring(opts).at(ms)`** — the analytic solution of the damped oscillator, under-,
  critically and over-damped, plus `.settle(threshold)` in milliseconds
- **seven transition presets** — `popup`, `tooltip`, `modal`, `backdrop`, `drawer(side)`,
  `toast(side)`, `collapse`, with their enter and exit states and timings
- **`M.toward(preset, side)`** — re-aim a preset written for an element below its anchor
- **`M.stagger(n, {each, from})`** — delays for a list, from the first, last or centre
- **`M.apply(el, preset, dir)`** and **`M.collapse(el, open)`** — the two DOM helpers, both
  returning promises, both honouring `prefers-reduced-motion`
- **`M.reduced()`** — the system setting, false in Node, forceable in tests

The numbers are ported from [lobe-mygo](https://github.com/lobehub/lobe-mygo) `pkg/motion`
(MIT), the Lobe UI motion language. The Go code animates a GPU surface; this is the same
vocabulary in JavaScript, where the DOM is the surface.

## Verified

```
node test-node.js
78 passed, 0 failed
```

The tests check the curve solver against CSS semantics, that `M.smooth(300)` really lands
within 1‰ of its target at 300 ms, that a critically damped spring never overshoots and a
bouncy one does, that every preset carries the timings from the source, and that reduced
motion short-circuits every DOM helper.

## Consumers

None yet — this is the first kit of the lobe-mygo gap pass. Candidate first adopters:
`conqueror-os`, `app-poets-studio`, `HMS` (all three already carry spring physics by hand).

## Support

<img src="docs/assets/support-portrait.jpg" width="72" height="72" alt="Dr. Sohil Momin" align="left" style="border-radius:50%;margin-right:1rem">

Free, offline, accountless — and staying that way. If it earned its keep:

| | |
|---|---|
| UPI (India) | `drsohilboi@ybl` — payee Dr. Sohil Momin, open amount, or scan [the QR](docs/assets/upi-qr.svg) |
| Ko-fi | [ko-fi.com/matneo](https://ko-fi.com/matneo) |
| PayPal | [paypal.me/drsohilmomin](https://paypal.me/drsohilmomin?locale.x=en_GB&country.x=IN) |
| My books | [Amazon author store](https://www.amazon.com/stores/author/B08ZT331LY/allbooks) |
| More apps | [drsamonline.github.io](https://drsamonline.github.io/) |
| Email | [sohilmomin2000@gmail.com](mailto:sohilmomin2000@gmail.com) |

Nothing is gated behind it: no accounts, no tracking, no network requests.

## Licence

PolyForm Noncommercial 1.0.0. (c) 2026 Dr Sohil Momin. Part of the Forge system — kits
open, orchestrator licensed.
