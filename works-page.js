// PORTS — works.html: square tiles from works-data.js, filtered by the huge words on the left.
// Hovering a tile hides the image and shows the title (blue) with its discipline tag.
(() => {
  const grid = document.getElementById('wpGrid');
  const works = window.PORTS_WORKS || [];
  if (!grid) return;
  const motion = !!window.gsap && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  const bg = (w) => window.PORTS_WORK_IMG(w, 0);

  // each tile opens the work's detail page (work.html#slug)
  grid.innerHTML = works.map((w) => `
    <li class="wp__tile" data-cat="${w.cat}">
      <a class="wp__link" href="work.html#${w.slug}" data-cursor="View" aria-label="${w.title}">
        <div class="wp__flat" style="background:${w.color || '#e3e7f5'}"></div>
        <div class="wp__img" style="background:${bg(w)}"></div>
        <b class="wp__name">${w.title}</b>
        <span class="wp__tag">${w.tag}</span>
        <span class="wp__year mono">${w.year}</span>
      </a>
    </li>`).join('');
  const tiles = [...grid.children];
  const count = document.getElementById('wpCount');
  if (count) count.textContent = works.length;

  // C3: each tile shows its representative colour first, then the image lays over it, top to bottom.
  // With a real image the fade waits for it to load; WAAPI with fill 'backwards' leaves the
  // hover rules in style.css in charge once the fade has played.
  const lay = (list) => list.forEach((t, i) => {
    const img = t.querySelector('.wp__img');
    const w = works[tiles.indexOf(t)];
    const run = () => img.animate([{ opacity: 0 }, { opacity: 1 }],
      { duration: 500, delay: 600 + i * 160 + Math.random() * 200, easing: 'ease-out', fill: 'backwards' });
    if (!motion) return;
    if (w.images && w.images[0]) { img.style.opacity = 0; const pic = new Image(); pic.onload = () => { img.style.opacity = ''; run(); }; pic.src = w.images[0]; }
    else run();
  });

  const buttons = [...document.querySelectorAll('.wp__filters button')];

  // Filter hover (compare-filter 03++ without the letter wobble): three layers — light blue, blue,
  // ink — wipe in from the side the cursor entered and out toward the side it left. Strong
  // ease-in-out; the leading edge bulges mid-travel and flattens on arrival; layers trail like taffy.
  buttons.forEach((b) => {
    const t = b.textContent.trim();
    b.setAttribute('aria-label', t);
    b.innerHTML = `<span class="wp__o">${t}</span>${[1, 2, 3].map((k) => `<span class="wp__f wp__f${k}" aria-hidden="true">${t}</span>`).join('')}`;
  });
  if (motion) {
    document.querySelector('.wp__filters').classList.add('has-wipe');
    const GOO = 'cubic-bezier(.86,0,.07,1)';
    const goo = (s, p, bulge, sl = 14) => {   // polygon covering fraction p from side s, in %
      const ys = [0, 25, 50, 75, 100];
      const edge = (y) => p * (100 + sl) - sl * (y / 100) + bulge * Math.sin(Math.PI * y / 100);
      const poly = (pts) => `polygon(${pts.join(', ')})`;
      if (s === 'l') return poly(['0% 0%', ...ys.map((y) => `${edge(y).toFixed(2)}% ${y}%`), '0% 100%']);
      if (s === 'r') return poly(['100% 0%', ...ys.map((y) => `${(100 - edge(y)).toFixed(2)}% ${y}%`), '100% 100%']);
      if (s === 't') return poly(['0% 0%', ...ys.map((x) => `${x}% ${edge(x).toFixed(2)}%`), '100% 0%']);
      return poly(['0% 100%', ...ys.map((x) => `${x}% ${(100 - edge(x)).toFixed(2)}%`), '100% 100%']);
    };
    const side = (el, e) => {   // nearest edge to the pointer: l / r / t / b
      const r = el.getBoundingClientRect();
      const d = { l: e.clientX - r.left, r: r.right - e.clientX, t: e.clientY - r.top, b: r.bottom - e.clientY };
      return Object.keys(d).reduce((a, k) => (d[k] < d[a] ? k : a), 'l');
    };
    buttons.forEach((b) => {
      const layers = [...b.querySelectorAll('.wp__f')];
      const run = (s, enter) => layers.forEach((el, i) => {
        const k = enter ? i : layers.length - 1 - i;
        const frames = enter
          ? [{ clipPath: goo(s, 0, 0) }, { clipPath: goo(s, .55, 16), offset: .5 }, { clipPath: goo(s, 1, 0) }]
          : [{ clipPath: goo(s, 1, 0) }, { clipPath: goo(s, .45, -16), offset: .5 }, { clipPath: goo(s, 0, 0) }];
        el.animate(frames, { duration: enter ? 780 + i * 40 : 620, delay: k * (enter ? 95 : 60), easing: GOO, fill: 'forwards' });
      });
      b.addEventListener('pointerenter', (e) => run(side(b, e), true));
      b.addEventListener('pointerleave', (e) => run(side(b, e), false));
    });
  }
  buttons.forEach((b) => b.addEventListener('click', () => {
    buttons.forEach((x) => { const on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', on); });
    const cat = b.dataset.cat;
    const shown = tiles.filter((t) => cat === 'all' || t.dataset.cat === cat);
    tiles.forEach((t) => { t.hidden = !shown.includes(t); });
    if (count) count.textContent = shown.length;
    if (motion) gsap.fromTo(shown, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: .6, stagger: .04, overwrite: true });
    lay(shown);
    window.ScrollTrigger?.refresh();
  }));

  // works.html#branding (from the service panels on the home page; ?cat=branding also works) opens with that filter on
  const start = new URLSearchParams(location.search).get('cat') || location.hash.slice(1);
  const startBtn = start && buttons.find((b) => b.dataset.cat === start);
  if (startBtn) startBtn.click();
  else {
    if (motion) gsap.from(tiles, { opacity: 0, y: 30, duration: .8, stagger: .05, delay: .2 });
    lay(tiles);
  }
})();
