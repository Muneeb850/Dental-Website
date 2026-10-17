(() => {
  const root = document.documentElement;
  const reduce = root.classList.contains('reduced') || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) root.classList.add('reduced');
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  /* ---------- Scroll reveals (staggered within a group) ---------- */
  const rev = [...document.querySelectorAll('[data-reveal]')];
  rev.forEach((el) => {
    const sibs = [...el.parentElement.children].filter((c) => c.hasAttribute('data-reveal'));
    el.style.setProperty('--d', `${Math.min(sibs.indexOf(el), 6) * 90}ms`);
  });
  if (reduce) rev.forEach((el) => el.classList.add('is-in'));
  else {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -12% 0px', threshold: 0.05 });
    rev.forEach((el) => io.observe(el));
  }

  /* ---------- Services: hover / focus swaps the preview ---------- */
  const svcs = [...document.querySelectorAll('.svc')];
  const pics = [...document.querySelectorAll('.svcs__frame img')];
  function setSvc(el) {
    svcs.forEach((s) => s.classList.toggle('is-on', s === el));
    pics.forEach((p) => p.classList.toggle('is-on', p.dataset.k === el.dataset.img));
  }
  svcs.forEach((s) => {
    s.addEventListener('mouseenter', () => setSvc(s));
    s.addEventListener('focus', () => setSvc(s));
    s.addEventListener('click', () => setSvc(s));
  });
  if (svcs[0]) svcs[0].classList.add('is-on');
  // on touch / narrow screens, highlight the row nearest the viewport centre
  if (!window.matchMedia('(hover: hover)').matches && svcs.length) {
    const io2 = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) setSvc(e.target); }),
      { rootMargin: '-45% 0px -45% 0px' });
    svcs.forEach((s) => io2.observe(s));
  }

  /* ---------- Technology: hotspots <-> list ---------- */
  const spots = [...document.querySelectorAll('.spot')];
  const items = [...document.querySelectorAll('.tech__item')];
  function setTech(i) {
    spots.forEach((s, k) => s.classList.toggle('is-on', k === i));
    items.forEach((it, k) => {
      it.classList.toggle('is-on', k === i);
      it.querySelector('button').setAttribute('aria-expanded', k === i);
    });
  }
  spots.forEach((s) => {
    const i = +s.dataset.i;
    s.addEventListener('click', () => setTech(i));
    s.addEventListener('mouseenter', () => setTech(i));
    s.addEventListener('focus', () => setTech(i));
  });
  items.forEach((it) => it.querySelector('button').addEventListener('click', () => setTech(+it.dataset.i)));
  const techImg = document.querySelector('.tech__img');

  /* ---------- Clinic: pinned horizontal gallery ---------- */
  const gal = document.querySelector('.gallery');
  const track = document.getElementById('gallery-track');
  const count = document.getElementById('gallery-count');
  const fill = document.getElementById('gallery-fill');
  const gHead = document.querySelector('.gallery__head');
  const panels = track ? [...track.querySelectorAll('.panel')] : [];
  let gTarget = 0, gShown = 0, gTick = false, maxX = 0, gLast = -1, gForce = true;

  function measureGallery() {
    if (!track) return;
    maxX = Math.max(0, track.scrollWidth - window.innerWidth);
  }
  function renderGallery() {
    if (!track) return;
    gTick = false;
    gShown += (gTarget - gShown) * 0.14;
    if (Math.abs(gTarget - gShown) < 0.0004) gShown = gTarget;
    if (gShown === gLast && !gForce) return;
    gLast = gShown; gForce = false;
    const x = -gShown * maxX;
    track.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
    // slow parallax inside each frame
    const vw = window.innerWidth;
    panels.forEach((p) => {
      const r = p.offsetLeft + x;
      const c = (r + p.offsetWidth / 2 - vw / 2) / vw;       // -1..1 around centre
      p.firstElementChild.firstElementChild.style.transform = `translate3d(${(c * -6).toFixed(2)}%,0,0)`;
    });
    // active index = panel closest to the viewport's 40% line
    let best = 0, bd = 1e9;
    panels.forEach((p, i) => {
      const d = Math.abs(p.offsetLeft + x + p.offsetWidth / 2 - vw * 0.5);
      if (d < bd) { bd = d; best = i; }
    });
    count.textContent = `0${best + 1} / 0${panels.length}`;
    fill.style.transform = `scaleX(${gShown.toFixed(3)})`;
    const hf = clamp(gShown / 0.16);
    if (gHead) {
      gHead.style.opacity = (1 - hf).toFixed(3);
      gHead.style.transform = `translate3d(${(-hf * 40).toFixed(1)}px,0,0)`;
      gHead.style.visibility = hf >= 1 ? 'hidden' : 'visible';
    }
    if (gShown !== gTarget) { gTick = true; requestAnimationFrame(renderGallery); }
  }
  function reqGallery() { if (!gTick) { gTick = true; requestAnimationFrame(renderGallery); } }
  function measureG() {
    if (!gal) return;
    const r = gal.getBoundingClientRect();
    gTarget = clamp(-r.top / (gal.offsetHeight - window.innerHeight));
    reqGallery();
  }

  /* ---------- Technology parallax on scroll ---------- */
  function techParallax() {
    if (!techImg) return;
    const r = techImg.parentElement.getBoundingClientRect();
    const c = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
    techImg.style.transform = `translate3d(0,${(c * -4).toFixed(2)}%,0)`;
  }

  if (!reduce) {
    measureGallery();
    window.addEventListener('resize', () => { gForce = true; measureGallery(); measureG(); });
    window.addEventListener('load', () => { gForce = true; measureGallery(); measureG(); });
    if (window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      if (gal) ScrollTrigger.create({
        trigger: gal, start: 'top top', end: 'bottom bottom',
        onUpdate: (s) => { gTarget = s.progress; reqGallery(); },
        onRefresh: (s) => { measureGallery(); gTarget = s.progress; reqGallery(); },
      });
      if (techImg) ScrollTrigger.create({ trigger: '.tech', start: 'top bottom', end: 'bottom top', onUpdate: techParallax });
    } else {
      window.addEventListener('scroll', () => { measureG(); techParallax(); }, { passive: true });
    }
    measureG(); techParallax();
  }

  /* ---------- Booking form (front-end only) ---------- */
  const form = document.getElementById('booking');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let ok = true;
      form.querySelectorAll('input[required]').forEach((f) => {
        const bad = !f.value.trim() || (f.type === 'email' && !/^\S+@\S+\.\S+$/.test(f.value));
        f.classList.toggle('is-bad', bad);
        f.setAttribute('aria-invalid', bad);
        if (bad && ok) { f.focus(); ok = false; }
      });
      if (!ok) return;
      // TODO: send to your backend / booking provider here.
      form.querySelector('.form__ok').hidden = false;
      form.reset();
    });
    form.addEventListener('input', (e) => e.target.classList.remove('is-bad'));
  }
})();

/* nav adapts over dark sections */
(() => {
  const nav = document.getElementById('nav');
  const dark = new Set();
  const io = new IntersectionObserver((es) => {
    es.forEach((e) => (e.isIntersecting ? dark.add(e.target) : dark.delete(e.target)));
    nav.classList.toggle('nav--dark', dark.size > 0);
  }, { rootMargin: '0px 0px -94% 0px' });
  document.querySelectorAll('.sec--dark, .foot').forEach((s) => io.observe(s));
})();
