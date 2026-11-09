/* motion-kit — springs, easings and transitions as numbers. Zero dependencies.
 *
 * The motion vocabulary behind every drsamonline app: the durations, the easing
 * curves and the transition presets, so an app stops hand-rolling cubic-bezier.
 *
 *   var M = require("./motion-kit.js");
 *   el.style.transition = "opacity " + M.css(M.transition.modal);
 *   M.apply(el, M.transition.popup, "enter");
 *
 * Values ported from lobe-mygo (github.com/lobehub/lobe-mygo) pkg/motion, which
 * is the Lobe UI motion language: same curves, same spring constants, same
 * presets. The Go code draws on the GPU; these are the numbers, in JavaScript.
 *
 * PolyForm Noncommercial 1.0.0. (c) 2026 Dr Sohil Momin.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Motion = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  var M = { version: "1.0.0" };

  /* ---------- durations ---------- */
  /* The three the whole design system is built on. */
  M.DURATION = { fast: 100, mid: 200, slow: 300 };

  /* ---------- cubic-bezier ---------- */
  /* UnitBezier, solved the way a browser solves it: x is the parameter, and the
     curve is inverted for t before y is read. Newton first, bisection when the
     derivative is too flat to trust - the same approach as WebKit's UnitBezier,
     so a curve here matches the same curve in CSS. */
  function bezier(x1, y1, x2, y2) {
    var CX = 3 * x1, BX = 3 * (x2 - x1) - CX, AX = 1 - CX - BX;
    var CY = 3 * y1, BY = 3 * (y2 - y1) - CY, AY = 1 - CY - BY;

    function sampleX(t) { return ((AX * t + BX) * t + CX) * t; }
    function sampleY(t) { return ((AY * t + BY) * t + CY) * t; }
    function sampleDX(t) { return (3 * AX * t + 2 * BX) * t + CX; }

    function solveX(x) {
      var t = x, i, d, x2;
      for (i = 0; i < 8; i++) {
        x2 = sampleX(t) - x;
        if (Math.abs(x2) < 1e-6) return t;
        d = sampleDX(t);
        if (Math.abs(d) < 1e-6) break;
        t -= x2 / d;
      }
      var lo = 0, hi = 1;
      t = x;
      for (i = 0; i < 20; i++) {
        x2 = sampleX(t);
        if (Math.abs(x2 - x) < 1e-6) return t;
        if (x2 < x) lo = t; else hi = t;
        t = (lo + hi) / 2;
      }
      return t;
    }

    function ease(p) {
      if (p <= 0) return 0;
      if (p >= 1) return 1;
      return sampleY(solveX(p));
    }
    ease.css = "cubic-bezier(" + x1 + ", " + y1 + ", " + x2 + ", " + y2 + ")";
    ease.points = [x1, y1, x2, y2];
    return ease;
  }
  M.cubicBezier = bezier;

  /* ---------- the ease set ---------- */
  /* Exactly the curves in pkg/motion/easing.go. */
  var CURVES = {
    soft: [0.32, 0.72, 0, 1],
    exit: [0.4, 0, 1, 1],
    out: [0.215, 0.61, 0.355, 1],
    inOut: [0.645, 0.045, 0.355, 1],
    outBack: [0.12, 0.4, 0.29, 1.46],
    outQuint: [0.23, 1, 0.32, 1],
    outCirc: [0.08, 0.82, 0.17, 1],
    css: [0.25, 0.1, 0.25, 1],
    cssIn: [0.42, 0, 1, 1],
    toast: [0.22, 1, 0.36, 1],
    linear: [0, 0, 1, 1]
  };
  M.ease = {};
  Object.keys(CURVES).forEach(function (name) {
    var c = CURVES[name];
    M.ease[name] = bezier(c[0], c[1], c[2], c[3]);
  });

  /* ---------- springs ---------- */
  /* A spring is a damped harmonic oscillator pulled from 0 to 1. zeta is the
     damping ratio: 1 is critical (no overshoot), below 1 overshoots, above 1
     crawls in. stepResponse and unitSettle are the exact port of pkg/motion:
     a settle time is converted into stiffness and damping, so "smooth over
     300ms" means what it says. */
  function stepResponse(zeta, t) {
    if (zeta >= 1) return 1 - Math.exp(-t) * (1 + t);
    var wd = Math.sqrt(1 - zeta * zeta);
    return 1 - Math.exp(-zeta * t) * (Math.cos(wd * t) + (zeta / wd) * Math.sin(wd * t));
  }
  M.stepResponse = stepResponse;

  /* The last time the unit spring is outside the threshold, in seconds. */
  function unitSettle(zeta, threshold) {
    var STEP = 0.0005, HORIZON = 60, last = 0, t;
    for (t = 0; t < HORIZON; t += STEP) {
      if (Math.abs(stepResponse(zeta, t) - 1) > threshold) last = t;
    }
    return last;
  }
  M.unitSettle = unitSettle;

  /* zeta + threshold + settle in ms -> the stiffness/damping/mass that lands there. */
  M.preset = function (zeta, threshold, settleMs) {
    var omega = unitSettle(zeta, threshold) / (settleMs / 1000);
    return { stiffness: omega * omega, damping: 2 * zeta * omega, mass: 1 };
  };

  M.smooth = function (settleMs) { return M.preset(1, 0.001, settleMs == null ? 300 : settleMs); };
  M.snappy = function (settleMs) { return M.preset(0.8, 0.001, settleMs == null ? 250 : settleMs); };
  M.bouncy = function (settleMs) { return M.preset(0.7, 0.003, settleMs == null ? 280 : settleMs); };

  /* The one hand-tuned spring in the system: the switch thumb. */
  M.SWITCH_THUMB = { stiffness: 360, damping: 24, mass: 1 };

  /* A spring you can evaluate at any time. */
  M.spring = function (opts) {
    var o = opts || {};
    var k = o.stiffness == null ? 360 : o.stiffness;
    var c = o.damping == null ? 24 : o.damping;
    var m = o.mass == null ? 1 : o.mass;

    var w0 = Math.sqrt(k / m);
    var zeta = c / (2 * Math.sqrt(k * m));

    function at(ms) {
      var t = Math.max(0, ms) / 1000;
      if (t === 0) return 0;
      if (zeta < 1) {
        var wd = w0 * Math.sqrt(1 - zeta * zeta);
        return 1 - Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + ((zeta * w0) / wd) * Math.sin(wd * t));
      }
      if (zeta === 1) return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
      var wp = w0 * Math.sqrt(zeta * zeta - 1);
      return 1 - Math.exp(-zeta * w0 * t) *
        (Math.cosh(wp * t) + ((zeta * w0) / wp) * Math.sinh(wp * t));
    }

    /* When it is inside the threshold AND STAYS there - the last moment it is
       outside, which is what unitSettle means. For an under-damped spring the
       first crossing is not the settle: it crosses, overshoots, comes back. */
    function settle(threshold) {
      var th = threshold == null ? 0.001 : threshold;
      var STEP = 2, HORIZON = 20000, last = 0, ms;
      for (ms = 0; ms <= HORIZON; ms += STEP) {
        if (Math.abs(at(ms) - 1) > th) last = ms;
      }
      return last + STEP;
    }

    return { at: at, settle: settle, stiffness: k, damping: c, mass: m, zeta: zeta, omega: w0 };
  };

  /* ---------- tween ---------- */
  /* A value that moves from one number to another over a duration. */
  M.tween = function (from, to, opts) {
    var o = opts || {};
    var ease = typeof o.ease === "function" ? o.ease : M.ease[o.ease || "out"];
    var dur = o.duration == null ? M.DURATION.mid : o.duration;
    function at(ms) {
      var p = dur <= 0 ? 1 : Math.max(0, Math.min(1, ms / dur));
      return from + (to - from) * ease(p);
    }
    at.duration = dur;
    at.ease = ease;
    return at;
  };

  /* ---------- transitions ---------- */
  /* The seven presets from pkg/motion/transition.go. Each is plain data:
     { duration, ease, exitDuration, exitEase, enter, exit }, where a motion
     describes where the element starts from: scale, x, y, opacity, collapse,
     and xPercent/yPercent (a percentage of the element's own size). */

  var SIDE = { bottom: 0, top: 1, left: 2, right: 3 };
  M.SIDE = SIDE;

  function motion(o) {
    return {
      scale: o.scale == null ? 1 : o.scale,
      x: o.x || 0,
      y: o.y || 0,
      xPercent: o.xPercent || 0,
      yPercent: o.yPercent || 0,
      opacity: o.opacity == null ? 0 : o.opacity,
      collapse: !!o.collapse,
      flip: !!o.flip
    };
  }
  M.motion = motion;

  var T = {};
  M.transition = T;

  T.popup = function () {
    return {
      duration: 150, ease: M.ease.out, exitDuration: 75, exitEase: M.ease.cssIn,
      enter: motion({ scale: 0.96, y: -6, flip: true }),
      exit: motion({ scale: 0.96, y: -6, flip: true })
    };
  };

  T.tooltip = function () {
    var spring = M.bouncy(280);
    return {
      spring: spring, duration: M.spring(spring).settle(0.003), ease: M.ease.out,
      exitDuration: 100, exitEase: M.ease.exit,
      enter: motion({ scale: 0.97, y: -3, flip: true }),
      exit: motion({ scale: 0.97, y: -3, flip: true })
    };
  };

  T.modal = function () {
    return {
      duration: 220, ease: M.ease.soft, exitDuration: 120, exitEase: M.ease.exit,
      enter: motion({ scale: 0.97 }), exit: motion({ scale: 0.98 })
    };
  };

  T.backdrop = function () {
    return {
      duration: 180, ease: M.ease.soft, exitDuration: 180, exitEase: M.ease.soft,
      enter: motion({}), exit: motion({})
    };
  };

  T.drawer = function (from) {
    var side = from == null ? SIDE.right : from;
    function offscreen() {
      var m = motion({ opacity: 1 });
      if (side === SIDE.right) m.xPercent = 100;
      else if (side === SIDE.left) m.xPercent = -100;
      else if (side === SIDE.top) m.yPercent = -100;
      else m.yPercent = 100;
      return m;
    }
    return {
      duration: 300, ease: M.ease.soft, exitDuration: 220, exitEase: M.ease.exit,
      enter: offscreen(), exit: offscreen()
    };
  };

  T.toast = function (from) {
    var offset = from === SIDE.top ? -150 : 150;
    return {
      duration: 400, ease: M.ease.toast, exitDuration: 400, exitEase: M.ease.toast,
      enter: motion({ yPercent: offset, opacity: 1 }),
      exit: motion({ yPercent: offset, opacity: 1 })
    };
  };

  T.collapse = function () {
    return {
      duration: 200, ease: M.ease.out, exitDuration: 200, exitEase: M.ease.out,
      enter: motion({ collapse: true, y: 6 }), exit: motion({ collapse: true, y: -6 })
    };
  };

  /* Toward: a preset written for an element below its anchor (popup, tooltip)
     re-aimed at another side, so it starts at the anchor instead of away from it. */
  M.toward = function (tr, side) {
    function turn(m) {
      if (!m) return m;
      var t = motion(m);
      if (side === SIDE.top) t.y = -m.y;
      else if (side === SIDE.right) { t.x = m.y; t.y = 0; }
      else if (side === SIDE.left) { t.x = -m.y; t.y = 0; }
      return t;
    }
    var out = {};
    for (var k in tr) out[k] = tr[k];
    out.enter = turn(tr.enter);
    out.exit = turn(tr.exit);
    return out;
  };

  /* ---------- stagger ---------- */
  /* Delays for a list, so a set of items arrives as a wave, not a block. */
  M.stagger = function (count, opts) {
    var o = opts || {};
    var each = o.each == null ? 40 : o.each;
    var from = o.from || "first";
    var out = [], i, d;
    for (i = 0; i < count; i++) {
      if (from === "last") d = (count - 1 - i) * each;
      else if (from === "center") d = Math.abs(i - (count - 1) / 2) * each;
      else d = i * each;
      out.push(Math.round(d));
    }
    return out;
  };

  /* ---------- CSS ---------- */
  /* A preset as a CSS transition value, for the apps that animate in CSS. */
  M.css = function (tr, prop) {
    return (tr.duration || M.DURATION.mid) + "ms " + tr.ease.css;
  };
  M.cssExit = function (tr) {
    var e = tr.exitEase || tr.ease;
    return (tr.exitDuration || tr.duration || M.DURATION.mid) + "ms " + e.css;
  };

  /* ---------- reduced motion ---------- */
  /* Honour the system setting: an app that animates must not animate for
     someone who asked it not to. Node has no window, so this is false there,
     and setReduced lets a test drive it. */
  var forcedReduced = null;
  M.reduced = function () {
    if (forcedReduced !== null) return forcedReduced;
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return !!window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  };
  M.setReduced = function (v) { forcedReduced = v == null ? null : !!v; };

  /* ---------- DOM: apply a preset ---------- */
  /* The one DOM-touching function. It writes the enter (or exit) state to an
     element with a CSS transition, or jumps straight to the end state when
     reduced motion is on or the element cannot transition. Returns a promise
     that settles when the transition ends, so a caller can await it. */
  M.apply = function (el, tr, dir) {
    if (!el || !el.style) return Promise.resolve();
    var entering = dir !== "exit";
    var m = entering ? tr.enter : tr.exit;
    var dur = entering ? (tr.duration || M.DURATION.mid) : (tr.exitDuration || tr.duration || M.DURATION.mid);
    var ease = entering ? tr.ease : (tr.exitEase || tr.ease);
    var reduce = M.reduced();

    if (!m) m = motion({ opacity: 1 });

    function transform(v) {
      var parts = [];
      if (v.scale !== 1) parts.push("scale(" + v.scale + ")");
      if (v.xPercent) parts.push("translateX(" + v.xPercent + "%)");
      if (v.yPercent) parts.push("translateY(" + v.yPercent + "%)");
      if (v.x) parts.push("translateX(" + v.x + "px)");
      if (v.y) parts.push("translateY(" + v.y + "px)");
      return parts.length ? parts.join(" ") : "none";
    }

    if (reduce) {
      el.style.transition = "none";
      el.style.transform = "none";
      el.style.opacity = entering ? 1 : 0;
      return Promise.resolve();
    }

    el.style.transition = "transform " + dur + "ms " + ease.css + ", opacity " + dur + "ms " + ease.css;
    el.style.transform = transform(m);
    el.style.opacity = m.opacity;

    /* Next frame, move to the resting state (enter) or the hidden one (exit). */
    return new Promise(function (resolve) {
      var done = false;
      function finish() {
        if (done) return;
        done = true;
        el.removeEventListener && el.removeEventListener("transitionend", finish);
        resolve();
      }
      var raf = typeof requestAnimationFrame === "function" ? requestAnimationFrame : function (f) { return setTimeout(f, 16); };
      raf(function () {
        raf(function () {
          if (entering) {
            el.style.transform = "none";
            el.style.opacity = 1;
          }
          setTimeout(finish, dur + 30);
        });
      });
    });
  };

  /* Collapse / expand a height, the one animation CSS cannot do from `auto`. */
  M.collapse = function (el, open, opts) {
    if (!el || !el.style) return Promise.resolve();
    var o = opts || {};
    var tr = o.transition || T.collapse();
    var dur = o.duration == null ? tr.duration : o.duration;
    var ease = o.ease || tr.ease;
    if (M.reduced()) {
      el.style.transition = "none";
      el.style.height = open ? "auto" : "0px";
      el.style.overflow = open ? "" : "hidden";
      return Promise.resolve();
    }
    var from = open ? 0 : el.scrollHeight;
    el.style.overflow = "hidden";
    el.style.height = from + "px";
    return new Promise(function (resolve) {
      var raf = typeof requestAnimationFrame === "function" ? requestAnimationFrame : function (f) { return setTimeout(f, 16); };
      raf(function () {
        el.style.transition = "height " + dur + "ms " + ease.css;
        el.style.height = open ? el.scrollHeight + "px" : "0px";
        setTimeout(function () {
          if (open) el.style.height = "auto";
          el.style.overflow = open ? "" : "hidden";
          resolve();
        }, dur + 30);
      });
    });
  };

  return M;
});
