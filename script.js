// PORTS — page behaviour
// Motion stack: GSAP (+ScrollTrigger, SplitText, CustomEase) driven by one ticker, Lenis for
// inertial scroll on that same ticker. Everything degrades to plain CSS/native scroll if the
// libraries are missing or the user prefers reduced motion.
const PORTS = (window.PORTS = window.PORTS || { dark: 0, lenis: null });
const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasGsap = !!(window.gsap && window.ScrollTrigger && window.SplitText && window.CustomEase);
const motion = hasGsap && !reduced;

if (!motion) root.classList.remove('js-anim');   // show everything immediately, CSS reveals only

// A reload of the one-page site starts from the hero (with its intro), not where the page was left:
// no browser scroll restoration, and the #section a menu click left in the address bar is dropped.
// Arriving from another page with a #section (works.html → index.html#works) still goes there.
if (document.querySelector('.hero')) {
  // (history calls are guarded: a sandboxed frame, like the shared Artifact, may refuse them)
  try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) {}
  const nav = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
  if (nav && nav.type === 'reload') {
    PORTS.reloadTop = true;
    try { if (location.hash) history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
    scrollTo(0, 0);
  }
}
// safety net: never leave text hidden if something below throws
setTimeout(() => {
  root.classList.add('is-intro-done');
  if (document.querySelector('.hero__ja') && !document.querySelector('.hero__ja.is-split')) root.classList.remove('js-anim');
}, 4000);

// ---------- Tokyo clock ----------
(() => {
  // hero (A4): "Shibuya, Tokyo · 12:34:56"
  const el = document.getElementById('clock');
  if (!el) return;
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const tick = () => { el.textContent = fmt.format(new Date()); };
  tick();
  setInterval(tick, 1000);
})();

