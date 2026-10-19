(() => {
  const section = document.getElementById('approach');
  if (!section) return;
  const reduce = document.documentElement.classList.contains('reduced') ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) { document.documentElement.classList.add('reduced'); return; }

  const stage = section.querySelector('.approach__stage');
  const steps = [...section.querySelectorAll('.step')];
  const frame = section.querySelector('.frame');
  const pics = [...section.querySelectorAll('img.ap')];
  const tagText = section.querySelector('.frame__tag span');
  const pgN = [...section.querySelectorAll('.pg__n')];
  const pgL = [...section.querySelectorAll('.pg__line i')];
  const veil = section.querySelector('.approach__veil');
  const N = steps.length;
  const names = ['Discover', 'Diagnose', 'Treat', 'Restore'];

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = (t) => t * t * (3 - 2 * t);
  const mix = (a, b, u) => a + (b - a) * u;
  const mqMobile = window.matchMedia('(max-width: 820px)');

  /* split headings into masked lines */
  const lines = steps.map((s) => {
    const h = s.querySelector('.step__title');
    const txt = h.textContent.trim();
    h.setAttribute('aria-label', txt);
    h.innerHTML = `<span class="m" aria-hidden="true"><span>${txt}</span></span>`;
    return h.querySelector('.m > span');
  });

  let target = 0, shown = 0, ticking = false, lastIdx = -1, lastShown = -1;

  function render() {
    ticking = false;
    shown += (target - shown) * 0.2;
    if (Math.abs(target - shown) < 0.0004) shown = target;
    if (shown === lastShown) return;
    lastShown = shown;
    const p = shown;
    const mobile = mqMobile.matches;
    const k = mobile ? 0.6 : 1;           // reduced intensity on phones
    const s = p * N;                       // 0..4, stage i active over [i, i+1)


    /* copy: scroll-linked crossfade, blur-to-sharp, vertical drift, masked headline */
    steps.forEach((el, i) => {
      const d = s - i - 0.5;                           // -0.5..0.5 while active
      const e = smooth(clamp((Math.abs(d) - 0.3) / 0.2)); // 0 = fully shown, 1 = hidden
      const dir = d < 0 ? 1 : -1;                      // upcoming rises, leaving lifts away
      const first = i === 0 && s < 0.5, last = i === N - 1 && s > N - 0.5;
      const ee = first || last ? 0 : e;                // hold the ends in place
      el.style.opacity = (1 - ee).toFixed(3);
      el.style.transform = `translate3d(0,${(dir * ee * 34 * k).toFixed(1)}px,0)`;
      el.style.filter = 'none';
      el.style.visibility = ee > 0.98 ? 'hidden' : 'visible';
      el.style.pointerEvents = ee < 0.5 ? 'auto' : 'none';
      lines[i].style.transform = `translate3d(0,${(dir * ee * 108).toFixed(1)}%,0)`;
      const num = el.querySelector('.step__num');
      num.style.transform = `translate3d(0,${(dir * ee * 22 * k).toFixed(1)}px,0)`;
      const desc = el.querySelector('.step__desc');
      const de = smooth(clamp((Math.abs(d) - 0.22) / 0.2));
      desc.style.opacity = (first || last ? 1 : 1 - de).toFixed(3);
      desc.style.transform = `translate3d(0,${(dir * de * 14).toFixed(1)}px,0)`;
    });

    /* media: soft push-in settle (1.03 -> 1.0 each stage), parallax, crop drift */
    const idx = clamp(Math.floor(s), 0, N - 1);
    const local = clamp(s - idx);
    const settle = 1.03 - 0.03 * smooth(clamp(local / 0.7));
    const entry = smooth(clamp(p / 0.04));              // frame rises in at the very start
    const exit = smooth(clamp((p - 0.97) / 0.03));
    frame.style.transform = `translate3d(0,${((1 - entry) * 36 + exit * -18).toFixed(1)}px,0) rotateX(${((1 - entry) * 2).toFixed(2)}deg)`;
    frame.style.opacity = (0.35 + 0.65 * entry).toFixed(3);
    /* stills: each stage's image fades in over the last, easing from 1.05 to 1.0 */
    pics.forEach((im, i) => {
      const inn = i === 0 ? 1 : smooth(clamp((s - i + 0.2) / 0.4));
      const t = clamp((s - i + 0.4) / 1.6);
      const sc = 1.05 - 0.05 * smooth(t);
      im.style.opacity = inn.toFixed(3);
      im.style.transform = `translate3d(0,${((0.5 - p) * 24 * k).toFixed(1)}px,0) scale(${(sc * 1.02).toFixed(4)})`;
    });

    /* tag crossfade */
    if (idx !== lastIdx) {
      lastIdx = idx;
      tagText.style.opacity = 0; tagText.style.transform = 'translateY(6px)';
      setTimeout(() => {
        tagText.textContent = `0${idx + 1} — ${names[idx]}`;
        tagText.style.transition = 'opacity .7s cubic-bezier(.22,1,.36,1), transform .7s cubic-bezier(.22,1,.36,1)';
        tagText.style.opacity = 1; tagText.style.transform = 'none';
      }, 260);
      pgN.forEach((n, i) => n.classList.toggle('is-on', i === idx));
    }
    pgL.forEach((l, i) => { l.style.transform = `scaleX(${clamp(s - i - 0.5, 0, 1).toFixed(3)})`; });

    /* hand-off to the next section */
    veil.style.opacity = (exit * 0.2).toFixed(3);

    if (shown !== target) request();
  }
  function request() { if (!ticking) { ticking = true; requestAnimationFrame(render); } }

  function measure() {
    const r = section.getBoundingClientRect();
    target = clamp(-r.top / (section.offsetHeight - window.innerHeight));
    request();
  }
  window.addEventListener('resize', measure);

  // cached scroll progress (js/scroll.js) — no layout reads while scrolling
  if (window.scrollProgress) window.scrollProgress(section, (p) => { target = p; request(); });
  else { window.addEventListener('scroll', measure, { passive: true }); measure(); }
})();
