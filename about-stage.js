// PORTS — About PORTS (the domain section): a pinned stage played in three scroll steps.
// Each step plays as a timed sequence once its scroll point is passed (not scrubbed), waits for the one
// before it, and plays only once: scrolling back up keeps the end state until the page is reloaded.
//   step 1  the title melts (goo filter) from ENTERTAINMENT into a blue INTERTAINMENT, then the
//           statement's scattered words gather into place, top to bottom (C1)
//   step 2  four live shader images open in two pairs, stage + audience then artists + fans (C7)
//   step 3  the fans image grows from its place in the sentence to fill the stage (type turns white);
//           the moment it is full, the Japanese copy appears
(() => {
  const domain = document.getElementById('about');
  if (!domain) return;
  const pin = domain.querySelector('.domain__pin');
  const h2 = domain.querySelector('.domain__h2'), lq = document.getElementById('domainLq'), cell = document.getElementById('domainEi');
  const blur = document.getElementById('domainGooBlur'), stmt = document.getElementById('domainStmt');
  const ja = domain.querySelector('.domain__ja'), full = document.getElementById('domainFull');
  if (!stmt || !lq) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const motion = !!(window.gsap && window.ScrollTrigger) && !reduced;

  /* ---------- shaders for the images (one per noun) ---------- */
  const HEAD = 'precision mediump float; uniform vec2 r; uniform float t; float h21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); } float n2(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.-2.*f); return mix(mix(h21(i),h21(i+vec2(1,0)),u.x), mix(h21(i+vec2(0,1)),h21(i+1.),u.x), u.y); } float fbm(vec2 p){ float v=0., a=.5; for(int i=0;i<5;i++){ v+=a*n2(p); p=p*2.03+vec2(1.7,9.2); a*=.5; } return v; }';
  const SH = {
    // stage: light beams sweeping down through haze, a glowing floor
    stage: HEAD + `void main(){ vec2 uv=gl_FragCoord.xy/r; float ar=r.x/r.y; vec2 p=vec2(uv.x*ar, uv.y);
      vec3 col=mix(vec3(.01,.015,.06), vec3(.03,.06,.22), uv.y);
      for(int i=0;i<5;i++){ float fi=float(i); vec2 o=vec2(ar*(.1+.2*fi), 1.08); float a=sin(t*.55+fi*1.9)*.55;
        vec2 d=vec2(sin(a), -cos(a)); vec2 q=p-o; float al=dot(q,d); float pe=abs(q.x*d.y-q.y*d.x); float w=.025+al*.16;
        float b=smoothstep(w,0.,pe)*smoothstep(0.,.15,al)*exp(-al*.5);
        col+=b*mix(vec3(.35,.5,1.), vec3(1.), .25+.25*sin(fi))*.6; }
      col+=vec3(.12,.25,.95)*pow(1.-uv.y,5.)*.7; col+=(fbm(p*3.+vec2(t*.1,0.))-.5)*.05; gl_FragColor=vec4(col,1.); }`,
    // audience: a crowd of phone lights / bokeh, twinkling
    audience: HEAD + `void main(){ vec2 uv=gl_FragCoord.xy/r; float ar=r.x/r.y; vec2 p=vec2(uv.x*ar, uv.y);
      vec3 col=mix(vec3(.01,.02,.08), vec3(.02,.04,.16), uv.y);
      for(int L=0;L<3;L++){ float fl=float(L); float s=5.+fl*5.; vec2 g=p*s+vec2(t*.06*(fl+1.), fl*3.1); vec2 id=floor(g); vec2 f=fract(g)-.5;
        float h=h21(id+fl*7.); vec2 off=vec2(h21(id+1.3), h21(id+2.7))-.5; float d=length(f-off*.55); float rad=.12+.22*h;
        float b=smoothstep(rad, rad*.55, d)*step(.35,h); float tw=.55+.45*sin(t*2.2+h*40.);
        col+=b*tw*mix(vec3(.25,.45,1.), vec3(.95,.97,1.), h)*(.55/(fl+1.)+.15); }
      gl_FragColor=vec4(col,1.); }`,
    // artists: one liquid-chrome droplet, its surface rippling and breathing (raymarched)
    artists: HEAD + `float map(vec3 q){ q.y-=sin(t*.9)*.04; q.y*=1.08;
        float w=sin(q.x*3.1+t*1.3)*sin(q.y*2.7-t*1.1)*sin(q.z*3.3+t*.9)*.07 + sin(q.x*7.+t*2.)*sin(q.y*6.-t*1.7)*.018;
        return length(q)-(.66+.025*sin(t*1.4))+w; }
      vec3 env(vec3 d){ vec3 c=mix(vec3(.02,.04,.16), vec3(.35,.5,1.), smoothstep(-.3,.7,d.y)); c+=vec3(1.)*smoothstep(.06,.0,abs(d.y-.12+.06*sin(d.x*5.+t)))*.85; c+=vec3(.6,.75,1.)*pow(max(0.,d.y),12.); return c; }
      void main(){ vec2 p=(gl_FragCoord.xy-.5*r)/r.y; vec3 ro=vec3(0.,0.,2.2), rd=normalize(vec3(p,-1.5)); float dist=0.; float hit=0.;
        for(int i=0;i<72;i++){ vec3 q=ro+rd*dist; float d=map(q); if(d<.002){ hit=1.; break; } dist+=d*.8; if(dist>6.) break; }
        vec3 col=mix(vec3(.05,.08,.3), vec3(.75,.82,1.), smoothstep(-.5,.6,p.y));
        if(hit>.5){ vec3 q=ro+rd*dist; vec2 e=vec2(.002,0.); vec3 n=normalize(vec3(map(q+e.xyy)-map(q-e.xyy), map(q+e.yxy)-map(q-e.yxy), map(q+e.yyx)-map(q-e.yyx)));
          float fr=pow(1.-max(0.,dot(n,-rd)),3.); col=env(reflect(rd,n)); col=mix(col, vec3(.2,.35,1.), .25+fr*.2); }
        gl_FragColor=vec4(col,1.); }`,
    // fans: flowing silk, brand blue to pale
    fans: HEAD + `void main(){ vec2 uv=gl_FragCoord.xy/r; vec2 p=vec2(uv.x*r.x/r.y, uv.y)*1.6;
      vec2 q=vec2(fbm(p+vec2(0.,t*.12)), fbm(p+vec2(5.2,1.3)-t*.1)); vec2 w=vec2(fbm(p+3.*q+vec2(1.7,9.2)+t*.08), fbm(p+3.*q+vec2(8.3,2.8)));
      float f=fbm(p+3.*w); vec3 col=mix(vec3(.04,.1,.55), vec3(.1,.25,.88), smoothstep(.2,.6,f)); col=mix(col, vec3(.55,.68,1.), smoothstep(.55,.85,f));
      col=mix(col, vec3(.96,.97,1.), smoothstep(.78,.98,f)*.8); col+=pow(max(0., sin((p.x+p.y*.6+f*2.)*3.+t*.5)),12.)*.18; gl_FragColor=vec4(col,1.); }`,
  };
  const VERT = 'attribute vec2 a; void main(){ gl_Position=vec4(a,0.,1.); }';
  const glView = (canvas, frag) => {
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false });
    if (!gl) return null;
    const sh = (ty, src) => { const s = gl.createShader(ty); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s)); return s; };
    const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, frag)); gl.linkProgram(pr); gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, 'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const ur = gl.getUniformLocation(pr, 'r'), ut = gl.getUniformLocation(pr, 't');
    return {
      size(w, h, scale = 1) { const d = Math.min(2, devicePixelRatio || 1) * scale; canvas.width = Math.max(2, Math.round(w * d)); canvas.height = Math.max(2, Math.round(h * d)); canvas.style.width = `${w}px`; canvas.style.height = `${h}px`; gl.viewport(0, 0, canvas.width, canvas.height); },
      draw(time) { gl.uniform2f(ur, canvas.width, canvas.height); gl.uniform1f(ut, time); gl.drawArrays(gl.TRIANGLES, 0, 3); },
    };
  };

  /* ---------- statement: wrap words, keep the image slots in place ---------- */
  const words = [], slots = [];
  [...stmt.childNodes].forEach((node) => {
    if (node.nodeType === 3) {
      const frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
        const w = document.createElement('span'); w.className = 'w'; w.textContent = part; frag.appendChild(w); words.push(w);
      });
      node.replaceWith(frag);
    } else if (node.matches('i.domain__img')) {
      const cv = document.createElement('canvas'); node.appendChild(cv);
      slots.push({ el: node, cv, view: glView(cv, SH[node.dataset.shader]), open: 0 });
    } else if (node.matches('b')) { node.classList.add('w'); words.push(node); }
  });

  const fullView = full ? glView(full, SH.fans) : null;
  let fsStmt = 0, wE = 0, wI = 0, fsTitle = 0;
  const measure = () => {
    fsStmt = parseFloat(getComputedStyle(stmt).fontSize);
    slots.forEach((s) => { s.W = fsStmt * 2.3; s.view && s.view.size(s.W, fsStmt * .78); });
    fsTitle = parseFloat(getComputedStyle(h2).fontSize);
    const probe = (ch) => { const s = document.createElement('span'); s.textContent = ch; s.style.display = 'inline-block'; h2.appendChild(s); const w = s.getBoundingClientRect().width; s.remove(); return w; };
    wE = probe('E'); wI = probe('I');
    // the takeover image is one screen, held in place across the section (same scale as in the sentence)
    fullView && fullView.size(domain.clientWidth, innerHeight);
  };

  if (!motion) {   // static: the end of step 2, images open, Japanese shown
    measure();
    slots.forEach((s) => { s.el.style.width = `${s.W}px`; s.view && s.view.draw(3); });
    return;
  }

  /* ---------- the three steps ---------- */
  const clamp = (v) => Math.min(1, Math.max(0, v));
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const io3 = (t) => (t < .5 ? 4 * t ** 3 : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const io5 = (t) => (t < .5 ? 16 * t ** 5 : 1 - Math.pow(-2 * t + 2, 5) / 2);
  const mixInkBlue = (t) => `rgb(${Math.round(11 + 15 * t)} ${Math.round(11 + 52 * t)} ${Math.round(13 + 211 * t)})`;
  const [chE, chI] = [...cell.children];
  const state = { a: 0, b: 0, c: 0 };
  const DUR = { a: 1.35, b: 1, c: 1.15 };   // seconds each step holds the page (was 1.9 / 1.3 / 1.5)
  let isFull = false;

  const render = () => {
    const { a, b, c } = state;
    // step 1a: the melt (first 55% of step 1)
    const k = Math.sin(Math.PI * seg(a, 0, .55));
    blur.setAttribute('stdDeviation', (k * fsTitle * .085).toFixed(2));
    lq.style.filter = k > .002 ? 'url(#domainGoo)' : '';
    const u = io3(seg(a, .17, .38));
    chE.style.opacity = (1 - u).toFixed(3); chI.style.opacity = u.toFixed(3);
    cell.style.width = `${(wE + (wI - wE) * u).toFixed(1)}px`;
    lq.style.color = mixInkBlue(io3(seg(a, .2, .41)));
    domain.classList.toggle('is-inter', a > .05);
    // step 1b: the words gather, top to bottom (overlapping the end of the melt)
    const n = words.length, g = seg(a, .3, 1);
    words.forEach((w, i) => {
      const l = clamp(g * 1.6 - (i / n) * .6), e = io3(l);
      w.style.marginRight = `${((1 - e) * 7).toFixed(3)}vw`;
      w.style.opacity = (.25 + .75 * l).toFixed(3);
    });
    // step 2: the images open in two pairs: stage + audience, then artists + fans
    slots.forEach((s, i) => {
      const o = io5(i < 2 ? seg(b, 0, .58) : seg(b, .42, 1));
      s.open = o; s.el.style.width = `${(s.W * o).toFixed(1)}px`;
    });
    // step 3: the fans image takes the stage (clip from its inline box to full), then the Japanese
    const x = io5(seg(c, 0, .78));
    if (full) {
      full.style.display = x > 0 ? 'block' : 'none';
      if (x > 0) {
        const sr = slots[3].el.getBoundingClientRect(), st = full.getBoundingClientRect();
        full.style.clipPath = `inset(${((sr.top - st.top) * (1 - x)).toFixed(1)}px ${((st.right - sr.right) * (1 - x)).toFixed(1)}px ${((st.bottom - sr.bottom) * (1 - x)).toFixed(1)}px ${((sr.left - st.left) * (1 - x)).toFixed(1)}px)`;
      }
    }
    if ((x > .5) !== isFull) { isFull = x > .5; domain.classList.toggle('is-full', isFull); }
    ja.style.opacity = io3(seg(c, .8, 1)).toFixed(3);
    ja.style.transform = `translateY(${((1 - io3(seg(c, .8, 1))) * 14).toFixed(1)}px)`;
  };

  // play a step forward once its scroll point is passed (after the steps before it), backward when
  // scrolled back above it (after the steps after it have unwound)
  const ORDER = ['a', 'b', 'c'];
  // one tween per step, replaced explicitly (GSAP's auto-overwrite between two tweens made in the same
  // frame kept the older one and dropped the newer one's callback)
  const tweens = {};
  const play = (key, to, onComplete) => {
    const i = ORDER.indexOf(key);
    let delay = 0;
    if (to === 1) ORDER.slice(0, i).forEach((p) => { delay += (1 - state[p]) * DUR[p]; });
    else ORDER.slice(i + 1).forEach((p) => { delay += state[p] * DUR[p] * .6; });
    tweens[key]?.kill();
    tweens[key] = gsap.to(state, { [key]: to, duration: DUR[key] * (to ? 1 : .6) * Math.abs(to - state[key]) || .01, delay, ease: 'none', overwrite: false, onUpdate: render, onComplete });
  };

  // Scroll lock: while a step plays, the page holds at that step. A fast fling past several steps is
  // pulled back to the first step that has not played yet (forward) or the last one that has not
  // unwound yet (backward); the steps beyond it are released again, and scrolling resumes when the step
  // is done, so every step is always seen, in order.
  const lenis = window.PORTS && PORTS.lenis;
  const triggers = {};
  let lockId = 0;
  const lock = (y, key, to) => {
    if (!lenis) { play(key, to); return; }
    const id = ++lockId;
    // play first: the pull-back below fires other steps' callbacks synchronously, and any lock they make
    // must be the last word (it replaces this tween and owns the unlock)
    // when the step is done, scrolling resumes, but the gesture still running is swallowed until it ends
    play(key, to, () => { if (id === lockId) { lenis.start(); PORTS.quiet && PORTS.quiet(); } });
    PORTS.quiet && PORTS.quiet();
    lenis.stop();
    lenis.scrollTo(y, { immediate: true, force: true });
  };
  const STEPS = { a: .03, b: .36, c: .66 };   // where each step starts, as a share of the pinned scroll
  Object.entries(STEPS).forEach(([key, at]) => {
    triggers[key] = ScrollTrigger.create({
      trigger: pin,
      start: () => `top+=${Math.round((pin.offsetHeight - innerHeight) * at)} top`,
      invalidateOnRefresh: true,
      // Plays once: a step that has played stays in its end state (scrolling back up does not unwind
      // it; only a reload does). The pull-back crosses other steps' points; a step already played
      // ignores a re-enter. Scrolling by code (menu links) plays the steps without holding the page.
      onEnter: () => {
        if (state[key] >= 1) return;
        if (!(window.PORTS && PORTS.userDriven && PORTS.userDriven())) { play(key, 1); return; }
        const first = ORDER.find((k) => state[k] < 1);   // the first step still to play
        lock(triggers[first].start + 2, first, 1);
      },
    });
  });

  measure();
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { measure(); render(); });
  ScrollTrigger.addEventListener('refreshInit', measure);
  ScrollTrigger.addEventListener('refresh', render);
  render();

  // shader clock: only while the section is on screen, only the images that are open
  let visible = false;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(domain);
  gsap.ticker.add((time) => {
    if (!visible) return;
    slots.forEach((s) => { if (s.view && s.open > .01) s.view.draw(time); });
    if (fullView && full.style.display === 'block') fullView.draw(time);
  });
})();
