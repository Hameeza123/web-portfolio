// Landing intro: the Nujabes painting rises out of flame, then sways like a branch in the wind.
(function () {
  const IMG_W = 1920, IMG_H = 1200;           // original artwork size (layout reference)
  const CUT_W = 1160, CUT_H = 900;            // cutout crop (top-left of the artwork)
  const REVEAL = 1.2;                          // seconds for the flame to burn the shape in

  const vert = `
    attribute vec2 p;
    void main() { gl_Position = vec4(p, 0.0, 1.0); }
  `;

  const frag = `
    precision highp float;
    uniform sampler2D uTex;
    uniform vec2 uRes;       // canvas size in px
    uniform float uImgH;     // displayed artwork height in px
    uniform vec2 uCut;       // cutout extent in artwork-height units
    uniform float uT;        // seconds since start
    uniform float uWind;     // smoothed pointer gust
    uniform vec2 uMouse;     // pointer in artwork-height units
    uniform float uStill;    // 1 = reduced motion

    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x),
                 mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
    }
    float fbm(vec2 p) {
      float v = 0.0, a = 0.5;
      for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + 17.1; a *= 0.5; }
      return v;
    }

    vec4 paint(vec2 q) {
      vec2 uv = q / uCut;
      if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return vec4(0.0);
      return texture2D(uTex, uv);   // premultiplied
    }

    vec3 firePal(float x) {
      // kept saturated: the page is white, so a pale core would vanish
      vec3 ember = vec3(0.42, 0.02, 0.05);
      vec3 red   = vec3(0.86, 0.13, 0.05);
      vec3 flame = vec3(1.00, 0.46, 0.05);
      vec3 gold  = vec3(1.00, 0.70, 0.16);
      x = clamp(x, 0.0, 1.0) * 3.0;
      return x < 1.0 ? mix(ember, red, x) : x < 2.0 ? mix(red, flame, x - 1.0) : mix(flame, gold, x - 2.0);
    }

    // colours lifted from the painting: maroon, olive green, teal, ochre
    vec3 artPal(float h) {
      return h < 0.25 ? vec3(0.66, 0.11, 0.13)
           : h < 0.50 ? vec3(0.42, 0.55, 0.16)
           : h < 0.75 ? vec3(0.13, 0.46, 0.52)
           :            vec3(0.90, 0.62, 0.18);
    }
    vec3 saturate3(vec3 c, float k) {
      float l = dot(c, vec3(0.299, 0.587, 0.114));
      return clamp(mix(vec3(l), c, k), 0.0, 1.0);
    }

    void main() {
      vec2 q = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uImgH;
      float T = mix(uT, 100.0, uStill);

      // ── branch sway: rooted at the left edge, bending more toward the tips ──
      vec2 root = vec2(-0.05, 0.42);
      vec2 r = q - root;
      float d = clamp(length(r), 0.0, 1.3);
      float sw = smoothstep(0.7, 3.0, T) * (1.0 - uStill);
      float gust = 0.5 + 0.5 * sin(T * 0.21 + 1.7);
      float sway = 0.030 * sin(T * 0.55)
                 + 0.014 * sin(T * 1.31 + 1.3) * gust
                 + 0.006 * sin(T * 2.70 + 0.4) * gust
                 + uWind;
      float ang = -sway * d * d * sw;
      float ca = cos(ang), sa = sin(ang);
      vec2 qs = root + mat2(ca, sa, -sa, ca) * r;
      // leaf flutter at the extremities
      vec2 fl = vec2(fbm(q * 3.0 + vec2(T * 0.7, 0.0)), fbm(q * 3.0 + vec2(5.2, T * 0.6))) - 0.5;
      qs += fl * 0.012 * d * d * (0.6 + 0.8 * gust) * sw;
      // pointer breeze: nearby paint leans away from the cursor
      vec2 m = q - uMouse;
      qs -= m * 0.05 * exp(-dot(m, m) / 0.02) * sw;

      // ── flame reveal: a front rising from the root, low parts first ──
      // the fire's "gravity" points up and to the left: noise scrolls that way (+x, +y in noise space)
      float front = clamp((T - 0.15) / ${REVEAL.toFixed(2)}, 0.0, 2.0) * 1.3 + 0.2;
      float order = 0.55 * clamp(length(q - root) / 1.05, 0.0, 1.0) + 0.45 * (1.0 - q.y / 0.9);
      float lick = fbm(q * vec2(5.0, 2.6) + vec2(T * 1.2, T * 3.0));
      order += 0.18 * (lick - 0.5);
      float e = front - order;

      float heat = e > 0.0 ? exp(-e / 0.075) : 1.0;
      heat *= 1.0 - uStill;
      float reveal = smoothstep(0.0, 0.035, e);

      // heat haze: sample from below-right so the shape stretches up-left like a flame
      float rise = fbm(q * vec2(4.0, 1.5) + vec2(T * 1.4, T * 3.6));
      vec2 hz = vec2((rise - 0.5) * 0.03 + 0.035 * rise, 0.07 * rise) * heat;
      vec4 c = paint(qs + hz);
      vec3 rgb = c.a > 0.001 ? c.rgb / c.a : vec3(0.0);
      float flick = 0.65 + 0.35 * fbm(q * 9.0 + vec2(T * 2.0, T * 6.0));
      // a light glow at the front that borrows the paint's own colours, then fades back to paint
      vec3 glow = mix(firePal(heat * flick), saturate3(rgb, 1.7), 0.55);
      rgb = mix(rgb, glow, clamp(heat * 0.75, 0.0, 0.6));
      vec4 col = vec4(rgb * c.a * reveal, c.a * reveal);

      // flame tongues: thin upward licks ahead of the front, shaped by the paint below them
      float tn = fbm(q * vec2(11.0, 3.2) + vec2(T * 2.0, T * 5.0));
      float edge = e + 0.11 * tn - 0.05;
      vec4 tp = paint(qs + vec2(0.03 + 0.05 * rise, 0.04 + 0.08 * rise));
      float tongueA = tp.a;
      float tongue = smoothstep(0.0, 0.012, edge) * smoothstep(-0.11, -0.04, e)
                   * (1.0 - reveal) * tongueA * (1.0 - uStill);
      vec3 tpc = tp.a > 0.001 ? tp.rgb / tp.a : vec3(0.0);
      vec3 tc = mix(firePal(0.45 + 0.55 * clamp(edge / 0.08, 0.0, 1.0) * flick), saturate3(tpc, 1.8), 0.5);
      col += vec4(tc, 1.0) * tongue * 0.7 * (1.0 - col.a);

      // sparks: streaks thrown up-left off the burning front, two sizes
      float emberAmt = 1.0 - smoothstep(${(REVEAL * 0.9).toFixed(2)}, ${(REVEAL + 1.6).toFixed(2)}, T);
      float band = smoothstep(-0.18, 0.0, e) * (1.0 - smoothstep(0.12, 0.55, e));
      float near = paint(q + vec2(0.05, 0.08)).a;
      float gate = emberAmt * band * near * (1.0 - uStill);
      if (gate > 0.001) {
        for (int L = 0; L < 2; L++) {
          float sc = L == 0 ? 30.0 : 56.0;
          vec2 vel = L == 0 ? vec2(3.5, 9.0) : vec2(6.0, 15.0);
          vec2 g = q * sc + vel * T;
          g.x += 0.35 * sin(q.y * sc * 0.3 + T * 4.0);
          vec2 cell = floor(g);
          float h = hash(cell + float(L) * 13.0);
          if (h > 0.87) {
            vec2 sp = 0.35 + 0.3 * vec2(hash(cell + 3.1), hash(cell + 7.7));
            vec2 dv = fract(g) - sp;
            vec2 vn = normalize(vel);
            float dist = length(vec2(dot(dv, vn) * 0.45, dot(dv, vec2(-vn.y, vn.x))));
            float tw = 0.45 + 0.55 * pow(0.5 + 0.5 * sin(T * 22.0 + h * 60.0), 2.0);
            float sp1 = (smoothstep(0.11, 0.0, dist) + 0.35 * smoothstep(0.16, 0.0, dist)) * tw * gate;
            sp1 = clamp(sp1, 0.0, 1.0);
            vec3 sc1 = h > 0.97 ? firePal(0.7) : artPal(fract(h * 37.0));
            col = vec4(sc1 * sp1 + col.rgb * (1.0 - sp1), sp1 + col.a * (1.0 - sp1));
          }
        }
      }

      gl_FragColor = col;
    }
  `;

  function init() {
    const img = document.querySelector('img.full');
    const canvas = document.getElementById('flame-canvas');
    const fail = () => document.documentElement.classList.remove('flame-on');
    if (!canvas) return fail();
    const gl = canvas.getContext('webgl', { premultipliedAlpha: true, antialias: false });
    if (!gl) return fail();

    function shader(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    }
    let prog;
    try {
      prog = gl.createProgram();
      gl.attachShader(prog, shader(gl.VERTEX_SHADER, vert));
      gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, frag));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    } catch (err) {
      console.warn('flame-bloom:', err);
      return fail();
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const U = {};
    ['uTex', 'uRes', 'uImgH', 'uCut', 'uT', 'uWind', 'uMouse', 'uStill'].forEach(n => { U[n] = gl.getUniformLocation(prog, n); });

    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 0;
    let dpr = 1, start = 0, wind = 0, windTarget = 0, lastX = null, lastMove = 0;
    const mouse = [-10, -10];
    const freezeT = parseFloat(new URLSearchParams(location.search).get('t')); // debug: ?t=1.2 holds a frame

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(innerWidth * dpr);
      canvas.height = Math.round(innerHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    addEventListener('resize', resize);
    resize();

    addEventListener('pointermove', ev => {
      const h = innerHeight;
      mouse[0] = ev.clientX / h;
      mouse[1] = ev.clientY / h;
      if (lastX !== null) windTarget = Math.max(-0.05, Math.min(0.05, windTarget + (ev.clientX - lastX) * 0.0004));
      lastX = ev.clientX;
      lastMove = performance.now();
    }, { passive: true });

    const tex = gl.createTexture();
    const src = new Image();
    src.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      try {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
      } catch (err) {
        console.warn('flame-bloom:', err);
        return fail();
      }
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.uniform1i(U.uTex, 0);
      gl.uniform2f(U.uCut, CUT_W / IMG_H, CUT_H / IMG_H);
      gl.uniform1f(U.uStill, still);
      start = performance.now();
      document.documentElement.classList.add('flame-ready');
      requestAnimationFrame(frame);
    };
    src.onerror = fail;
    if (location.protocol === 'file:') {
      // browsers block WebGL from reading local files, so load the cutout as an inline data URL
      const s = document.createElement('script');
      s.src = canvas.dataset.src.replace(/\.webp$/, '.js');
      s.onload = () => { src.src = window.NUJABES_CUTOUT; };
      s.onerror = fail;
      document.head.appendChild(s);
    } else {
      src.src = canvas.dataset.src;
    }

    function frame(now) {
      if (now - lastMove > 120) windTarget *= 0.96;
      wind += (windTarget - wind) * 0.04;
      // displayed artwork matches the old <img>: full viewport height, left-aligned
      gl.uniform2f(U.uRes, canvas.width, canvas.height);
      gl.uniform1f(U.uImgH, canvas.height);
      gl.uniform1f(U.uT, isNaN(freezeT) ? (now - start) / 1000 : freezeT);
      gl.uniform1f(U.uWind, wind);
      gl.uniform2f(U.uMouse, mouse[0], mouse[1]);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!still || (now - start) < 100) requestAnimationFrame(frame);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
