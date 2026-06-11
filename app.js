/* ============================================================
   FOURSIDE STUDIO — Option A · one continuous shot
   assemble square → four sides → logo → ZOOM OUT to reveal the
   Premiere screen → scrub the timeline → pull back to a desk.
   ============================================================ */
gsap.registerPlugin(ScrollTrigger);
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const isMobile = matchMedia("(max-width: 760px)").matches;
const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (x) => x < 0 ? 0 : x > 1 ? 1 : x;
const pad = (n) => String(n).padStart(2, "0");
const tcFmt = (frames, fps = 24) => {
  const tf = Math.max(0, Math.floor(frames)); const s = Math.floor(tf / fps);
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}:${pad(tf % fps)}`;
};

if (!reduce) gsap.utils.toArray(".pool").forEach((el, i) => {
  gsap.to(el, { xPercent: gsap.utils.random(-12, 12), yPercent: gsap.utils.random(-12, 12),
    scale: gsap.utils.random(.85, 1.2), duration: gsap.utils.random(11, 18), ease: "sine.inOut", repeat: -1, yoyo: true, delay: i * .8 });
});

(function buildWave() {
  const wave = document.getElementById("wave"); if (!wave) return;
  let h = "";
  for (let i = 0; i < 240; i++) {
    const env = Math.sin((i / 240) * Math.PI);
    const v = (10 + Math.abs(Math.sin(i * 0.6) * 48) + Math.random() * 34) * (0.4 + env * 0.6);
    h += `<i style="height:${Math.min(100, v)}%"></i>`;
  }
  wave.innerHTML = h;
})();
(function buildRuler() {
  const r = document.getElementById("rulerStrip"); if (!r) return;
  let h = ""; const N = 25;
  for (let i = 0; i <= N; i++) { const x = (i / N) * 100; h += `<i style="left:${x}%"></i>`;
    if (i % 5 === 0) h += `<span style="left:${x}%">00:${pad(i * 10 % 60)}</span>`; }
  r.innerHTML = h;
})();

/* ---------- refs ---------- */
const monitor   = document.querySelector(".monitor");
const strips    = ["v1strip", "v2strip", "a1strip", "rulerStrip"].map(id => document.getElementById(id));
const v1clips   = [...document.querySelectorAll("#v1strip .clip")];
const playhead  = document.getElementById("playhead");
const progShots = [...document.querySelectorAll(".prog-shot")];
const binItems  = [...document.querySelectorAll("#bins .bin-item[data-d]")];
const progCap   = document.getElementById("progCap");
const progTc    = document.getElementById("progTc");
const tlTc       = document.getElementById("tlTc");

const SEQ = [
  { d: -1, n: "FOURSIDE",      s: "360° Creative Studio" },
  { d:  0, n: "MARKETING",     s: "Performance & Growth" },
  { d:  1, n: "BRANDING & PR", s: "Reputation & Reach" },
  { d:  2, n: "PRODUCTION",    s: "Film & Motion" },
  { d:  3, n: "DESIGN",        s: "Identity & UI" }
];

/* ---------- initial states ---------- */
gsap.set(".panel.top",    { yPercent: -900, z: -1400, rotateX: -110, rotateZ: -22, opacity: 0 });
gsap.set(".panel.bottom", { yPercent: 900,  z: 900,   rotateX: 120,  rotateZ: 18,  opacity: 0 });
gsap.set(".panel.left",   { xPercent: -1100,z: 700,   rotateY: 120,  rotateZ: 24,  opacity: 0 });
gsap.set(".panel.right",  { xPercent: 1100, z: -1100, rotateY: -120, rotateZ: -20, opacity: 0 });
gsap.set(".frame", { rotateY: 16, rotateX: -7, scale: 1.05 });
gsap.set(".scene", { opacity: 1 });
gsap.set(monitor, { opacity: 0, scale: 1.12, transformOrigin: "50% 50%" });
gsap.set([".ed-titlebar", ".ed-panel", ".timeline", ".prog-bar", ".prog-cap"], { opacity: 0 });
gsap.set([".room .wall", ".room .desk", ".stand", ".reveal-cta"], { opacity: 0 });
gsap.set(".room .desk", { y: 40 });

const SCRUB_A = 0.52, SCRUB_B = 0.863;   // progress window where the timeline scrubs
let lastZone = -1;

// align the assembling square to exactly where the program-monitor logo will sit,
// so the cross-dissolve has no double-image
function alignScene() {
  const sqEl = document.querySelector(".frame-logo img");
  const pgEl = document.querySelector(".prog-shot.brand img");
  if (!sqEl || !pgEl) return;
  gsap.set(".scene", { y: 0, scale: 1, transformOrigin: "50% 50%" });
  let sq = sqEl.getBoundingClientRect(); const pg = pgEl.getBoundingClientRect();
  if (sq.width) gsap.set(".scene", { scale: pg.width / sq.width });   // match logo size
  sq = sqEl.getBoundingClientRect();
  gsap.set(".scene", { y: (pg.top + pg.height / 2) - (sq.top + sq.height / 2) });   // match position
}
function onScrub(p) {
  const e = clamp01((p - SCRUB_A) / (SCRUB_B - SCRUB_A));
  const lane = document.querySelector("#v1strip").parentElement;
  const laneW = lane.clientWidth || 1;
  const x = -(laneW * 1.4) * e;
  strips.forEach(s => { if (s) s.style.transform = `translateX(${x}px)`; });
  playhead.style.left = (44 + laneW * 0.30) + "px";

  const zone = Math.min(4, Math.max(0, Math.floor(e * 5)));
  if (zone !== lastZone) {
    lastZone = zone; const cur = SEQ[zone];
    progShots.forEach(s => s.classList.toggle("on", +s.dataset.d === cur.d));
    binItems.forEach(it => it.classList.toggle("act", +it.dataset.d === cur.d));
    v1clips.forEach((c, i) => c.classList.toggle("live", i === zone));
    progCap.innerHTML = `<small>${cur.s}</small>${cur.n}`;
  }
  const tc = tcFmt(e * 5760);
  progTc.textContent = tc; tlTc.textContent = tc;
}

/* ---------- mobile: keep the touch scroll from fighting the pinned animation ---------- */
ScrollTrigger.config({ ignoreMobileResize: true });
if (isMobile) ScrollTrigger.normalizeScroll(true);

// render the whole animation on a fixed 1180x760 desktop canvas, scaled to fit the phone
// (keeps every element aligned exactly like the Mac version)
function setStage() {
  const st = document.querySelector(".stage");
  if (!st || !isMobile) return;
  const m = Math.min((window.innerWidth - 8) / 1180, (window.innerHeight - 8) / 820);
  st.style.setProperty("--m", m);
}
setStage();

/* ---------- the one continuous timeline ---------- */
const t = gsap.timeline({
  defaults: { ease: "power3.out" },
  scrollTrigger: { trigger: ".show", start: "top top", end: isMobile ? "+=480%" : "+=720%", scrub: reduce ? false : (isMobile ? 1 : 1),
    pin: true, anticipatePin: 1, invalidateOnRefresh: true,
    onUpdate: self => onScrub(self.progress), onRefresh: self => onScrub(self.progress) }
});

// ASSEMBLY (0–3)
t.to(".panel.top",    { yPercent: 0, z: 0, rotateX: 0, rotateZ: 0, opacity: 1, duration: 1 }, 0)
 .to(".panel.bottom", { yPercent: 0, z: 0, rotateX: 0, rotateZ: 0, opacity: 1, duration: 1 }, .05)
 .to(".panel.left",   { xPercent: 0, z: 0, rotateY: 0, rotateZ: 0, opacity: 1, duration: 1 }, .1)
 .to(".panel.right",  { xPercent: 0, z: 0, rotateY: 0, rotateZ: 0, opacity: 1, duration: 1 }, .15)
 .to(".frame", { rotateY: 0, rotateX: 0, scale: 1, duration: 1.1, ease: "back.out(1.4)" }, .12)
 .to(".nav", { opacity: 1, duration: .6 }, .5)
 .to(".scroll-arrow, .scroll-hint, .water-glow", { opacity: 0, duration: .4 }, .2);
t.to(".flash", { opacity: .85, duration: .05 }, 1.0)
 .to(".flash", { opacity: 0, duration: .5, ease: "power2.in" }, 1.06)
 .to(".tick", { opacity: 1, duration: .3, stagger: .04 }, .98)
 .to(".capture", { opacity: 1, duration: .6 }, 1.0)
 .fromTo(".capture .shot", { scale: 1.12, filter: "grayscale(1) contrast(1.5) brightness(.3) blur(14px)" },
   { scale: 1.05, filter: "grayscale(1) contrast(1.05) brightness(.92) blur(0px)", duration: 1 }, 1.0);
t.to(".side", { opacity: 1, duration: .5, stagger: .1, ease: "power2.out" }, 1.55)
 .to(".side", { opacity: 0, duration: .4, ease: "power2.in" }, 2.35);
t.fromTo(".frame-logo", { opacity: 0, scale: 1.04 }, { opacity: 1, scale: 1, duration: .9, ease: "power2.out" }, 2.6)
 .to(".capture", { opacity: 0, duration: .45 }, 2.5)
 .to(".tick", { opacity: 0, duration: .4 }, 2.7)
 .to(".panel", { opacity: 0, duration: .45 }, 2.7);

// CROSSFADE — the square dissolves into the program monitor (same logo, matched size)
t.to(".scene", { opacity: 0, duration: .5, ease: "power2.in" }, 3.0)
 .to(monitor, { opacity: 1, duration: .5 }, 3.08);

// ZOOM OUT — the Premiere UI materialises around the logo (reveal it was the program monitor)
t.to(monitor, { scale: 1.0, duration: 1.5, ease: "power2.inOut" }, 3.7)
 .to([".ed-titlebar", ".prog-bar"], { opacity: 1, duration: .5 }, 3.9)
 .to(".ed-panel", { opacity: 1, duration: .6, stagger: .12 }, 4.1)
 .to(".timeline", { opacity: 1, duration: .6 }, 4.4)
 .to(".prog-cap", { opacity: 1, duration: .5 }, 4.7);

// SCRUB happens 5.3–8.8 (handled in onScrub) — hold the editor here
t.to(monitor, { scale: 1.0, duration: 3.5 }, 5.3);

// DESK pull-back (8.8–10.3)
t.to(monitor, { scale: .78, duration: 1.4, ease: "power2.inOut" }, 8.8)
 .to(".room .wall", { opacity: 1, duration: 1.2 }, 8.8)
 .to(".room .desk", { opacity: 1, y: 0, duration: 1.2 }, 9.0)
 .to(".stand", { opacity: 1, duration: .6 }, 9.2)
 .to(".reveal-cta", { opacity: 1, duration: .6 }, 9.5);

onScrub(0);
alignScene();
addEventListener("load", () => { setStage(); alignScene(); ScrollTrigger.refresh(); });
addEventListener("orientationchange", () => setTimeout(() => { setStage(); alignScene(); ScrollTrigger.refresh(); }, 250));

/* ---------- generative ambient audio (muted until click) ---------- */
const soundBtn = document.getElementById("sound");
let actx = null, master = null, started = false, playing = false;
function startAudio() {
  if (started) return; started = true;
  try {
    const AC = window.AudioContext || window.webkitAudioContext; actx = new AC();
    master = actx.createGain(); master.gain.value = 0; master.connect(actx.destination);
    const conv = actx.createConvolver();
    const len = actx.sampleRate * 2.6, buf = actx.createBuffer(2, len, actx.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const dd = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) dd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    conv.buffer = buf;
    const wet = actx.createGain(); wet.gain.value = .55; wet.connect(master); conv.connect(wet);
    const dry = actx.createGain(); dry.gain.value = .85; dry.connect(master);
    const filt = actx.createBiquadFilter(); filt.type = "lowpass"; filt.frequency.value = 620; filt.Q.value = 7;
    filt.connect(dry); filt.connect(conv);
    const lfo = actx.createOscillator(), lfoG = actx.createGain();
    lfo.frequency.value = .06; lfoG.gain.value = 340; lfo.connect(lfoG); lfoG.connect(filt.frequency); lfo.start();
    [110, 130.81, 164.81, 246.94].forEach((f, i) => {
      const o = actx.createOscillator(); o.type = i < 2 ? "sine" : "triangle"; o.frequency.value = f; o.detune.value = (i - 1.5) * 5;
      const g = actx.createGain(); g.gain.value = i === 0 ? .16 : .085; o.connect(g); g.connect(filt); o.start();
    });
    const sub = actx.createOscillator(); sub.type = "sine"; sub.frequency.value = 55;
    const subG = actx.createGain(); subG.gain.value = .07; sub.connect(subG); subG.connect(dry); sub.start();
  } catch (e) { console.warn("audio unavailable", e); }
}
function setPlaying(on) {
  if (!actx) return; if (actx.state === "suspended") actx.resume();
  playing = on; master.gain.cancelScheduledValues(actx.currentTime);
  master.gain.setTargetAtTime(on ? .9 : .0001, actx.currentTime, on ? .6 : .3);
  soundBtn.classList.toggle("on", on);
}
if (soundBtn) soundBtn.addEventListener("click", () => { if (!started) { startAudio(); setPlaying(true); } else setPlaying(!playing); });

/* ---------- interactive logo: directional invert ---------- */
const logoSwap = document.querySelector(".logo-swap");
if (logoSwap) {
  const fill = logoSwap.querySelector(".swap-fill");
  const edge = (e) => ((e.clientX - logoSwap.getBoundingClientRect().left) < logoSwap.offsetWidth / 2) ? "left center" : "right center";
  logoSwap.addEventListener("mouseenter", e => { fill.style.transformOrigin = edge(e); fill.style.transform = "scaleX(1)"; logoSwap.classList.add("sw"); });
  logoSwap.addEventListener("mouseleave", e => { fill.style.transformOrigin = edge(e); fill.style.transform = "scaleX(0)"; logoSwap.classList.remove("sw"); });
}

/* ---------- closing headline reveal ---------- */
if (!reduce) gsap.from(".contact-inner > *", {
  y: 40, opacity: 0, duration: .9, stagger: .12, ease: "power3.out",
  scrollTrigger: { trigger: ".contact", start: "top 68%" }
});

/* ---------- contact form → Google Sheet ----------
   To go live: deploy a Google Apps Script Web App (see chat) and paste its
   /exec URL below. Until then the form validates and shows a friendly notice. */
const SHEET_ENDPOINT = ""; // e.g. "https://script.google.com/macros/s/AKfy.../exec"
const cform = document.getElementById("cform");
const cnote = document.getElementById("cnote");
if (cform) cform.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(cform);
  const data = {
    name: (fd.get("name") || "").trim(), email: (fd.get("email") || "").trim(),
    phone: (fd.get("phone") || "").trim(), message: (fd.get("message") || "").trim(),
    ts: new Date().toISOString(), source: "foursidestudio.com"
  };
  cnote.className = "note";
  if (!data.email && !data.phone) { cnote.textContent = "Add an email or a phone number."; cnote.classList.add("err"); return; }
  if (data.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email)) { cnote.textContent = "That email looks off."; cnote.classList.add("err"); return; }
  const btn = cform.querySelector(".send");
  if (!SHEET_ENDPOINT) { cnote.textContent = "Connect your Google Sheet endpoint to go live."; return; }
  btn.disabled = true; cnote.textContent = "Sending\u2026";
  try {
    await fetch(SHEET_ENDPOINT, { method: "POST", mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(data) });
    cnote.textContent = "Thanks \u2014 we'll be in touch."; cnote.classList.add("ok"); cform.reset();
  } catch (err) { cnote.textContent = "Couldn't send \u2014 email us directly."; cnote.classList.add("err"); }
  finally { btn.disabled = false; }
});

document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener("click", e => {
    const el = document.getElementById(a.getAttribute("href").slice(1)); if (!el) return; e.preventDefault();
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: "smooth" });
  });
});
if (!isMobile) addEventListener("resize", () => { alignScene(); ScrollTrigger.refresh(); });

/* ---------- SELECTED WORK grids ---------- */
(function renderWork() {
  // [reel id, brand label]
  const SPORTS = [
    ["DXwAwPPtBy0","Gujarat Titans"],["DYDEbRNNfvG","Gujarat Titans"],["DHn5yxpTSyl","Gujarat Titans"],
    ["DHNu5UxxJee","Gujarat Titans"],["DI8fRz9NQR8","Gujarat Titans"],["DO54VekCGQb","Gujarat Titans"],
    ["DSFM5z8DYBX","Gujarat Titans"],["DSNblregSjz","Gujarat Titans"],["DSRpCyKjTV8","Gujarat Titans"],
    ["DSSY2jgkQpg","Gujarat Titans"],["DThawpHDUjq","Gujarat Titans"],["DTky6UDCH34","Gujarat Titans"],
    ["DTjrPzQiH--","Gujarat Titans"],["DTuCVJTiFmv","Gujarat Titans"],["DTzQrZKCO2m","Gujarat Titans"],
    ["DUAzABYjcdD","Gujarat Titans"],["DUGbXIuDW6t","Gujarat Titans"]
  ];
  const DVC = [
    ["C3P_yMZPXUM","Shivalik"],["C76oh4MsHAT","Shivalik"],["DCV78deyokQ","Shivalik"],
    ["C5hsJrwvp0M","Shivalik"],["C969v-AM7dM","Shivalik"],
    ["DNF_sEUppj7","Kavyaratna"],["DVNnevUjJcK","Kavyaratna"],
    ["DV5fiWLDEgR","Palladium"],["DVMMyjukk2p","Palladium"],
    ["DP8FI4VkSEi","Sahaj Group"],["DPeDj99EUgL","Sahaj Group"],["DPEY4WZjPl4","Sahaj Group"],["DQOysRFjBTq","Sahaj Group"],
    ["DP4B1ijkkXV","Nagarseth"],["C8PdS6Fyafn","Cutone"]
  ];
  const TRENDING = [
    ["DKtfZCcuxfE","Zepto"],["DMIBZh7Poq8","Zepto"],["DVTZa10jPi8","Zepto"],["DOgSEg8iTbE","PYC"],
    ["DWYS4J9jcna","Reel"],["DBsuJicvdai","Reel"],["DGf5Njtv-PF","Reel"],["DKgjoY-RYib","Reel"],
    ["DNVholeBkMe","Reel"],["DOf5PRTCRab","Reel"],["DSqAQCUEh7W","Reel"],["DVNHZFYEk2Y","Reel"],
    ["C7ElzfwsP-x","Reel"],["C83_VRNKcP1","Reel"],["C8wv0I5t6W1","Reel"],["Cxff4XhMhZb","Reel"]
  ];
  const card = (id, brand, i) => `
    <a class="reel-card" href="https://www.instagram.com/reel/${id}/" target="_blank" rel="noopener" aria-label="Watch ${brand} reel on Instagram">
      <img loading="lazy" src="assets/thumbs/${id}.jpg" alt="${brand} reel" />
      <span class="rc-play"><i></i></span>
      <span class="rc-foot"><span class="ig">${brand}</span><span class="no">${pad(i + 1)}</span></span>
    </a>`;
  const more = `<div class="many-more"><span class="plus">+</span><span>many more</span></div>`;
  const fill = (elId, data) => {
    const el = document.getElementById(elId);
    if (el) el.innerHTML = data.map((d, i) => card(d[0], d[1], i)).join("") + more;
  };
  fill("grid-sports", SPORTS);
  fill("grid-dvc", DVC);
  fill("grid-trending", TRENDING);
})();

/* ---------- landing scroll hint: letters part around the cursor like water ---------- */
(function waterHint() {
  const textEl = document.getElementById("hintText");
  const glow   = document.querySelector(".water-glow");
  if (!textEl) return;
  textEl.innerHTML = textEl.textContent.toUpperCase().split("").map(c =>
    c === " " ? `<span class="gap"></span>` : `<span class="ltr">${c}</span>`).join("");
  if (reduce) return; // static text remains as the non-motion fallback

  const ltrs = [...textEl.querySelectorAll(".ltr")].map((el, i) => ({ el, i, x: 0, y: 0, vx: 0, vy: 0, cx: 0, cy: 0 }));
  const measure = () => ltrs.forEach(l => {
    const r = l.el.getBoundingClientRect();
    l.cx = r.left + r.width / 2 - l.x;   // home centre, minus current offset
    l.cy = r.top + r.height / 2 - l.y;
  });
  measure(); addEventListener("resize", measure);

  let mx = -1e4, my = -1e4, gx = innerWidth / 2, gy = innerHeight * 0.58, seen = false;
  addEventListener("pointermove", e => {
    mx = e.clientX; my = e.clientY;
    if (!seen) { seen = true; glow.classList.add("on"); }
  }, { passive: true });

  const R = 170, FORCE = 46, STIFF = 0.085, DAMP = 0.82; // damping < 1 = water resistance
  let tm = 0;
  (function tick() {
    requestAnimationFrame(tick);
    if (scrollY > innerHeight * 0.6) return;        // hint has faded — skip the work
    tm += 0.016;
    for (const l of ltrs) {
      // idle: gentle phase-offset bob, like floating on water
      let tx = 0, ty = Math.sin(tm * 1.6 + l.i * 0.55) * 3.5;
      const dx = (l.cx + l.x) - mx, dy = (l.cy + l.y) - my;
      const d = Math.hypot(dx, dy);
      if (d < R && d > 0.001) {
        const s = Math.pow(1 - d / R, 1.6) * FORCE; // smooth falloff, strongest up close
        tx += dx / d * s;
        ty += dy / d * s + Math.sin(tm * 9 + l.i) * s * 0.08; // slight turbulence while displaced
      }
      l.vx += (tx - l.x) * STIFF; l.vy += (ty - l.y) * STIFF;
      l.vx *= DAMP; l.vy *= DAMP;
      l.x += l.vx; l.y += l.vy;
      l.el.style.transform = `translate(${l.x}px,${l.y}px) rotate(${l.x * 0.12}deg)`;
    }
    if (seen) { // sheen trails the cursor lazily, like light on water
      gx += (mx - gx) * 0.07; gy += (my - gy) * 0.07;
      glow.style.transform = `translate(${gx}px,${gy}px) translate(-50%,-50%)`;
    }
  })();
})();
