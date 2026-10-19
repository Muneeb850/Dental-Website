/* Lightweight scroll progress for the pinned / parallax sections.
   Section positions are cached and only re-measured when the page size changes,
   so scrolling itself never forces a layout. */
(() => {
  const items = [];
  let vh = window.innerHeight;
  const clamp = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

  function measure(it) {
    const r = it.el.getBoundingClientRect();
    it.top = r.top + window.scrollY;
    it.h = it.el.offsetHeight;
  }
  function cache() { vh = window.innerHeight; items.forEach(measure); }
  function update() {
    const y = window.scrollY;
    items.forEach((it) => {
      // 'pin': 0 when the section's top hits the viewport top, 1 when its bottom hits the viewport bottom
      // 'cross': 0 when the section enters at the bottom, 1 when it leaves at the top
      const p = clamp(it.mode === 'cross' ? (y + vh - it.top) / (it.h + vh) : (y - it.top) / Math.max(1, it.h - vh));
      if (p !== it.p) { it.p = p; it.cb(p); }
    });
  }
  const refresh = () => { cache(); items.forEach((it) => { it.p = -1; }); update(); };

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', refresh, { passive: true });
  window.addEventListener('load', refresh);
  if ('ResizeObserver' in window) new ResizeObserver(refresh).observe(document.body);

  window.scrollProgress = (el, cb, mode = 'pin') => {
    if (!el) return;
    const it = { el, cb, mode, p: -1 };
    measure(it);
    items.push(it);
    update();
  };
})();
