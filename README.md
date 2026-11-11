# motion-kit — merged into tokens-kit

**This kit is no longer maintained on its own.** On 2026-11-12 it was folded into
**[tokens-kit](https://github.com/drsamonline/tokens-kit)** as version 2.0.0, reached as
`T.motion.*`.

## Why

A token set without its motion is half a design system. `tokens-kit` says what a surface
looks like — colours, sizes, shadows — and this kit said how it moves. Consumers wanted both,
and these presets are meaningless without those durations.

The intended home was a new `design-kit`; the App has no permission to create repositories,
so `tokens-kit` keeps its name and carries both halves.

## What to use instead

```js
const T = require("tokens-kit.js");

T.motion.spring({ stiffness: 220, damping: 26 });   // the solver
T.motion.ease.out(0.25);                            // an easing curve
T.motion.transition.modal();                        // a ready preset
await T.motion.apply(el, T.motion.transition.modal(), "enter");
```

| Old | New |
|---|---|
| `Motion.ease` | `Tokens.motion.ease` |
| `Motion.spring` | `Tokens.motion.spring` |
| `Motion.preset` | `Tokens.motion.preset` |
| `Motion.transition` | `Tokens.motion.transition` |
| `Motion.DURATION` | `Tokens.motion.DURATION` |
| `Motion.motion()` | `Tokens.motion.motion()` |
| `Motion.apply()` | `Tokens.motion.apply()` |

This repository stays readable so that anything vendoring it still resolves; the code here is
frozen at the last version before the merge.
