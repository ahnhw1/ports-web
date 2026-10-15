// PORTS — hero intro (first paint, from compare-hero ③)
// On load at the top of the page the bar reaches far down and holds a screen-wide PORTS; the hero copy
// waits under it. The outline is drawn like a pen stroke, then the hero video fills the letters from the
// left with a soft edge (a strong ease-in-out) while the outline is wiped away along that edge and the
// bar's bottom line fills like a loading bar. The moment the letters look full, the five letters fly one
// after another (a slight curve, a small tilt) to their places in the small logo, whitening on the way;
// the bar folds back to 72px and the copy rises line by line. Scrolling is held while it plays.
// Skipped (copy shown at once) when the page opens scrolled or on a #link.
(() => {
  const PORTS = (window.PORTS = window.PORTS || {});
  const BAR_FOLD = 1.25, EASE = 'expo.inOut', FILL = 'power4.inOut';

  PORTS.heroIntro = async () => {
    const root = document.documentElement;
    const hero = document.querySelector('.hero'), header = document.querySelector('.header');
    const logo = header && header.querySelector('.header__logo img');
    const ja = hero && hero.querySelector('.hero__ja');
    const show = () => { ja && ja.classList.add('is-split'); root.classList.add('is-intro-done'); };
    if (!hero || !logo || !window.gsap) { show(); return; }
    if (scrollY > 10 || (location.hash && location.hash !== '#hero')) { show(); return; }

    // the wordmark, inline, so its letters can be measured and split
    let svgText;
    try { svgText = await fetch(logo.getAttribute('src')).then((r) => r.text()); } catch (e) { show(); return; }
    if (scrollY > 10) { show(); return; }
    const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
    const VB = doc.documentElement.getAttribute('viewBox');
    const [vx, vy, vw, vh] = VB.split(/[\s,]+/).map(Number);
    const PATHS = [...doc.querySelectorAll('path, polygon')].map((p) => p.outerHTML);
    const lenis = PORTS.lenis;

    // geometry: the big wordmark spans the page gutters, just under the top of the bar
    const BAR = header.offsetHeight;
    const g = parseFloat(getComputedStyle(hero).paddingLeft) || 40;
    const W = hero.clientWidth, H = hero.clientHeight;
    const bigW = W - 2 * g, bigH = bigW * vh / vw, bigTop = BAR - 8;
    const introBar = BAR + bigH + Math.max(28, innerHeight * .05);
    const kids = [...hero.querySelectorAll('.hero__s'), ja, hero.querySelector('.hero__latest'), hero.querySelector('.hero__cta')].filter(Boolean);
    const reel = hero.querySelector('.hero__bg video.is-on') || hero.querySelector('.hero__bg video');

    const el = (cls, parent, tag = 'div') => { const e = document.createElement(tag); e.className = cls; parent && parent.appendChild(e); return e; };
    const place = (e, x, y, w, h) => Object.assign(e.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, ...(h ? { height: `${h}px` } : {}) });
    // a copy of the playing reel clip, lined up with the background, for inside the letters
    const through = (x, y) => {
      const v = el('', null, 'video'); v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'auto'; v.src = reel.currentSrc || reel.src;
      Object.assign(v.style, { left: `${-x}px`, top: `${-y}px`, width: `${W}px`, height: `${H}px` });
      v.addEventListener('loadeddata', () => { v.currentTime = reel.currentTime; v.play().catch(() => {}); }, { once: true });
      return v;
    };

    // layers: a dim over the reel (under the copy), and over the copy the tall bar, the outline, the fill
    const dim = el('hintro__dim'); hero.querySelector('.hero__bg').after(dim);
    const layer = el('hintro', hero);
    const bar = el('hintro__bar', layer), hot = el('hintro__hot', bar);
    const out = el('hintro__big hintro__out', layer); place(out, g, bigTop, bigW);
    out.innerHTML = `<svg viewBox="${VB}">${PATHS.join('')}</svg>`;
    const op = [...out.querySelectorAll('path, polygon')];
    // stroke length normalised to 1000 (GSAP rounds px values, so a length of 1 could only be 0 or 1)
    op.forEach((p) => { p.setAttribute('pathLength', 1000); });
    const box = el('hintro__big', layer); place(box, g, bigTop, bigW, bigH);
    const soft = el('hintro__soft', el('hintro__fill', box));
    soft.append(through(g, bigTop), el('', null, 'b'));

    // the five letters: where they sit in the big wordmark and where they land in the header logo
    const hr = hero.getBoundingClientRect(), lr = logo.getBoundingClientRect();
    const letters = op.map((p, i) => {
      const bb = p.getBBox();
      const fx = (bb.x - vx) / vw, fy = (bb.y - vy) / vh, fw = bb.width / vw;
      const from = { left: g + fx * bigW, top: bigTop + fy * bigH, width: fw * bigW };
      const to = { left: lr.left - hr.left + fx * lr.width, top: lr.top - hr.top + fy * lr.height, width: fw * lr.width };
      const d = el('hintro__ltr', layer); place(d, from.left, from.top, from.width);
      d.innerHTML = `<svg viewBox="${bb.x} ${bb.y} ${bb.width} ${bb.height}">${PATHS[i]}</svg>`;
      const uri = `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${bb.x} ${bb.y} ${bb.width} ${bb.height}">${PATHS[i]}</svg>`)}")`;
      const m = el('hintro__fill', d); m.style.webkitMask = m.style.mask = `${uri} 0 0 / 100% 100% no-repeat`;
      const white = el('', null, 'b'); m.append(through(from.left, from.top), white);
      return { d, to, white };
    });
    const ds = letters.map((l) => l.d);

    // starting state: tall bar, copy pushed under it, the header's own logo and line hidden
    gsap.set(bar, { height: introBar });
    gsap.set(kids, { y: introBar - BAR });
    gsap.set(dim, { opacity: .6 });
    gsap.set(ds, { opacity: 0 });
    logo.style.opacity = '0';
    header.style.borderBottomColor = 'transparent';
    show();
    if (lenis) lenis.stop();

    const finish = () => {
      layer.remove(); dim.remove();
      gsap.set(kids, { clearProps: 'transform' });
      logo.style.opacity = ''; header.style.borderBottomColor = '';
      removeEventListener('resize', skip);
      if (lenis) { lenis.start(); PORTS.quiet && PORTS.quiet(); }
    };

    const GO = .8 + 1.6 * .82, dur = BAR_FOLD * .95;   // leave the moment the fill looks full
    // The site runs GSAP without lag smoothing (for Lenis), so a busy frame (building this, starting
    // the videos) would make the timeline jump ahead and skip the pen stroke. The intro keeps its own
    // clock instead: paused, advanced each tick by at most ~2 frames.
    const tl = gsap.timeline({ paused: true, onComplete: () => { gsap.ticker.remove(step); finish(); } });
    let clock = 0;
    function step(time, dt) { clock += Math.min(dt, 34) / 1000; tl.time(clock); }
    tl.fromTo(op, { strokeDashoffset: 1000 }, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut', stagger: .09 }, .1)
      .fromTo([soft, out], { '--p': '-10%' }, { '--p': '112%', duration: 1.6, ease: FILL }, .8)
      .fromTo(hot, { scaleX: 0 }, { scaleX: 1, duration: 1.6, ease: FILL }, .8)
      .set(ds, { opacity: 1 }, GO).set([box, out], { opacity: 0 }, GO)
      .to(hot, { opacity: 0, duration: .6 }, GO)
      .to(bar, { height: BAR, duration: BAR_FOLD, ease: EASE }, GO)
      .to(dim, { opacity: 0, duration: BAR_FOLD, ease: 'power2.out' }, GO)
      .to(kids, { y: 0, duration: BAR_FOLD, ease: EASE, stagger: .06 }, GO + .04);
    letters.forEach(({ d, to, white }, i) => {
      const at = GO + i * .07;
      tl.to(d, { left: to.left, width: to.width, duration: dur, ease: 'power3.inOut' }, at)
        .to(d, { top: to.top, duration: dur, ease: EASE }, at)
        .to(d, { keyframes: { rotation: [0, i % 2 ? 6 : -6, 0] }, duration: dur, ease: 'none' }, at)
        .to(white, { opacity: 1, duration: dur * .85, ease: 'power2.in' }, at);
    });
    tl.set(logo, { opacity: 1 }, GO + 4 * .07 + dur).set(ds, { opacity: 0 }, GO + 4 * .07 + dur);
    // a resize mid-intro would leave the letters aiming at the old logo spot: jump to the end
    function skip() { gsap.ticker.remove(step); tl.progress(1); }
    addEventListener('resize', skip);

    // start once the clips inside the letters can show a frame (or after 1.5s at most) and layout has settled
    const vids = [...layer.querySelectorAll('video')];
    await Promise.race([
      Promise.all(vids.map((v) => new Promise((r) => { if (v.readyState >= 2) r(); else v.addEventListener('loadeddata', r, { once: true }); }))),
      new Promise((r) => setTimeout(r, 1500)),
    ]);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    if (tl.progress() < 1) gsap.ticker.add(step);
  };
})();
