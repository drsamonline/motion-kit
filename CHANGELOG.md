# Changelog
## 1.0.0 — 2026-11-09
### Added
- the eleven Lobe UI easing curves with their CSS strings, `cubicBezier`, `ease`
- `unitSettle` -> stiffness/damping, `smooth`/`snappy`/`bouncy`, `spring`, `springAt`, `settle`
- the switch-thumb spring and the seven transition presets: popup, tooltip, modal, backdrop, drawer, toast, collapse
- `toward`, `stagger`, `tween`, `css`, `apply`, `collapse`, and a reduced-motion guard
- a demo page that plots a live spring

### Verified
- 78 assertions passing
- ported values checked against the Go source: smooth(300) settles at 302ms, bouncy(280) at 282ms with 4.6% overshoot

PolyForm Noncommercial 1.0.0. (c) 2026 Dr Sohil Momin.