// ---------- GSAP + Lenis on one ticker ----------
if (motion) {
  gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);
  // a reload starts at the top (above): ScrollTrigger must not put back the position it remembered
  if (PORTS.reloadTop) ScrollTrigger.clearScrollMemory('manual');
  // same curves as the CSS tokens --ease-out / --ease-io
  CustomEase.create('pOut', '0.16, 1, 0.3, 1');
  CustomEase.create('pInOut', '0.77, 0, 0.18, 1');
  gsap.defaults({ ease: 'pOut', duration: 1.1 });
}
if (window.Lenis && !reduced) {
  const lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
  PORTS.lenis = lenis;
  if (motion) {
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  } else {
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
}
// was the current scroll started by the user (wheel / touch / keys) rather than by code (menu links,
// snaps)? Scroll-driven locks and snaps only act on the user's own scrolling.
PORTS.lastInput = -Infinity;   // (0 made the first 450ms after load count as user scrolling)
['wheel', 'touchmove', 'keydown'].forEach((ev) => addEventListener(ev, () => { PORTS.lastInput = performance.now(); }, { passive: true }));
PORTS.userDriven = () => performance.now() - PORTS.lastInput < 450;
// Quiet: after an automatic move starts (the hero -> About glide, an About step), swallow the wheel until
// the current gesture has ended (no wheel event for 220ms), so trackpad / mouse momentum cannot run on
// into the next step. The next move needs a fresh scroll. Capture phase: runs before Lenis sees it.
{
  let quietUntilIdle = false, lastWheel = 0, timer = 0;
  const release = () => {
    clearTimeout(timer);
    timer = setTimeout(() => { if (performance.now() - lastWheel >= 220) quietUntilIdle = false; else release(); }, 230);
  };
  PORTS.quiet = () => { quietUntilIdle = true; lastWheel = performance.now(); release(); };
  addEventListener('wheel', (e) => {
    if (!quietUntilIdle) return;
    lastWheel = performance.now();
    e.preventDefault(); e.stopImmediatePropagation();
  }, { capture: true, passive: false });
}
const onFrame = (fn) => (motion ? gsap.ticker.add(fn) : (function loop() { fn(); requestAnimationFrame(loop); })());

// ---------- Menu ----------
(() => {
  const btn = document.getElementById('menuBtn');
  const menu = document.getElementById('menu');
  // Menu button: the bare semicolon mark at the right end of the bar (no frame), drawn as two paths.
  const D = 'M70.88,0C36.47,0,7.81,24.56,1.44,57.11l-.03-.03c-.17.89-.32,1.82-.46,2.75-.04.24-.07.48-.1.72-.09.64-.17,1.28-.25,1.93-.06.54-.13,1.08-.18,1.63-2.26,23.75,4.24,57.72,22.16,85.88,19.79,31.1,48.03,50.41,58.32,53.59,0,0-8.11-11.21-12.4-33.95-2.4-12.72-1.94-22.18-1.03-28.16,1.13.05,2.26.09,3.4.09,39.09,0,70.77-31.68,70.77-70.77S109.96,0,70.88,0Z';
  btn.hidden = false;
  btn.innerHTML = `<svg class="mk" viewBox="0 0 305 204" aria-hidden="true"><path class="mk__c" d="${D}"/><path class="mk__d" d="M163.27,70.77A70.77,70.77 0 1 1 304.81,70.77A70.77,70.77 0 1 1 163.27,70.77Z"/></svg>`;

  // The mark itself morphs (MorphSVG). Idle: every 7s the comma draws in its tail and stretches into
  // the top line while the dot drops and stretches into the bottom line, holds, then flows back.
  // Hover holds the lines; open morphs them into a cross.
  if (motion && window.MorphSVGPlugin) {
    gsap.registerPlugin(MorphSVGPlugin);
    const c = btn.querySelector('.mk__c'), d = btn.querySelector('.mk__d');
    const SHAPES = {
      mark: [c.getAttribute('d'), d.getAttribute('d')],
      // centred on the dots' line (y 70.77), like the mark itself
      lines: ['M31,29.77H274A11,11 0 0 1 274,51.77H31A11,11 0 0 1 31,29.77Z', 'M31,89.77H274A11,11 0 0 1 274,111.77H31A11,11 0 0 1 31,89.77Z'],
      x: ['M75.43,-21.86L245.13,147.84L229.57,163.4L59.87,-6.3Z', 'M59.87,147.84L229.57,-21.86L245.13,-6.3L75.43,163.4Z'],
    };
    let state = 'mark', hover = false, idle = null;
    const to = (s, dur = .9) => {
      if (s === state) return;
      state = s;
      gsap.to(c, { morphSVG: SHAPES[s][0], duration: dur, ease: 'expo.inOut', overwrite: true });
      gsap.to(d, { morphSVG: SHAPES[s][1], duration: dur, ease: 'expo.inOut', delay: .06, overwrite: true });
    };
    const open = () => btn.getAttribute('aria-expanded') === 'true';
    const rest = () => to(open() ? 'x' : hover ? 'lines' : 'mark');
    btn.addEventListener('pointerenter', () => { hover = true; idle?.kill(); rest(); });
    btn.addEventListener('pointerleave', () => { hover = false; rest(); });
    new MutationObserver(rest).observe(btn, { attributes: true, attributeFilter: ['aria-expanded'] });
    setInterval(() => {
      if (hover || open() || state !== 'mark') return;
      to('lines');
      idle = gsap.delayedCall(2.2, () => { if (!hover && !open()) to('mark'); });
    }, 7000);
  }

  // full-screen sheet: the page stops scrolling while it is open, and the header switches to
  // light tokens so the logo, clock and close button read on the white sheet
  const header = document.querySelector('.header');
  const isOpen = () => menu.classList.contains('is-open');
  const set = (open) => {
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.classList.toggle('is-open', open);
    menu.inert = !open;
    header.classList.toggle('theme-light', open);
    header.classList.toggle('is-menu-open', open);
    if (PORTS.lenis) open ? PORTS.lenis.stop() : PORTS.lenis.start();
    else document.body.style.overflow = open ? 'hidden' : '';
    if (open && motion) {
      gsap.fromTo(menu.querySelectorAll('.menu__main a'), { yPercent: 70, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: .07, duration: .9, delay: .25, overwrite: true });
      gsap.fromTo(menu.querySelectorAll('.menu__side a, .menu__dm'), { y: 18, opacity: 0 }, { y: 0, opacity: 1, stagger: .05, duration: .7, delay: .45, overwrite: true });
    }
  };
  // B5 weight contrast, driven by the pointer instead of scroll: f = where the pointer is along the
  // list (in link units); each link gets 100 -> 800 by its distance to f, blue when it is the nearest
  const mainLinks = [...menu.querySelectorAll('.menu__main a')];
  const mainNav = menu.querySelector('.menu__main');
  if (mainNav && matchMedia('(hover: hover)').matches) {
    mainNav.addEventListener('pointermove', (e) => {
      const mids = mainLinks.map((a) => { const r = a.getBoundingClientRect(); return (r.top + r.bottom) / 2; });
      let f = 0;
      for (let i = 0; i < mids.length - 1; i++) {
        if (e.clientY >= mids[i]) f = i + Math.min(1, (e.clientY - mids[i]) / (mids[i + 1] - mids[i]));
      }
      mainLinks.forEach((a, j) => {
        const d = Math.max(0, 1 - Math.abs(j - f));
        a.style.fontWeight = Math.round(100 + 700 * d);
        a.style.color = d > .5 ? 'var(--blue)' : '';
      });
    });
    mainNav.addEventListener('pointerleave', () => mainLinks.forEach((a) => { a.style.fontWeight = ''; a.style.color = ''; }));
  }
  btn.addEventListener('click', () => set(!isOpen()));
  menu.addEventListener('click', (e) => { const a = e.target.closest('a'); if (a && !a.hasAttribute('data-todo')) set(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && isOpen()) { set(false); btn.focus(); } });
})();

// ---------- In-page anchors (nav, hero cards, menu, footer) ----------
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  if (a.hasAttribute('data-todo')) { e.preventDefault(); return; }   // Career etc.: target not known yet
  const id = a.getAttribute('href').slice(1);
  const target = id ? document.getElementById(id) : null;
  if (!target) return;
  e.preventDefault();
  if (PORTS.lenis) PORTS.lenis.scrollTo(target, { duration: 1.6, easing: (t) => (t < .5 ? 16 * t ** 5 : 1 - Math.pow(-2 * t + 2, 5) / 2) });
  else target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  try { history.replaceState(null, '', `#${id}`); } catch (err) {}
});

