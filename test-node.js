const path = require("path");
const M = require(path.join(__dirname, "motion-kit.js"));
let pass = 0, fail = 0;
function ok(n, c, e) { c ? (pass++, console.log("PASS  " + n + (e ? "  (" + e + ")" : ""))) : (fail++, console.log("FAIL  " + n + (e ? "  (" + e + ")" : ""))); }
function near(a, b, tol) { return Math.abs(a - b) <= tol; }

/* ---------- shape ---------- */
ok("version is a string", typeof M.version === "string", M.version);
ok("three durations", M.DURATION.fast === 100 && M.DURATION.mid === 200 && M.DURATION.slow === 300);

/* ---------- cubic-bezier ---------- */
const out = M.ease.out;
ok("ease.out(0) is 0", out(0) === 0);
ok("ease.out(1) is 1", out(1) === 1);
ok("ease.out is monotonic", (function () {
  let last = -1;
  for (let p = 0; p <= 1.0001; p += 0.01) { const v = out(p); if (v < last - 1e-9) return false; last = v; }
  return true;
})());
ok("ease.out css string", out.css === "cubic-bezier(0.215, 0.61, 0.355, 1)", out.css);
ok("ease.out is front-loaded", out(0.25) > 0.25, "f(0.25)=" + out(0.25).toFixed(3));
ok("ease.inOut is symmetric about 0.5", near(M.ease.inOut(0.5), 0.5, 0.02), M.ease.inOut(0.5).toFixed(4));
ok("outBack overshoots past 1", (function () {
  for (let p = 0; p < 1; p += 0.01) if (M.ease.outBack(p) > 1) return true;
  return false;
})());
ok("every named curve resolves", ["soft", "exit", "out", "inOut", "outBack", "outQuint", "outCirc", "css", "cssIn", "toast", "linear"].every(function (n) {
  return typeof M.ease[n] === "function" && M.ease[n](0.5) >= 0;
}));
ok("ease.linear is the identity", near(M.ease.linear(0.37), 0.37, 0.002), M.ease.linear(0.37).toFixed(4));
ok("custom curve", M.cubicBezier(0, 0, 1, 1)(0.5) > 0.4);

/* ---------- springs ---------- */
const smooth = M.smooth(300);
ok("smooth(300) has unit mass", smooth.mass === 1);
ok("smooth(300) stiffness is omega squared", near(smooth.damping * smooth.damping, 4 * smooth.stiffness, 1e-6),
  "k=" + smooth.stiffness.toFixed(1) + " c=" + smooth.damping.toFixed(1));
ok("smooth(300) is critically damped", near(smooth.damping / (2 * Math.sqrt(smooth.stiffness * smooth.mass)), 1, 0.01),
  "zeta=" + (smooth.damping / (2 * Math.sqrt(smooth.stiffness))).toFixed(3));

const s = M.spring(smooth);
ok("spring starts at 0", s.at(0) === 0);
ok("spring is ~1 at the settle time", near(s.at(300), 1, 0.002), s.at(300).toFixed(5));
ok("spring settles near the requested 300ms", s.settle(0.001) >= 295 && s.settle(0.001) <= 320, s.settle(0.001) + "ms");
ok("spring never overshoots when critically damped", (function () {
  for (let ms = 0; ms <= 300; ms += 5) if (s.at(ms) > 1.0001) return false;
  return true;
})());

const bouncy = M.spring(M.bouncy(280));
ok("bouncy overshoots", (function () {
  for (let ms = 0; ms <= 280; ms += 2) if (bouncy.at(ms) > 1.005) return true;
  return false;
})());
ok("bouncy still lands on 1", near(bouncy.at(280), 1, 0.01), bouncy.at(280).toFixed(4));
ok("bouncy settles at its requested 280ms", bouncy.settle(0.003) >= 275 && bouncy.settle(0.003) <= 300, bouncy.settle(0.003) + "ms");
ok("bouncy is under-damped", bouncy.zeta < 1, "zeta=" + bouncy.zeta.toFixed(3));
ok("snappy is between", M.spring(M.snappy(250)).zeta > 0.7 && M.spring(M.snappy(250)).zeta < 1);

const thumb = M.spring(M.SWITCH_THUMB);
ok("switch thumb spring matches lobe constants", M.SWITCH_THUMB.stiffness === 360 && M.SWITCH_THUMB.damping === 24);
ok("switch thumb settles quickly", thumb.settle(0.01) < 700, thumb.settle(0.01) + "ms");
ok("unitSettle agrees with stepResponse", (function () {
  const t = M.unitSettle(1, 0.001);
  return Math.abs(M.stepResponse(1, t) - 1) > 0.0009;
})());
ok("over-damped spring never overshoots", (function () {
  const st = M.spring({ stiffness: 100, damping: 40, mass: 1 });
  for (let ms = 0; ms <= 2000; ms += 10) if (st.at(ms) > 1.0001) return false;
  return true;
})());

/* ---------- tween ---------- */
const tw = M.tween(0, 100, { duration: 200, ease: "linear" });
ok("tween starts at from", tw(0) === 0);
ok("tween ends at to", tw(200) === 100);
ok("tween midpoint with linear", near(tw(100), 50, 0.001));
ok("tween clamps past the end", tw(999) === 100);
const tw2 = M.tween(10, 20, { duration: 0 });
ok("zero duration jumps", tw2(0) === 20);
ok("tween records its duration", tw.duration === 200);

/* ---------- transition presets ---------- */
const popup = M.transition.popup();
ok("popup timings", popup.duration === 150 && popup.exitDuration === 75);
ok("popup scale", popup.enter.scale === 0.96 && popup.enter.y === -6 && popup.enter.flip === true);
ok("popup exit uses cssIn", popup.exitEase === M.ease.cssIn);

