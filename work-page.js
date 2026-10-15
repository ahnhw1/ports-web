// PORTS — work.html#<slug> (or work.html?id=<slug>): one work, rendered from works-data.js in the A
// (immersive) layout. Unknown or missing id -> back to the works list. Links use the #slug form, which
// also survives hosts that drop the query string (the shared Artifact).
(() => {
  const root = document.getElementById('wd');
  const works = window.PORTS_WORKS || [];
  if (!root) return;
  const id = new URLSearchParams(location.search).get('id') || decodeURIComponent(location.hash.slice(1));
  // "Next" changes only the #slug on this same page: render that work afresh
  addEventListener('hashchange', () => location.reload());
  const i = works.findIndex((w) => w.slug === id);
  if (i < 0) { location.replace('works.html'); return; }
  const w = works[i], next = works[(i + 1) % works.length];
  const img = (k) => window.PORTS_WORK_IMG(w, k);
  const CAT = { branding: 'Branding', production: 'Creative Production', product: 'Original Product' };
  document.title = `${w.title} — PORTS`;

  root.innerHTML = `
    <section class="wd__hero" style="background:${img(0)}">
      <a class="wd__back mono" href="works.html">← ALL WORKS</a>
      <h1 class="wd__title">${w.title}</h1>
      <p class="wd__meta mono">${w.tag.toUpperCase()}<br>${w.year}</p>
    </section>
    <section class="wd__intro">
      <div>
        <p class="wd__lead">${w.lead}</p>
        <p class="wd__ja" lang="ja">${w.leadJa}</p>
      </div>
      <dl class="wd__spec">
        <div><dt class="mono">CLIENT</dt><dd>${w.client}</dd></div>
        <div><dt class="mono">CATEGORY</dt><dd>${CAT[w.cat] || w.cat}</dd></div>
        <div><dt class="mono">ROLE</dt><dd>${w.role}</dd></div>
        <div><dt class="mono">YEAR</dt><dd>${w.year}</dd></div>
      </dl>
    </section>
    <div class="wd__full" style="background:${img(1)}"></div>
    <div class="wd__pair"><div style="background:${img(2)}"></div><div style="background:${img(3)}"></div></div>
    <section class="wd__cap"><h2 class="mono">PROCESS</h2><p>${w.process}</p></section>
    <div class="wd__proc" style="background:${img(4)}"></div>
    <a class="wd__next" href="work.html#${next.slug}" data-cursor="Next">
      <small class="mono">NEXT PROJECT</small>
      <b>${next.title} <span aria-hidden="true">→</span></b>
      <span class="wd__peek" style="background:${window.PORTS_WORK_IMG(next, 0)}" aria-hidden="true"></span>
    </a>`;

  // gentle entrance: the title rises out of the hero, the rest fades up as it scrolls in
  if (window.gsap && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    gsap.from('.wd__title', { yPercent: 40, opacity: 0, duration: 1.2, ease: 'pOut', delay: .15 });
    gsap.from('.wd__meta, .wd__back', { opacity: 0, duration: .8, delay: .5 });
    if (window.ScrollTrigger) {
      gsap.utils.toArray('.wd__intro > *, .wd__cap > *, .wd__full, .wd__pair > div, .wd__proc').forEach((el) => {
        gsap.from(el, { y: 50, opacity: 0, duration: 1, ease: 'pOut', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
      });
    }
  }
})();
