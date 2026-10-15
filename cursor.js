// PORTS — dot cursor: a small blue dot that follows the pointer on a soft spring.
// script.js adds the label bubble ("View", "Go"…) over elements with a cursor label.
// Pointer devices only; hidden for touch and reduced motion.
(() => {
  const dot = document.getElementById('boat');
  if (!dot) return;
  if (!matchMedia('(hover: hover)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) { dot.hidden = true; return; }

  const FOLLOW = 14;   // spring: higher = snappier
  let x = -100, y = -100, tx = -100, ty = -100, seen = false, prev = performance.now();
  addEventListener('pointermove', (e) => {
    tx = e.clientX; ty = e.clientY;
    if (!seen) { seen = true; x = tx; y = ty; dot.classList.add('is-on'); }
  }, { passive: true });
  document.addEventListener('pointerleave', () => dot.classList.remove('is-on'));
  document.addEventListener('pointerenter', () => { if (seen) dot.classList.add('is-on'); });

  const loop = (now) => {
    requestAnimationFrame(loop);
    const k = 1 - Math.exp(-Math.min(.05, (now - prev) / 1000) * FOLLOW); prev = now;
    x += (tx - x) * k; y += (ty - y) * k;
    dot.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
  };
  requestAnimationFrame(loop);
})();