// ---------- Scroll-linked UI: header, progress, nav highlight, dark section ----------
(() => {
  const header = document.querySelector('.header');
  const heroEl = document.querySelector('.hero');
  const links = [...document.querySelectorAll('.nav a')];
  const sections = [...document.querySelectorAll('main > section[data-nav]')];
  const dock = document.getElementById('creative-studio');
  // the page that rises over SIDE DOCK (Works; Mission if there is no Works section)
  const mission = document.getElementById('works') || document.getElementById('company');
  const services = document.getElementById('services');
  const servicesShade = services && services.querySelector('.cover-shade');
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  // the page being covered: lag behind the scroll (moves at .75x), darken, then hide once fully covered
  const cover = (el, shade, p, gone, hideEl = el) => {
    if (!el) return;
    const lag = motion ? p * innerHeight * .25 : 0;
    el.style.transform = p > 0 && p < 1 ? `translate3d(0, ${lag.toFixed(1)}px, 0)` : (p >= 1 ? `translate3d(0, ${(innerHeight * .25).toFixed(1)}px, 0)` : '');
    // shading starts only once the next page covers ~30% of the screen, so the covered page stays readable
    if (shade) shade.style.opacity = (Math.max(0, (p - .3) / .7) * .8).toFixed(3);
    hideEl.style.visibility = gone ? 'hidden' : '';
  };
  let lastDk = -1, lastActive = '';

  const update = () => {
    const y = scrollY, vh = innerHeight;

    // over the hero's video reel the bar stays clear with white type; after it, the frosted light bar.
    // The reel is under the bar only while the hero reaches below it AND the next section (which slides
    // over the lagging hero) has not yet reached it.
    const hh = header.offsetHeight, nextEl = heroEl && heroEl.nextElementSibling;
    const onReel = !!heroEl && heroEl.getBoundingClientRect().bottom > hh && (!nextEl || nextEl.getBoundingClientRect().top > hh);
    header.classList.toggle('is-on-reel', onReel);
    header.classList.toggle('is-scrolled', y > 40 && !onReel);

    const mid = vh * .4;
    // later sections stack on top (parallax covers), so check them first and skip covered/hidden ones
    const cur = [...sections].reverse().find((s) => {
      if (s.style.visibility === 'hidden') return false;
      const r = s.getBoundingClientRect(); return r.top <= mid && r.bottom > mid;
    });
    const href = cur ? `#${cur.dataset.nav}` : links[0]?.getAttribute('href');
    // sub-pages (no sections) keep the active link set in their HTML
    if (sections.length && href !== lastActive) { lastActive = href; links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === href)); }

    // SIDE DOCK parallax cover (enter: covers Services / leave: covered by Mission).
    // The covered page lags at .75x scroll speed and is shaded; the page-wide night theme flips
    // only while a page fully covers the screen, and the covered page is hidden after that.
    if (dock && mission) {
      const r = dock.getBoundingClientRect();
      const clamp01 = (v) => Math.min(1, Math.max(0, v));

      const pIn = clamp01(1 - r.top / vh);            // 0: SIDE DOCK below the fold -> 1: it reached the top
      cover(services, servicesShade, pIn, r.top <= -2);

      // Leave: no cover any more. SIDE DOCK's chart ends in the Works background colour (side-dock-chart.js),
      // so Works simply follows in the flow. Was: cover(dockStage, dockShade, 1 - m.top / vh, m.top <= 0, dock)
      // plus --dock-panel / --mission-bg see-through fades.

      // SIDE DOCK is brand blue now (not a night sheet), so the page-wide theme stays on day.
      // Was: smooth(0, -vh * .15, r.top) * (1 - smooth(vh * .5, vh * .15, m.top))
      const dk = 0;
      if (Math.abs(dk - lastDk) > .002 || (dk === 0 && lastDk !== 0) || (dk === 1 && lastDk !== 1)) {
        lastDk = dk; PORTS.dark = dk;
        root.style.setProperty('--gdk', dk.toFixed(3));
        root.style.setProperty('--dk', dk.toFixed(3));
        root.style.setProperty('--dkt', smooth(.3, .6, dk).toFixed(3));
      }
    }
  };
  onFrame(update);
})();

