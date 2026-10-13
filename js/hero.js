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
  function onScroll() {
    const y = window.scrollY;
    scrollInd.style.opacity = y > 40 ? 0 : '';
    if (y > 40) { scrollInd.style.animation = 'none'; scrollInd.style.transition = 'opacity .5s'; }
    nav.classList.toggle('is-solid', nav.hasAttribute('data-solid') || y > window.innerHeight * 0.8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
