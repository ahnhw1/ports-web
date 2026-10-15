// PORTS — Phase 3: finishing details.
// Hover scramble on labels, typewriter section labels, arrow swap on CTAs. All of it is skipped
// under reduced motion; screen readers always get the real label via aria-label.
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasScramble = !!(window.gsap && window.ScrambleTextPlugin) && !reduced;
  const canHover = matchMedia('(hover: hover)').matches;
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- arrow swap: the arrow leaves to the top-right, a fresh one arrives from bottom-left ---------- */
  $$('.link-row > svg, .cards a > svg').forEach((svg) => {
    const box = document.createElement('span');
    box.className = 'arrow-swap';
    box.setAttribute('aria-hidden', 'true');
    svg.replaceWith(box);
    box.append(svg, svg.cloneNode(true));
  });

  if (reduced) return;

  /* ---------- hover scramble ---------- */
  // label = the element that only holds text; for mixed content (e.g. "<small>01</small> WHAT WE DO")
  // the trailing text is wrapped in a span first
  const labelOf = (el) => {
    if (!el.children.length) return el;
    const text = [...el.childNodes].reverse().find((n) => n.nodeType === 3 && n.textContent.trim());
    if (!text) return null;
    const span = document.createElement('span');
    span.textContent = text.textContent.trim();
    text.replaceWith(' ', span);
    return span;
  };
  if (hasScramble && canHover) {
    gsap.registerPlugin(ScrambleTextPlugin);
    const targets = [
      ['.nav a'], ['.footer__nav a'], ['.cards a', 'strong'], ['.link-row', '.link-row__text'],
      ['#reelBtn', '.reel__text'], ['.footer__top'],
    ];
    targets.forEach(([hostSel, labelSel]) => {
      $$(hostSel).forEach((host) => {
        const label = labelSel ? host.querySelector(labelSel) : labelOf(host);
        if (!label) return;
        const text = label.textContent;
        if (!host.hasAttribute('aria-label') && host.tagName === 'A') host.setAttribute('aria-label', host.textContent.replace(/\s+/g, ' ').trim());
        label.classList.add('scr');
        host.addEventListener('pointerenter', () => {
          label.style.minWidth = `${label.offsetWidth}px`;      // no layout jump while scrambling
          gsap.to(label, {
            duration: .7, ease: 'none', overwrite: true,
            scrambleText: { text, chars: '/-·:', revealDelay: .15, speed: .9 },
            onComplete: () => { label.style.minWidth = ''; },
          });
        });
      });
    });
  }
})();