// ---------- Reveals ----------
// Line-split headings/paragraphs rise out of a mask line by line; other blocks fade up.
const SPLIT = '.sec-title, .services__lead .mono, .svc__name, .studio__desc, .mission__h2, .domain__col--en p';
const splitLines = (el, vars) => SplitText.create(el, {
  type: 'lines', mask: 'lines', autoSplit: true,
  onSplit(self) {
    el.classList.add('is-split');
    return gsap.from(self.lines, { yPercent: 110, stagger: .08, duration: 1.2, ...vars });
  },
});

const startReveals = () => {
  if (motion) {
    document.querySelectorAll(SPLIT).forEach((el) => {
      const long = el.matches('.domain__col--en p');
      splitLines(el, { stagger: long ? .035 : .08, scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });
  }
  const els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('is-in')); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
  }, { threshold: .15, rootMargin: '0px 0px -8% 0px' });
  els.forEach((e) => io.observe(e));
};

// ---------- Hero intro (first paint) ----------
// The big PORTS in the tall bar folding into the logo: hero-intro.js.
// (Was: the facts row, the big sentence line by line, then the latest work and CTA faded in.)
const heroIntro = () => {
  if (!document.querySelector('.hero')) { root.classList.add('is-intro-done'); return; }   // sub-pages (works.html)
  if (PORTS.heroIntro) PORTS.heroIntro();
  else { document.querySelector('.hero__ja')?.classList.add('is-split'); root.classList.add('is-intro-done'); }
};

const boot = () => {
  if (motion) heroIntro();
  else root.classList.add('is-intro-done');
  startReveals();
};
// wait for webfonts so line breaks are measured with the real fonts
(document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(boot);

// ---------- Boat cursor label ----------
(() => {
  const boat = document.getElementById('boat');
  const label = document.getElementById('boatLabel');
  if (!boat || !label || !matchMedia('(hover: hover)').matches) return;
  const MAP = [
    ['.cards a', 'View'], ['.nav a', 'Go'], ['.menu a', 'Go'], ['.footer__nav a', 'Go'],
    ['#reelBtn', 'Play'], ['#menuBtn', 'Menu'], ['.link-row', 'Career'],
    ['.footer__top', 'Top'], ['.header__logo', 'Home'],
  ];
  MAP.forEach(([sel, text]) => document.querySelectorAll(sel).forEach((el) => { el.dataset.cursor = text; }));

  let current = null, timer = 0;
  const type = (text) => {             // typewriter, in the spirit of the old site's TYPING mode
    clearInterval(timer);
    let i = 0;
    label.textContent = '';
    timer = setInterval(() => { label.textContent = text.slice(0, ++i); if (i >= text.length) clearInterval(timer); }, 38);
  };
  document.addEventListener('pointerover', (e) => {
    const el = e.target.closest('[data-cursor]');
    if (el === current) return;
    current = el;
    if (el) { type(el.dataset.cursor); boat.classList.add('has-label'); }
    else { clearInterval(timer); boat.classList.remove('has-label'); }
  });
  document.addEventListener('pointerleave', () => { current = null; boat.classList.remove('has-label'); });
})();
