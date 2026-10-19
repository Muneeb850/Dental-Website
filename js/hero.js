(() => {
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (id) => document.getElementById(id);

  const hero = document.querySelector('.hero');
  const scrollInd = $('scroll-ind') || document.createElement('i');
  const nav = $('nav');
  const navToggle = $('nav-toggle');

  /* ---------- Nav ---------- */
  navToggle.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  document.querySelectorAll('.nav__links a').forEach((a) =>
    a.addEventListener('click', () => {
      nav.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', false);
      document.body.style.overflow = '';
    }));

  requestAnimationFrame(() => root.classList.add('is-ready'));

  /* ---------- Magnetic buttons ---------- */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('[data-magnetic]').forEach((el) => {
      el.addEventListener('pointermove', (ev) => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate3d(${(ev.clientX - (r.left + r.width / 2)) * 0.18}px,${(ev.clientY - (r.top + r.height / 2)) * 0.28}px,0) scale(1.03)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- Scroll: hide the cue, solid nav ---------- */
  const forceSolid = nav.hasAttribute('data-solid');
  let cueGone = false, solid = null, vh = window.innerHeight;
  window.addEventListener('resize', () => { vh = window.innerHeight; }, { passive: true });
  function onScroll() {
    const y = window.scrollY;
    if (!cueGone && y > 40) {
      cueGone = true;
      scrollInd.style.animation = 'none'; scrollInd.style.transition = 'opacity .5s'; scrollInd.style.opacity = 0;
    }
    const s = forceSolid || y > vh * 0.8;
    if (s !== solid) { solid = s; nav.classList.toggle('is-solid', s); }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