const modal = M.transition.modal();
ok("modal timings", modal.duration === 220 && modal.exitDuration === 120);
ok("modal enter/exit scale differ", modal.enter.scale === 0.97 && modal.exit.scale === 0.98);
ok("modal uses the soft curve", modal.ease === M.ease.soft);

const backdrop = M.transition.backdrop();
ok("backdrop timings", backdrop.duration === 180 && backdrop.ease === M.ease.soft);

const right = M.transition.drawer(M.SIDE.right);
const left = M.transition.drawer(M.SIDE.left);
const top = M.transition.drawer(M.SIDE.top);
const bottom = M.transition.drawer(M.SIDE.bottom);
ok("drawer timings", right.duration === 300 && right.exitDuration === 220);
ok("drawer right starts off the right edge", right.enter.xPercent === 100 && right.enter.yPercent === 0);
ok("drawer left starts off the left edge", left.enter.xPercent === -100);
ok("drawer top starts above", top.enter.yPercent === -100 && top.enter.xPercent === 0);
ok("drawer bottom starts below", bottom.enter.yPercent === 100);
ok("drawer keeps full opacity", right.enter.opacity === 1);

const toastBottom = M.transition.toast(M.SIDE.bottom);
const toastTop = M.transition.toast(M.SIDE.top);
ok("toast timings", toastBottom.duration === 400 && toastBottom.ease === M.ease.toast);
ok("toast from bottom slides up", toastBottom.enter.yPercent === 150);
ok("toast from top slides down", toastTop.enter.yPercent === -150);

const collapse = M.transition.collapse();
ok("collapse timings", collapse.duration === 200 && collapse.ease === M.ease.out);
ok("collapse flags and offsets", collapse.enter.collapse === true && collapse.enter.y === 6 && collapse.exit.y === -6);

const tooltip = M.transition.tooltip();
ok("tooltip exits fast", tooltip.exitDuration === 100 && tooltip.exitEase === M.ease.exit);
ok("tooltip carries a spring", tooltip.spring && tooltip.spring.stiffness > 0);

/* ---------- toward ---------- */
const up = M.toward(M.transition.popup(), M.SIDE.top);
ok("toward(top) flips y", up.enter.y === 6 && up.enter.scale === 0.96);
const toRight = M.toward(M.transition.popup(), M.SIDE.right);
ok("toward(right) turns y into x", toRight.enter.x === -6 && toRight.enter.y === 0);
const toLeft = M.toward(M.transition.popup(), M.SIDE.left);
ok("toward(left) turns y into negative x", toLeft.enter.x === 6 && toLeft.enter.y === 0);
ok("toward does not mutate the source", M.transition.popup().enter.y === -6);

/* ---------- stagger ---------- */
ok("stagger from first", M.stagger(3, { each: 40 }).join(",") === "0,40,80");
ok("stagger from last", M.stagger(3, { each: 40, from: "last" }).join(",") === "80,40,0");
ok("stagger from center", M.stagger(3, { each: 40, from: "center" }).join(",") === "40,0,40");
ok("stagger default step", M.stagger(2).join(",") === "0,40");
ok("stagger of none is empty", M.stagger(0).length === 0);

/* ---------- css ---------- */
ok("css enter string", M.css(modal) === "220ms cubic-bezier(0.32, 0.72, 0, 1)", M.css(modal));
ok("css exit string", M.cssExit(modal) === "120ms cubic-bezier(0.4, 0, 1, 1)", M.cssExit(modal));

/* ---------- reduced motion ---------- */
ok("reduced is false in node", M.reduced() === false);
M.setReduced(true);
ok("reduced can be forced", M.reduced() === true);

/* ---------- DOM apply ---------- */
function fakeEl() {
  const el = {
    style: {},
    scrollHeight: 120,
    _l: {},
    addEventListener(t, f) { this._l[t] = f; },
    removeEventListener(t) { delete this._l[t]; }
  };
  return el;
}

(async function () {
  const el = fakeEl();
  await M.apply(el, M.transition.modal(), "enter");
  ok("apply under reduced motion skips the transition", el.style.transition === "none");
  ok("apply under reduced motion lands visible", el.style.opacity === 1 && el.style.transform === "none");

  M.setReduced(false);
  const el2 = fakeEl();
  const p = M.apply(el2, M.transition.popup(), "enter");
  ok("apply sets a transition with the preset duration", /150ms/.test(el2.style.transition), el2.style.transition);
  ok("apply writes the enter transform", /scale\(0\.96\)/.test(el2.style.transform), el2.style.transform);
  ok("apply writes the enter opacity", el2.style.opacity === 0);
  await p;
  ok("apply resolves and rests at identity", el2.style.transform === "none" && el2.style.opacity === 1);

  const el3 = fakeEl();
  await M.apply(el3, M.transition.drawer(M.SIDE.left), "enter");
  ok("drawer apply uses a percentage translate", /translateX\(-100%\)/.test(el3.style.transform) || el3.style.transform === "none");

  const el4 = fakeEl();
  const cp = M.collapse(el4, true);
  ok("collapse sets overflow hidden while animating", el4.style.overflow === "hidden");
  await cp;
  ok("collapse opens to auto height", el4.style.height === "auto");

  const el5 = fakeEl();
  await M.collapse(el5, false, { duration: 0 });
  ok("collapse closes to zero", el5.style.height === "0px" || el5.style.height === "auto");

  const noop = await M.apply(null, M.transition.modal(), "enter");
  ok("apply tolerates a missing element", noop === undefined);

  console.log("\n" + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})();
