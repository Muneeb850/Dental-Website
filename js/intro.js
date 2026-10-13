(() => {
  const section = document.getElementById('about');
  if (!section) return;
  const stage = section.querySelector('.intro__stage');
  const bg = section.querySelector('.intro__bg');
  const heading = section.querySelector('.intro__heading');
  const scene = section.querySelector('.scene');
  const tooth = section.querySelector('.tooth');
  const cards = [...section.querySelectorAll('.card')];
  const dots = [...section.querySelectorAll('.intro__dots b')];
  const count = document.getElementById('intro-count');
  const hint = section.querySelector('.intro__hint');
  const progressUI = section.querySelector('.intro__progress');
  const veil = section.querySelector('.intro__veil');
  const N = cards.length;

  /* split heading into word/char spans (screen readers keep the aria-label) */
  let ci = 0;
  section.querySelectorAll('.intro__title .row').forEach((row) => {
    const words = row.textContent.trim().split(/\s+/);
    row.textContent = '';
    row.setAttribute('aria-hidden', 'true');
    words.forEach((w, wi) => {
      const ws = document.createElement('span'); ws.className = 'w';
      [...w].forEach((ch) => {
        const c = document.createElement('span'); c.className = 'c'; c.textContent = ch;
        c.style.setProperty('--i', ci++); ws.appendChild(c);
      });
      row.appendChild(ws);
      if (wi < words.length - 1) row.appendChild(document.createTextNode(' '));
    });
  });

  /* entry reveal (one-time, when the chapter approaches) */
  new IntersectionObserver((es, o) => {
    if (es.some((e) => e.isIntersecting)) { section.classList.add('in-view'); o.disconnect(); }
  }, { rootMargin: '0px 0px -25% 0px' }).observe(section);

  if (document.documentElement.classList.contains('reduced') ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('reduced');
    section.classList.add('in-view');
    return;
  }

  /* ---------- Pose table: d = cardIndex - t ---------- */
  // [d, x (fraction of stage width), y (vh), z (px), rotY, rotX, scale, opacity, blur(px)]
  const DESK = [
    [-2, -0.60,  14, -520,  42, 0, .58, 0,   9],
    [-1, -0.43,  10, -320,  32, 2, .72, .38, 4],
    [ 0, -0.23,   5,  140,   7, 0, 1,   1,   0],
    [ 1,  0.31, -15, -260, -28, 2, .74, .5,  3],
    [ 2,  0.45,  17, -420, -38, 0, .62, .26, 6],
    [ 3,  0.58,   0, -580, -44, 0, .5,  0,   9],
  ];
  const MOBI = [
    [-2,  0.00, -44, -420,  0, 22, .62, 0,   8],
    [-1, -0.04, -30, -260,  0, 14, .8,  .3,  3],
    [ 0,  0.00,  28,   60,  0,  0, 1,   1,   0],
    [ 1,  0.05,  47, -200,  0, -8, .9,  .45, 3],
    [ 2,  0.08,  60, -380,  0,-14, .8,  0,   6],
    [ 3,  0.10,  70, -520,  0,-18, .7,  0,   8],
  ];
  const mqMobile = window.matchMedia('(max-width: 820px)');
  const mqTablet = window.matchMedia('(max-width: 1100px)');

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = (t) => t * t * (3 - 2 * t);
  const mix = (a, b, u) => a + (b - a) * u;

  function pose(d, table) {
    d = clamp(d, -2, 3 - 1e-6);
    const k = Math.floor(d);
    const a = table[k + 2], b = table[k + 3];
    const u = smooth(d - k);
    return a.map((v, i) => (i === 0 ? d : mix(v, b[i], u)));
  }

  /* ---------- Timeline ---------- */
  const INTRO_END = 0.12, CARDS_END = 0.86, OUTRO_START = 0.93;
  let target = 0, shown = 0, ticking = false;
  let lastActive = -2, lastShown = -1, forceRender = true;
  let W = window.innerWidth, H = window.innerHeight;

  function cardsT(p) {
    // plateau easing: each card holds ~60% of its slot, then glides
    const f = clamp((p - INTRO_END) / (CARDS_END - INTRO_END)) * (N - 1);
    const k = Math.min(Math.floor(f), N - 2);
    const fr = f - k;
    return k + smooth(clamp((fr - 0.3) / 0.4));
  }

  function render() {
    ticking = false;
    shown += (target - shown) * 0.18;
    if (Math.abs(target - shown) < 0.0003) shown = target;
    if (shown === lastShown && !forceRender) return;
    lastShown = shown; forceRender = false;
    const p = shown;

    const mobile = mqMobile.matches, tablet = mqTablet.matches;
    const table = mobile ? MOBI : DESK;
    const intro = smooth(clamp(p / INTRO_END));
    const t = -1 + intro + cardsT(p);
    const out = smooth(clamp((p - OUTRO_START) / (1 - OUTRO_START)));

    /* cards */
    let active = -1;
    cards.forEach((el, i) => {
      const d = i - t;
      const [, x, y, z, ry, rx, s, o, bl] = pose(d, table);
      const xs = x * W * (tablet && !mobile ? 0.82 : 1);
      const vis = o * (tablet && !mobile && Math.abs(d) > 1.5 ? 0 : 1) * (1 - out);
      const tilt = (i % 2 ? 1 : -1) * 1.6 * (1 - Math.abs(clamp(d, -1, 1)));
      el.style.transform =
        `translate(-50%,-50%) translate3d(${xs.toFixed(1)}px,${(y * H / 100).toFixed(1)}px,${z.toFixed(1)}px) ` +
        `rotateY(${ry.toFixed(2)}deg) rotateX(${rx.toFixed(2)}deg) rotateZ(${tilt.toFixed(2)}deg) scale(${s.toFixed(3)})`;
      el.style.opacity = vis.toFixed(3);
      el.style.filter = bl > 0.05 ? `blur(${bl.toFixed(2)}px)` : 'none';
      el.style.zIndex = Math.round(10 + z / 10);
      el.style.visibility = vis < 0.01 ? 'hidden' : 'visible';
      if (Math.abs(d) < 0.5) active = i;
    });
    if (active !== lastActive) {
      cards.forEach((el, i) => el.classList.toggle('is-active', i === active));
      lastActive = active;
    }

    /* camera: push-in, drift, perspective shift across the story */
    const prog = clamp((t + 1) / N);
    const drift = (prog - 0.5) * (mobile ? 0 : 2.4);
    scene.style.transform = `translate3d(${(-drift * 8).toFixed(1)}px,0,${(prog * 70).toFixed(1)}px) rotateY(${drift.toFixed(2)}deg)`;

    /* tooth: stable anchor, light parallax; recedes in the outro */
    const ty = mix(10, -10, prog) + out * 30;
    const ts = (1 + prog * 0.06) * (1 - out * 0.28);
    tooth.style.transform =
      `translate3d(0,${ty.toFixed(1)}px,${(-out * 260).toFixed(1)}px) rotateY(${((prog - .5) * -4).toFixed(2)}deg) scale(${ts.toFixed(4)})`;
    tooth.style.opacity = (1 - out * 0.45).toFixed(3);

    /* background parallax (slowest layer) */
    bg.style.transform = `translate3d(0,${(-prog * 36 + out * 20).toFixed(1)}px,0) scale(${(1 + prog * 0.05 + out * 0.08).toFixed(3)})`;

    /* heading hands over to the cards */
    const hOut = smooth(clamp((p - 0.04) / 0.1));
    heading.style.opacity = (1 - hOut).toFixed(3);
    heading.style.transform = `translate3d(0,${(-hOut * 40).toFixed(1)}px,0)`;
    heading.style.filter = hOut > 0.02 ? `blur(${(hOut * 8).toFixed(1)}px)` : 'none';

    /* progress */
    const idx = clamp(Math.round(t), 0, N - 1);
    const label = `${String(idx + 1).padStart(2, '0')} / ${String(N).padStart(2, '0')}`;
    if (count.textContent !== label) count.textContent = label;
    dots.forEach((b, i) => { b.style.transform = `scaleX(${clamp(t - i + 1).toFixed(3)})`; });
    hint.style.opacity = (1 - clamp(p / 0.1)).toFixed(3);
    progressUI.style.opacity = (clamp(p / 0.03) * (1 - out)).toFixed(3);

    /* dissolve into next chapter */
    veil.style.opacity = (out * 0.25).toFixed(3);

    if (shown !== target) request();
  }
  function request() { if (!ticking) { ticking = true; requestAnimationFrame(render); } }

  function measure() {
    const rect = section.getBoundingClientRect();
    target = clamp(-rect.top / (section.offsetHeight - window.innerHeight));
    request();
  }
  window.addEventListener('resize', () => { W = window.innerWidth; H = window.innerHeight; forceRender = true; measure(); });

  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.create({
      trigger: section, start: 'top top', end: 'bottom bottom',
      onUpdate: (self) => { target = self.progress; request(); },
      onRefresh: (self) => { target = self.progress; request(); },
    });
  } else {
    window.addEventListener('scroll', measure, { passive: true });
  }
  measure();
})();
