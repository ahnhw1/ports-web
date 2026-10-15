// PORTS — Phase 2: per-section signature interactions.
// Runs after script.js (which sets up GSAP, Lenis and window.PORTS). Every block degrades to a
// static, fully readable state when motion is off (reduced motion or libraries missing).
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const motion = !!(window.gsap && window.ScrollTrigger) && !reduced;
  const canHover = matchMedia('(hover: hover)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const tick = (fn) => (motion ? gsap.ticker.add(fn) : null);

  /* ---------------- Hero: background reel, a new clip every 5 seconds ----------------
     Each clip starts from its beginning and crossfades over the previous one (CSS). Only the next clip
     is fetched ahead; the reel pauses while the hero is off screen or the tab is hidden. */
  (() => {
    const reel = document.getElementById('heroReel');
    const vids = reel ? [...reel.querySelectorAll('video')] : [];
    if (!vids.length) return;
    const HOLD = 5000;
    let cur = 0, timer = 0, visible = true;
    const warm = (v) => { if (v.preload !== 'auto') { v.preload = 'auto'; v.load(); } };
    const playing = () => vids[cur].play().catch(() => {});
    if (reduced) return;   // reduced motion: the first clip's first frame, still
    playing();
    warm(vids[1 % vids.length]);
    const next = () => {
      const n = (cur + 1) % vids.length, v = vids[n], prev = vids[cur];
      v.currentTime = 0;
      v.play().then(() => {
        v.classList.add('is-on'); prev.classList.remove('is-on');
        setTimeout(() => { if (!prev.classList.contains('is-on')) prev.pause(); }, 1300);
        cur = n;
        warm(vids[(n + 1) % vids.length]);
        schedule();
      }).catch(() => { cur = n; schedule(); });   // could not play: skip it
    };
    const schedule = () => { clearTimeout(timer); if (visible && !document.hidden) timer = setTimeout(next, HOLD); };
    const pauseAll = () => { clearTimeout(timer); vids[cur].pause(); };
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) { playing(); schedule(); } else pauseAll();
    }).observe(reel);
    document.addEventListener('visibilitychange', () => { if (document.hidden) pauseAll(); else if (visible) { playing(); schedule(); } });
    schedule();
  })();

  /* ---------------- Hero (A4): latest work from works-data.js ---------------- */
  (() => {
    const a = document.getElementById('heroLatest');
    const works = window.PORTS_WORKS || [];
    const w = works.find((x) => x.featured) || works[0];
    if (!a || !w) return;
    a.href = `work.html#${w.slug}`;
    a.setAttribute('aria-label', `Latest work: ${w.title}`);
    a.querySelector('.hero__latest-img').style.background = window.PORTS_WORK_IMG(w, 0);
  })();

  /* ---------------- Hero: staggered dissolve on the way out ----------------
     Each element leaves on its own beat, in reading order: the three facts left to right, then the
     headline line by line woven with the latest work and the CTA. Per element: fade + soft blur +
     a short downward drift (parallax lag). Written to `filter` and `translate` only, so it never
     fights the intro tweens (which use opacity/transform). Lines are read live, as SplitText re-splits
     on resize. Was: two group tweens (headline / everything else) fading together. */
  // shared by every section (see "Staggered dissolve" below)
  const DUR = .34;   // each element's share of the scroll range
  const smooth = (t) => t * t * (3 - 2 * t);
  const fade = (el, e) => {
    el.style.filter = e > 0 ? `blur(${(e * 10).toFixed(2)}px) opacity(${(1 - e).toFixed(3)})` : '';
    el.style.translate = e > 0 ? `0 ${(e * innerHeight * .07).toFixed(1)}px` : '';
  };
  // a group leaving together: element i starts after i * gap and takes DUR of the range
  const dissolve = (items, st) => {
    const apply = (p) => {
      const list = items().filter(Boolean), n = list.length, gap = (1 - DUR) / Math.max(1, n - 1);
      list.forEach((el, i) => fade(el, smooth(Math.min(1, Math.max(0, (p - i * gap) / DUR)))));
    };
    ScrollTrigger.create({ ...st, scrub: true, invalidateOnRefresh: true, onUpdate: (self) => apply(self.progress), onRefresh: (self) => apply(self.progress) });
  };
  // elements in normal flow: each one dissolves only once it is on its way out, from when its bottom
  // edge passes 30% from the top of the screen until it leaves (was 'center 45%' -> 'bottom 6%': too early)
  const dissolveEach = (els) => els.filter(Boolean).forEach((el) => ScrollTrigger.create({
    trigger: el, start: 'bottom 30%', end: 'bottom top', scrub: true,
    onUpdate: (self) => fade(el, smooth(self.progress)), onRefresh: (self) => fade(el, smooth(self.progress)),
  }));

  if (motion && $('.hero')) {
    dissolve(() => {
      const lines = $$('.hero .hero__ja > div');   // SplitText line masks
      const ja = lines.length ? lines : [$('.hero .hero__ja')];
      return [...$$('.hero__s'), ja[0], $('.hero__latest-img'), ...ja.slice(1), $('.hero__latest-t'), $('.hero__cta')];
    }, { trigger: '.hero', start: 'top top', end: '82% top' });
  }

  /* ---------------- Hero -> About: About covers the hero, the page glides there in one go ----------------
     While About rises (its top from the bottom of the screen to the top) the hero lags at half speed
     and dims. A user scroll that starts down from the hero glides the page to the top of About in one
     move (input locked meanwhile); a user scroll back up from the top of About glides back to the top.
     Scrolling by code (menu links) is left alone. */
  if (motion && $('.hero') && $('#about')) {
    const hero = $('.hero'), about = $('#about');
    const shade = hero.appendChild(document.createElement('i'));
    Object.assign(shade.style, { position: 'absolute', inset: 0, zIndex: 5, background: '#090a0f', opacity: 0, pointerEvents: 'none' });
    ScrollTrigger.create({
      trigger: about, start: 'top bottom', end: 'top top', scrub: true,
      onUpdate: (self) => {
        const p = self.progress;
        hero.style.transform = p > 0 && p < 1 ? `translate3d(0, ${(p * innerHeight * .5).toFixed(1)}px, 0)` : '';
        shade.style.opacity = (p * .55).toFixed(3);
      },
    });
    const lenis = window.PORTS && PORTS.lenis;
    if (lenis) {
      let gliding = false;
      const io = (t) => (t < .5 ? 4 * t ** 3 : 1 - Math.pow(-2 * t + 2, 3) / 2);
      // the gesture that started the glide is swallowed until it ends (PORTS.quiet), so its momentum
      // cannot carry on into About's first step once the glide lands
      const glide = (y) => {
        gliding = true;
        PORTS.quiet && PORTS.quiet();
        lenis.scrollTo(y, { duration: 1.3, easing: io, lock: true, force: true, onComplete: () => { gliding = false; PORTS.quiet && PORTS.quiet(); } });
      };
      const aboutTop = () => about.getBoundingClientRect().top + scrollY;
      ScrollTrigger.create({
        trigger: about, start: 'top bottom-=2', end: 'top top+=2',
        onEnter: () => { if (!gliding && PORTS.userDriven()) glide(aboutTop()); },
        onEnterBack: () => { if (!gliding && PORTS.userDriven()) glide(0); },
      });
    }
  }

  /* ---------------- Staggered dissolve for the other sections ----------------
     Same look as the hero. Pinned stages (About PORTS, the service panels, Works, Value) dissolve as a
     group while the stage leaves (or, for a service panel, while the next panel rises over it); sections
     in normal flow (SIDE DOCK, Company) dissolve element by element as each nears the top.
     Containers are used where their children already animate filter/transform (Value's letters). */
  if (motion) {
    const exitRange = { start: 'bottom bottom', end: () => `bottom ${Math.round(innerHeight * .18)}px` };
    // About: the pinned part leaves with its pin; the Japanese block after it is in normal flow
    if ($('.domain__pin')) dissolve(() => [
      $('.domain__h2'), $('.domain__stmt'),
    ], { trigger: '.domain__pin', ...exitRange });
    dissolveEach([$('.domain__ja')]);

    const panels = $$('.svp__panel');
    panels.forEach((p, i) => {
      const parts = () => [$('.svp__name', p), $('.svp__more', p), $('.svp__en', p), $('.svp__ja', p), $('.svp__img', p)];
      // covered by the next panel; the last one by SIDE DOCK
      const cover = panels[i + 1] || $('.studio');
      if (cover) dissolve(parts, { trigger: cover, start: 'top bottom', end: () => `top ${Math.round(innerHeight * .18)}px` });
    });

    dissolveEach([$('.studio__logo'), $('.studio__sub')]);

    if ($('.works')) dissolve(() => [
      $('#worksList'), ...$$('#worksImgs > a'), $('.works__all'),
    ], { trigger: '.works', ...exitRange });

    dissolveEach([$('.mission__h2'),
      $('.mission__globe'), $('.mission__en'), $('.mission__ja')]);

    if ($('.value')) dissolve(() => [
      $('.value__words'), $('.value__en'), $('.value__ja'),
    ], { trigger: '.value', ...exitRange });
  }

  /* About PORTS (the domain section) lives in about-stage.js: three scroll steps — title morph +
     statement, shader images, full-stage image + Japanese. */

  /* ---------------- Services: accordion + hover stage ---------------- */
  (() => {
    const list = $('#svcList');
    if (!list) return;
    const rows = $$('.svc', list);

    // accordion (one open at a time)
    rows.forEach((row) => {
      const head = $('.svc__head', row);
      head.dataset.cursor = 'Open';
      head.addEventListener('click', () => {
        const open = !row.classList.contains('is-open');
        rows.forEach((r) => {
          const on = r === row && open;
          r.classList.toggle('is-open', on);
          const h = $('.svc__head', r);
          h.setAttribute('aria-expanded', String(on));
          h.dataset.cursor = on ? 'Close' : 'Open';
        });
        if (window.ScrollTrigger) setTimeout(() => ScrollTrigger.refresh(), 850);   // heights changed
      });
    });

    if (!canHover) return;   // touch: accordion only, no hover stage

    // ---- hover: a dark band sweeps across the row (CSS) and a dot graphic plays inside it ----
    const BLUE = [61, 99, 255];
    const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
    // paint a grid of dots whose size/brightness comes from fn(x, y) in 0..1
    const dotField = (ctx, W, H, fn) => {
      const S = 13;
      for (let y = S / 2; y < H; y += S) for (let x = S / 2; x < W; x += S) {
        const v = fn(x, y);
        if (v <= .02) continue;
        ctx.fillStyle = v > .6 ? `rgba(255,255,255,${v})` : rgba(BLUE, Math.min(1, v * 1.6));
        ctx.beginPath(); ctx.arc(x, y, .6 + 1.8 * v, 0, Math.PI * 2); ctx.fill();
      }
    };
    const scenes = [
      // 1. BRANDING — identity rings rippling out through the dots
      (ctx, W, H, t) => {
        const cx = W * .74, cy = H / 2;
        dotField(ctx, W, H, (x, y) => {
          const d = Math.hypot(x - cx, (y - cy) * 1.2);
          const v = .5 + .5 * Math.cos(d * .075 - t * 4);
          return Math.pow(v, 6) * Math.max(0, 1 - d / (W * .5)) + .08;
        });
      },
      // 2. CREATIVE PRODUCTION — a rotating globe made of dots
      (ctx, W, H, t) => {
        dotField(ctx, W, H, () => .08);
        const cx = W * .74, cy = H / 2, R = H * .62, rot = t * .6, tilt = .35;
        for (let la = -80; la <= 80; la += 13) for (let lo = 0; lo < 360; lo += 11) {
          const lat = la * Math.PI / 180, lon = lo * Math.PI / 180 + rot;
          const x = R * Math.cos(lat) * Math.sin(lon), y = R * Math.sin(lat), z = R * Math.cos(lat) * Math.cos(lon);
          const y2 = y * Math.cos(tilt) - z * Math.sin(tilt), f = (y * Math.sin(tilt) + z * Math.cos(tilt)) / R;
          ctx.fillStyle = f > 0 ? `rgba(255,255,255,${.3 + .7 * f})` : rgba(BLUE, .45);
          ctx.beginPath(); ctx.arc(cx + x, cy + y2, f > 0 ? 1.1 + 1.1 * f : .9, 0, Math.PI * 2); ctx.fill();
        }
      },
      // 3. ORIGINAL PRODUCT — dot blocks blinking like an app grid
      (ctx, W, H, t) => {
        const B = 52;
        dotField(ctx, W, H, (x, y) => {
          const bx = Math.floor(x / B), by = Math.floor(y / B);
          const v = .5 + .5 * Math.sin(t * 2.4 - (bx + by) * .8);
          const right = Math.min(1, Math.max(0, (x / W - .35) * 2.2));
          return (Math.pow(v, 4) * .95 + .06) * right + .05;
        });
      },
    ];

    // one canvas per row, animating only while its row is hovered (and briefly after, while it fades)
    const stages = rows.map((row, i) => {
      const canvas = document.createElement('canvas');
      canvas.className = 'svc__canvas';
      canvas.setAttribute('aria-hidden', 'true');
      row.prepend(canvas);
      const ctx = canvas.getContext('2d');
      let W = 0, H = 0, dpr = 1, running = false, t0 = performance.now(), stopTimer = 0;
      const size = () => {
        dpr = Math.min(2, devicePixelRatio || 1);
        W = canvas.clientWidth; H = canvas.clientHeight;
        canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      };
      const loop = () => {
        if (!running) return;
        if (canvas.clientHeight !== H || canvas.clientWidth !== W) size();   // row expanded/collapsed
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);
        scenes[i](ctx, W, H, (performance.now() - t0) / 1000);
        requestAnimationFrame(loop);
      };
      return {
        start() { clearTimeout(stopTimer); if (running) return; size(); running = true; requestAnimationFrame(loop); },
        stop() { clearTimeout(stopTimer); stopTimer = setTimeout(() => { running = false; }, 900); },
      };
    });

    rows.forEach((row, i) => {
      row.addEventListener('pointerenter', () => {
        rows.forEach((r) => r.classList.toggle('is-hover', r === row));
        list.classList.add('is-hovering');
        stages.forEach((s, k) => (k === i ? s.start() : s.stop()));
      });
    });
    list.addEventListener('pointerleave', () => {
      rows.forEach((r) => r.classList.remove('is-hover'));
      list.classList.remove('is-hovering');
      stages.forEach((s) => s.stop());
    });
  })();

  /* ---------------- Marquees (SIDE DOCK, footer): drift + scroll-velocity boost ---------------- */
  $$('[data-marquee]').forEach((track) => {
    if (!motion) return;
    let x = 0, visible = false, last = performance.now();
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(track);
    tick(() => {
      const now = performance.now(), dt = Math.min(.05, (now - last) / 1000); last = now;
      if (!visible) return;   // paused off-screen
      const v = window.PORTS && PORTS.lenis ? Math.abs(PORTS.lenis.velocity || 0) : 0;
      x -= (70 + Math.min(v * 45, 900)) * dt;
      const half = track.scrollWidth / 2;
      if (x <= -half) x += half;
      track.style.transform = `translate3d(${x.toFixed(1)}px, 0, 0)`;
    });
  });

  /* ---------------- Value: CREATIVITY / TECHNOLOGY merge into CREATIVITY × TECHNOLOGY ----------------
     The two words scroll in on two lines and stay put. Once the stage is pinned, the next scroll plays
     the merge as a timed sequence (not scrubbed): every letter flies from its place in the pair to its
     place in the one-line CREATIVITY × TECHNOLOGY (moving and shrinking, FLIP), then the blue × lands
     between them. Scrolling back above the pin plays it in reverse.
     (Was: the pair dissolved into INTER-TAINMENT — now About PORTS alone owns that word.) */
  (() => {
    const value = $('#value');
    if (!value || !motion) return;
    const words = $('.value__words', value), src = $('.value__src', value), dst = $('.value__dst', value);
    const body = $('.value__body', value);
    const clamp01 = (v) => Math.min(1, Math.max(0, v));
    // chewy: a strong ease-in-out for the letters (quint); the × eases out, no overshoot
    const easeIO = (t) => (t < .5 ? 16 * t ** 5 : 1 - Math.pow(-2 * t + 2, 5) / 2);
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);
    // the × glyph sits on the font's maths axis, below the middle of the capitals: measure both inks
    // and lift the × so its centre lines up with the cap centre
    let xLift = 0;
    const measureLift = (fontPx) => {
      const ctx = document.createElement('canvas').getContext('2d');
      const cs = getComputedStyle(dst);
      ctx.font = `${cs.fontWeight} ${fontPx}px ${cs.fontFamily}`;
      const mid = (s) => { const m = ctx.measureText(s); return (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2; };
      return mid('×') - mid('H');   // negative: the × centre is lower than the caps' centre
    };

    const split = (layer) => $$('.value__row', layer).flatMap((row) => {
      const chars = [...row.textContent];
      row.textContent = '';
      return chars.map((c) => {
        const s = document.createElement('span');
        s.className = c === '×' ? 'value__ch value__x' : 'value__ch';
        s.textContent = c === ' ' ? ' ' : c;
        row.appendChild(s); return s;
      });
    });
    const srcChars = split(src), dstChars = split(dst);
    const x = dstChars.find((el) => el.classList.contains('value__x'));
    // the landing spot of each source letter: the dst letters in order, skipping spaces and the ×
    const targets = dstChars.filter((el) => el !== x && el.textContent.trim());
    // CREATIVITY sets off first, TECHNOLOGY a beat later, each left to right
    const delay = srcChars.map((_, i) => (i < 10 ? i * .014 : .1 + (i - 10) * .014));
    let move = srcChars.map(() => ({ dx: 0, dy: 0, k: 1 }));

    const state = { p: 0 };
    const render = () => {
      const p = state.p;
      // letters travel (0 → ~.8)
      srcChars.forEach((el, i) => {
        const t = easeIO(clamp01((p - delay[i]) / .6));
        const m = move[i];
        el.style.transform = t > 0 ? `translate(${(m.dx * t).toFixed(2)}px, ${(m.dy * t).toFixed(2)}px) scale(${(1 + (m.k - 1) * t).toFixed(4)})` : '';
      });
      // the × lands (.6 → .9): scales up with a quarter turn, lifted onto the caps' centre line
      if (x) {
        const t = easeOut(clamp01((p - .6) / .3));
        x.style.opacity = t.toFixed(3);
        x.style.transform = `translateY(${xLift.toFixed(2)}px) scale(${(.2 + .8 * t).toFixed(3)}) rotate(${((1 - t) * -90).toFixed(1)}deg)`;
      }
      const c = clamp01((p - .82) / .12);
      body.style.opacity = c.toFixed(3);
      body.style.transform = `translateY(${((1 - c) * 16).toFixed(1)}px)`;
    };
    // the pair fills the stage; the merged line is sized to the stage width; each letter's move is the
    // offset (and scale) from its rest position to its target, measured with the transforms cleared
    const size = () => {
      const fs = Math.min(words.clientWidth / 9.2, words.clientHeight / 2.3);
      src.style.fontSize = `${fs.toFixed(1)}px`;
      dst.style.fontSize = `${fs.toFixed(1)}px`;
      const lineW = dst.querySelector('.value__row').getBoundingClientRect().width || 1;
      const fs2 = fs * Math.min(1, words.clientWidth * .96 / lineW);
      dst.style.fontSize = `${fs2.toFixed(1)}px`;
      xLift = measureLift(fs2);
      srcChars.forEach((el) => { el.style.transform = ''; });
      move = srcChars.map((el, i) => {
        const a = el.getBoundingClientRect(), b = targets[i] ? targets[i].getBoundingClientRect() : a;
        return { dx: b.left - a.left, dy: b.top - a.top, k: fs2 / fs };
      });
      render();
    };

    value.classList.add('is-live');
    size();
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(size);
    ScrollTrigger.addEventListener('refreshInit', size);

    const play = (onComplete) => gsap.to(state, { p: 1, duration: 1.7, ease: 'none', overwrite: true, onUpdate: render, onComplete });   // was 2.8s
    const rewind = () => gsap.to(state, { p: 0, duration: .9, ease: 'power1.inOut', overwrite: true, onUpdate: render });
    // Scroll lock (as in About PORTS): while the merge plays, the page holds at the merge point, and the
    // rest of the gesture is swallowed when it is done, so the stage is not scrolled away mid-merge.
    // Scrolling by code (menu links) plays it without holding the page.
    let lockId = 0;
    const st = ScrollTrigger.create({
      trigger: value,
      start: () => `top+=${Math.round(innerHeight * .06)} top`,   // a short nudge after the stage pins
      invalidateOnRefresh: true,
      onEnter: () => {
        if (state.p >= 1) return;
        const lenis = window.PORTS && PORTS.lenis;
        if (!lenis || !(PORTS.userDriven && PORTS.userDriven())) { play(); return; }
        const id = ++lockId;
        play(() => { if (id === lockId) { lenis.start(); PORTS.quiet && PORTS.quiet(); } });
        PORTS.quiet && PORTS.quiet();
        lenis.stop();
        lenis.scrollTo(st.start + 2, { immediate: true, force: true });
      },
      onLeaveBack: () => { ++lockId; rewind(); },
    });
  })();

  /* ---------------- Value (B4): the faint 創造力 / 技術力 drift against each other ----------------
     Pointer position over the stage, eased; 創造力 moves against the pointer and sways slowly,
     技術力 follows it (B4 in the benchmark). Runs only while Value is on screen. */
  (() => {
    const stage = $('.value__sticky');
    const k1 = $('.value__kanji--1'), k2 = $('.value__kanji--2');
    if (!motion || !stage || !k1 || !k2) return;
    let mx = 0, my = 0, tx = 0, ty = 0, on = false;
    stage.addEventListener('pointermove', (e) => {
      const r = stage.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - .5; ty = (e.clientY - r.top) / r.height - .5;
    });
    new IntersectionObserver(([e]) => { on = e.isIntersecting; }).observe(stage);
    tick((t) => {
      if (!on) return;
      mx += (tx - mx) * .06; my += (ty - my) * .06;
      k1.style.transform = `translate(${(mx * -6 + Math.sin(t * .2) * 2).toFixed(3)}vw, ${(my * -4).toFixed(3)}svh)`;
      k2.style.transform = `translate(${(mx * 4).toFixed(3)}vw, ${(my * 3).toFixed(3)}svh)`;
    });
  })();

  /* ---------------- About -> Branding: the first service panel covers About with depth ----------------
     While the Services section rises (its top from the bottom of the screen to the top), About lags
     behind at half speed and dims, so the Branding panel slides over it like a card; inside the panel
     the parts arrive at different depths (name first, then the copy, the image last). Uses `translate`,
     which the exit dissolve also uses, but only in a later, separate scroll range. */
  (() => {
    const about = $('#about'), services = $('#services'), p1 = $('.svp__panel--1');
    if (!motion || !about || !services || !p1) return;
    const shade = about.appendChild(document.createElement('i'));
    Object.assign(shade.style, { position: 'absolute', inset: 0, zIndex: 3, background: '#090a0f', opacity: 0, pointerEvents: 'none' });
    const layers = [[$('.svp__name', p1), .1], [$('.svp__more', p1), .14], [$('.svp__en', p1), .2], [$('.svp__ja', p1), .24], [$('.svp__img', p1), .34]].filter(([el]) => el);
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    ScrollTrigger.create({
      trigger: services, start: 'top bottom', end: 'top top', scrub: true,
      onUpdate: (self) => {
        const p = self.progress, vh = innerHeight;
        about.style.transform = p > 0 && p < 1 ? `translate3d(0, ${(p * vh * .5).toFixed(1)}px, 0)` : '';
        shade.style.opacity = (p * .5).toFixed(3);
        layers.forEach(([el, depth]) => { el.style.translate = p < 1 ? `0 ${((1 - ease(p)) * vh * depth).toFixed(1)}px` : ''; });
      },
    });
  })();

  /* ---------------- Service panels (A3): image + related-works count per service ---------------- */
  (() => {
    const works = window.PORTS_WORKS || [];
    $$('.svp__panel').forEach((panel) => {
      const mine = works.filter((w) => w.cat === panel.dataset.cat);
      const img = $('.svp__img', panel), count = $('.svp__count', panel);
      if (count) count.textContent = mine.length;
      if (img && mine[0]) img.style.background = window.PORTS_WORK_IMG(mine[0], 0);
    });
  })();

  /* ---------------- Works (A5 index): the list scrolls through the centre of a pinned stage ---------------- */
  // The name crossing the centre turns dark, its category shows in the middle and three images
  // (or stand-in gradients) stack on the right. Data: window.PORTS_WORKS (featured entries).
  (() => {
    const section = $('#works'), list = $('#worksList');
    if (!section || !list || !window.PORTS_WORKS) return;
    const works = window.PORTS_WORKS.filter((w) => w.featured);
    const n = works.length;
    section.style.setProperty('--works-n', n);
    list.innerHTML = works.map((w) => `<li>${w.title}</li>`).join('');
    const items = $$('li', list), imgs = $$('#worksImgs a');
    const count = $('#worksCount');
    if (count) count.textContent = window.PORTS_WORKS.length;
    let k = -1;
    const show = (i) => {
      if (i === k) return;
      k = i;
      items.forEach((li, j) => li.classList.toggle('is-on', j === i));
      const w = works[i];
      imgs.forEach((d, j) => {
        // all three slots are this work's images; each opens its detail page
        d.href = `work.html#${w.slug}`;
        d.setAttribute('aria-label', `${w.title} — view project`);
        // the new image fades in over the old one while the card comes forward out of its depth
        const lift = lifts[j], layer = document.createElement('i');
        layer.style.background = window.PORTS_WORK_IMG(w, j);
        lift.appendChild(layer);
        const done = () => [...lift.children].slice(0, -1).forEach((o) => o.remove());
        if (!motion || first) { done(); return; }
        gsap.fromTo(layer, { opacity: 0 }, { opacity: 1, duration: .55, ease: 'power2.out', delay: j * .06, onComplete: done });
        gsap.fromTo(lift, { scale: .9, z: -120 }, { scale: 1, z: 0, duration: .9, ease: 'expo.out', delay: j * .06, overwrite: true });
      });
      first = false;
    };
    const lifts = imgs.map((a) => $('.works__lift', a));
    const narrow = matchMedia('(max-width: 960px)');
    let first = true;

    // floating on three depths (front / back / middle, as the CSS places them): each card drifts on its
    // own slow sine, moves against the pointer and lags the scroll in proportion to its depth
    const DEPTH = [1, .3, .6];
    const P = { x: 0, y: 0, tx: 0, ty: 0, vel: 0 };
    if (motion) {
      addEventListener('pointermove', (e) => { P.tx = e.clientX / innerWidth - .5; P.ty = e.clientY / innerHeight - .5; }, { passive: true });
      let on = false;
      new IntersectionObserver(([e]) => { on = e.isIntersecting; }).observe(section);
      tick((t) => {
        if (!on) return;
        P.x += (P.tx - P.x) * .06; P.y += (P.ty - P.y) * .06;
        P.vel += (((window.PORTS && PORTS.lenis && PORTS.lenis.velocity) || 0) - P.vel) * .12;
        imgs.forEach((a, i) => {
          const z = DEPTH[i], ph = i * 2;
          const dx = -P.x * 70 * z + Math.sin(t * .7 + ph) * 5;
          const dy = -P.y * 50 * z + Math.sin(t * .9 + ph) * 10 - P.vel * 1.4 * z;
          a.style.transform = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0) rotate(${(P.x * 3 * z).toFixed(2)}deg)`;
        });
      });
    }
    const update = () => {
      const r = section.getBoundingClientRect(), vh = innerHeight;
      const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - vh)));
      const f = p * (n - 1);
      // one name per step (its line height); the name at the focus line is the current one — on
      // narrow screens the focus sits higher, in the top half above the images
      const step = items[0] ? items[0].offsetHeight : .13 * vh;
      const focus = narrow.matches ? .24 : .38;
      list.style.transform = `translateY(${(focus * vh - f * step).toFixed(1)}px)`;
      show(Math.round(f));
    };
    update();
    if (motion) tick(update); else addEventListener('scroll', update, { passive: true });
  })();

  /* ---------------- Footer: logo rises as the sheet arrives; pieces sink under the pointer ---------------- */
  // Like detroit.paris: the piece under the pointer is pushed down, and once the pointer leaves
  // it springs back with a small overshoot. Hit-testing is by each piece's horizontal span,
  // only while the pointer is over the logo band.
  (() => {
    const big = $('.footer__big');
    if (!big || !motion) return;
    gsap.fromTo(big, { yPercent: 45 }, { yPercent: 18, ease: 'none',
      scrollTrigger: { trigger: '.footer__end', start: 'top bottom', end: 'bottom bottom', scrub: true } });
    if (!canHover) return;
    const pieces = $$('.fl', big).map((el) => ({ el, y: 0, v: 0, l: 0, r: 0 }));
    let px = null;
    const measure = () => pieces.forEach((p) => { const r = p.el.getBoundingClientRect(); p.l = r.left; p.r = r.right; });
    const zone = $('.footer__end');
    zone.addEventListener('pointermove', (e) => {
      const b = big.getBoundingClientRect();
      px = e.clientY >= b.top ? e.clientX : null;
      measure();
    });
    zone.addEventListener('pointerleave', () => { px = null; });
    const SINK = 34, K = 0.045, DAMP = 0.86;   // viewBox units; spring stiffness and damping
    tick(() => {
      pieces.forEach((p) => {
        const hit = px !== null && px >= p.l && px <= p.r;
        p.v = (p.v + ((hit ? SINK : 0) - p.y) * K) * DAMP;
        p.y += p.v;
        if (Math.abs(p.y) < .01 && Math.abs(p.v) < .01) p.y = 0;
        p.el.setAttribute('transform', `translate(0 ${p.y.toFixed(2)})`);
      });
    });
  })();
})();
