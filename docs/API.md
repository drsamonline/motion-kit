# motion-kit — API reference

**Version 1.0.0.** **Springs, easings and transitions as numbers.** Zero dependencies. One file. The motion vocabulary the drsamonline apps keep hand-rolling — 127 files across 21 repos write their own `cubic-bezier`, and each one is slightly different.

Generated from the source in this repository: every name, argument and
note below is read out of the kit file, so it cannot describe a function
that is not there.

```js
<script src="motion-kit.js"></script>
Motion.DURATION(...)
// or: const Motion = require('./motion-kit.js')
```

## The surface (24 entries)

| Name | Arguments | What it does |
|---|---|---|
| `Motion.DURATION` | `()` | The three the whole design system is built on. |
| `Motion.ease` | `()` | — |
| `Motion.preset` | `(zeta, threshold, settleMs)` | zeta + threshold + settle in ms -> the stiffness/damping/mass that lands there. |
| `Motion.smooth` | `(settleMs)` | — |
| `Motion.snappy` | `(settleMs)` | — |
| `Motion.bouncy` | `(settleMs)` | — |
| `Motion.SWITCH_THUMB` | `()` | The one hand-tuned spring in the system: the switch thumb. |
| `Motion.spring` | `(opts)` | A spring you can evaluate at any time. |
| `Motion.tween` | `(from, to, opts)` | A value that moves from one number to another over a duration. |
| `Motion.T.popup` | `()` | — |
| `Motion.T.tooltip` | `()` | — |
| `Motion.T.modal` | `()` | — |
| `Motion.T.backdrop` | `()` | — |
| `Motion.T.drawer` | `(from)` | — |
| `Motion.T.toast` | `(from)` | — |
| `Motion.T.collapse` | `()` | — |
| `Motion.toward` | `(tr, side)` | — |
| `Motion.stagger` | `(count, opts)` | Delays for a list, so a set of items arrives as a wave, not a block. |
| `Motion.css` | `(tr, prop)` | A preset as a CSS transition value, for the apps that animate in CSS. |
| `Motion.cssExit` | `(tr)` | — |
| `Motion.reduced` | `()` | — |
| `Motion.setReduced` | `(v)` | — |
| `Motion.apply` | `(el, tr, dir)` | — |
| `Motion.collapse` | `(el, open, opts)` | Collapse / expand a height, the one animation CSS cannot do from `auto`. |

## Notes

- Zero dependencies, one file, no build step: it works from `file://`, from a
  `<script>` tag and from Node.
- The version above is the `VERSION` file in this repository; a pinned copy is
  what an app vendors.
