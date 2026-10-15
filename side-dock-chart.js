// PORTS — SIDE DOCK as a nautical chart (compare-gradient 1+). The brand blue is the deep sea around
// the logo; contours step up through lighter blues, bunch into a coastline and reach land in the
// Works background colour, so the works list follows without a seam. Contours near the pointer light up.
(() => {
  const dock = document.getElementById('creative-studio');
  const canvas = dock && dock.querySelector('.studio__chart');
  const marks = dock && dock.querySelector('.studio__marks');
  if (!canvas) return;
  const gl = canvas.getContext('webgl2', { antialias: false });
  if (!gl) return;   // the panel's CSS gradient stays as the fallback

  const VERT = `#version 300 es
    in vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`;
  const FRAG = `#version 300 es
    precision highp float;
    uniform vec2 uRes; uniform float uTime; uniform vec2 uMouse; uniform float uMouseOn; uniform float uDpr;
    out vec4 o;
    const vec3 NAVY = vec3(.04,.06,.23), DEEP = vec3(.06,.13,.55), BLUE = vec3(.102,.247,.878), MID = vec3(.29,.40,.91),
               LIGHT = vec3(.54,.635,1.), PALE = vec3(.84,.878,1.), BG = vec3(.957,.965,.992);
    float h21(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }
    float noise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.-2.*f);
      return mix(mix(h21(i),h21(i+vec2(1,0)),u.x), mix(h21(i+vec2(0,1)),h21(i+1.),u.x), u.y); }
    float fbm(vec2 p){ float v=0., a=.5; mat2 m=mat2(1.6,1.2,-1.2,1.6); for(int i=0;i<5;i++){ v+=a*noise(p); p=m*p; a*=.5; } return v; }
    vec3 ramp(float x){ x=clamp(x,0.,1.);
      return x<.3 ? mix(BLUE,MID,x/.3) : x<.55 ? mix(MID,LIGHT,(x-.3)/.25) : x<.8 ? mix(LIGHT,PALE,(x-.55)/.25) : mix(PALE,BG,(x-.8)/.2); }
    float grain(){ return (h21(gl_FragCoord.xy + fract(uTime*7.)*91.) - .5); }
    void main(){
      vec2 uv = vec2(gl_FragCoord.x/uRes.y, 1. - gl_FragCoord.y/uRes.y), mp = vec2(uMouse.x/uRes.y, 1. - uMouse.y/uRes.y);
      float y = uv.y, t = uTime*.03;
      float f = fbm(uv*vec2(2.,2.6) + vec2(t, -t*.5));
      float g = fbm(uv*7. + vec2(-t*2., t));
      float d = smoothstep(.34, 1.0, y + (f-.5)*.42 + (g-.5)*.05);
      // the sea always reaches land before the section ends: contours bunch into a coastline, then white
      d = min(1., d + pow(smoothstep(.6, .95, y + (f-.5)*.2 + (g-.5)*.05), 2.2));
      float N = 9., k = d*N, lv = floor(k)/N;
      vec3 col = ramp(lv) * mix(.975, 1.02, fract(k));              // a faint slope inside each band
      float on = step(.003, d)*(1. - smoothstep(.96, 1., d));
      // hatching in the deepest band
      float hatch = step(.62, fract((gl_FragCoord.x + gl_FragCoord.y)/(7.*uDpr)));
      col = mix(col, DEEP, hatch*(1. - smoothstep(.04, .14, d))*on*.35);
      float w = fwidth(k), a = abs(fract(k+.5)-.5);
      float thin = 1. - smoothstep(0., w*1.25, a), thick = 1. - smoothstep(0., w*2.6, a);
      float index = step(2.5, mod(floor(k+.5), 3.));                   // every third contour is an index contour
      float dash = step(.32, fract((gl_FragCoord.x*.75 + gl_FragCoord.y*.25)/(13.*uDpr)));
      float k2 = d*N*4., w2 = fwidth(k2);
      float minor = 1. - smoothstep(0., w2*1.1, abs(fract(k2+.5)-.5));
      float glow = uMouseOn*(1. - smoothstep(0., .2, length(uv - mp)));
      col = mix(col, mix(LIGHT, BLUE, smoothstep(.3,.7,d)), minor*(.16 + glow*.55)*on);
      col = mix(col, mix(PALE, NAVY, smoothstep(.2,.8,d)), mix(thin*dash, thick, index)*.8*on);
      col = mix(col, vec3(1.), max(thin, thick*index)*glow*.7*on*(1. - d*.6));
      // graticule
      float cell = 150.*uDpr;
      float gx = 1. - smoothstep(0., 1.2, abs(mod(gl_FragCoord.x + cell*.5, cell) - cell*.5));
      float gy = 1. - smoothstep(0., 1.2, abs(mod(gl_FragCoord.y + cell*.5, cell) - cell*.5));
      float land = smoothstep(.97, 1., d);
      col = mix(col, mix(vec3(1.), BLUE, smoothstep(.2, .9, d)), max(gx, gy)*.13*(1. - land));
      col = mix(col, BG, land);
      col = mix(col, BG, smoothstep(.92, .98, y));
      col += grain()*.035*(1. - smoothstep(.92, .98, y));
      o = vec4(col, 1.);
    }`;

  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s)); return s; };
  const pr = gl.createProgram();
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { console.error(gl.getProgramInfoLog(pr)); return; }
  const U = (n) => gl.getUniformLocation(pr, n);
  const u = { res: U('uRes'), time: U('uTime'), mouse: U('uMouse'), mouseOn: U('uMouseOn'), dpr: U('uDpr') };
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const ap = gl.getAttribLocation(pr, 'p');
  gl.useProgram(pr); gl.enableVertexAttribArray(ap); gl.vertexAttribPointer(ap, 2, gl.FLOAT, false, 0, 0);

  // chart marks: latitude labels on the shader's 150px grid (the longitude row ran right under the logo,
  // so it was dropped), soundings that shoal toward the coast,
  // a scale bar and the chart title just above the coastline
  let lastW = 0, lastH = 0;
  const buildMarks = (W, H) => {
    if (!marks || (W === lastW && H === lastH)) return;
    lastW = W; lastH = H;
    const cell = 150, out = [];
    // latitude labels sit on the page gutter; if a section label is present they skip the one it would overlap
    // (offsetTop, not getBoundingClientRect, so the reveal transform doesn't skew the measurement)
    const head = dock.querySelector('.chapter');
    let hTop = -1e4;
    if (head) { hTop = 0; for (let el = head; el && el !== dock; el = el.offsetParent) hTop += el.offsetTop; }
    const hBot = hTop + (head ? head.offsetHeight : 0);
    for (let yy = cell, k = 0; yy < H * .92; yy += cell, k++) {
      if (yy < H * .32) continue;   // no labels over the land
      const top = H - yy - 13;
      if (top + 12 > hTop - 6 && top < hBot + 6) continue;
      out.push(`<span class="lat" style="top:${top}px">35°${String((100 - k) % 60).padStart(2, '0')}'N</span>`);
    }
    for (let i = 0; i < 46; i++) {
      const fx = Math.abs((Math.sin(i * 12.9898) * 43758.5453) % 1), fy = Math.abs((Math.sin(i * 78.233) * 12345.678) % 1);
      const yv = .42 + fy * .3, depth = Math.round(48 * (1 - (yv - .42) / .32) + 2);
      out.push(`<span class="snd${yv < .52 ? ' deep' : yv > .64 ? ' shallow' : ''}" style="left:${fx * W}px;top:${yv * H}px">${depth}</span>`);
    }
    out.push('<span class="scale"><i></i>0 — 200 m</span>');
    out.push('<span class="title">SIDE DOCK — Shibuya, Tokyo<br>Soundings in metres</span>');
    marks.innerHTML = out.join('');
  };

  // pointer: contours within reach of the cursor brighten (eased in and out)
  let mx = -1e4, my = -1e4, on = 0, onT = 0;
  dock.addEventListener('pointermove', (e) => { const r = dock.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; onT = 1; });
  dock.addEventListener('pointerleave', () => { onT = 0; });

  // draw only while the section is on screen
  let visible = false;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: '10% 0px' }).observe(dock);

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let drawn = false;
  const frame = (now) => {
    requestAnimationFrame(frame);
    if (!visible && drawn) return;
    const W = dock.clientWidth, H = dock.clientHeight;
    buildMarks(W, H);
    on += (onT - on) * .08;
    const dpr = Math.min(1.5, devicePixelRatio || 1), cw = Math.round(W * dpr), ch = Math.round(H * dpr);
    if (canvas.width !== cw || canvas.height !== ch) { canvas.width = cw; canvas.height = ch; }
    gl.viewport(0, 0, cw, ch);
    gl.uniform2f(u.res, cw, ch); gl.uniform1f(u.time, reduced ? 3 : now / 1000); gl.uniform1f(u.dpr, dpr);
    gl.uniform2f(u.mouse, mx * dpr, ch - my * dpr); gl.uniform1f(u.mouseOn, on);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    drawn = true;
  };
  requestAnimationFrame(frame);
})();
