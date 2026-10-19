/* Extras for the dedicated pages: counters, service filter, open-now, lightbox */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* warm up photos while the page is idle, so they are decoded before they scroll into view
     (decoding a large photo mid-scroll is what caused the first-visit stutter) */
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 200));
  window.addEventListener('load', () => {
    const queue = [...document.querySelectorAll('img[loading="lazy"]')];
    const next = () => {
      const img = queue.shift();
      if (!img) return;
      img.loading = 'eager';
      (img.decode ? img.decode() : Promise.resolve()).catch(() => {}).then(() => idle(next));
    };
    idle(next);
  });

  /* count-up numbers */
  const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const counters = [...document.querySelectorAll('[data-count]')];
  if (counters.length) {
    const run = (el) => {
      const to = +el.dataset.count, suf = el.dataset.suffix || '';
      if (reduce) { el.textContent = fmt(to) + suf; return; }
      const t0 = performance.now(), dur = 1600;
      (function step(t) {
        const u = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - u, 3);
        el.textContent = fmt(Math.round(to * e)) + suf;
        if (u < 1) requestAnimationFrame(step);
        else el.classList.add('is-done');
      })(t0);
    };
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { run(e.target); io.unobserve(e.target); }
    }), { threshold: 0.6 });
    counters.forEach((c) => io.observe(c));
  }

  /* service filter: matching items slide out, then the new set slides in one by one */
  const chips = [...document.querySelectorAll('.chip')];
  let filterTimer = 0;
  chips.forEach((chip) => chip.addEventListener('click', () => {
    if (chip.classList.contains('is-on')) return;
    chips.forEach((c) => c.classList.toggle('is-on', c === chip));
    const svcs = [...document.querySelectorAll('.svc')];
    const keep = (li) => chip.dataset.f === 'all' || li.dataset.cat === chip.dataset.f;
    const apply = () => {
      let k = 0;
      svcs.forEach((li) => {
        li.classList.remove('is-leaving', 'is-entering');
        li.hidden = !keep(li);
        if (!li.hidden && !reduce) { li.style.setProperty('--k', `${k++ * 70}ms`); void li.offsetWidth; li.classList.add('is-entering'); }
      });
    };
    clearTimeout(filterTimer);
    if (reduce) { apply(); return; }
    svcs.forEach((li) => { if (!li.hidden) li.classList.add('is-leaving'); });
    filterTimer = setTimeout(apply, 320);
  }));

  /* FAQ: animate the height open and closed */
  document.querySelectorAll('.faq__i').forEach((d) => {
    const sum = d.querySelector('summary');
    sum.addEventListener('click', (e) => {
      if (reduce) return;
      e.preventDefault();
      if (d.dataset.busy) return;
      d.dataset.busy = '1';
      const start = d.offsetHeight;
      const opening = !d.open;
      if (opening) d.open = true; else d.classList.add('is-closing');
      const end = opening ? d.scrollHeight : sum.offsetHeight;
      d.animate([{ height: start + 'px' }, { height: end + 'px' }], { duration: 480, easing: 'cubic-bezier(.22,1,.36,1)' })
        .onfinish = () => { if (!opening) d.open = false; d.classList.remove('is-closing'); delete d.dataset.busy; };
    });
  });

  /* team: gentle 3D tilt toward the pointer */
  if (!reduce && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.member').forEach((m) => {
      m.addEventListener('pointermove', (ev) => {
        const r = m.getBoundingClientRect();
        const x = (ev.clientX - r.left) / r.width - 0.5, y = (ev.clientY - r.top) / r.height - 0.5;
        m.style.transform = `perspective(900px) rotateX(${(-y * 6).toFixed(2)}deg) rotateY(${(x * 8).toFixed(2)}deg) translateY(-6px)`;
      });
      m.addEventListener('pointerleave', () => { m.style.transform = ''; });
    });
  }

  /* open now: Mon–Fri 9–18, Sat 10–14 */
  const H = { 0: null, 1: [9, 18], 2: [9, 18], 3: [9, 18], 4: [9, 18], 5: [9, 18], 6: [10, 14] };
  const now = new Date(), day = now.getDay(), hr = now.getHours() + now.getMinutes() / 60;
  const today = H[day], isOpen = !!today && hr >= today[0] && hr < today[1];
  const label = isOpen ? `Open now · until ${today[1]}:00` : 'Closed right now';
  document.querySelectorAll('[data-open-now]').forEach((el) => {
    el.classList.toggle('is-open', isOpen);
    el.querySelector('span').textContent = label;
  });
  document.querySelectorAll('.hours tr').forEach((tr) => tr.classList.toggle('is-today', +tr.dataset.day === day));

  /* gallery lightbox (clinic page only) */
  const panels = [...document.querySelectorAll('.panel')];
  if (panels.length) {
    const lb = document.createElement('div');
    lb.className = 'lb'; lb.hidden = true;
    lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Photo viewer');
    lb.innerHTML = '<button class="lb__x" aria-label="Close">×</button><button class="lb__n lb__n--p" aria-label="Previous">‹</button><figure><img alt=""><figcaption></figcaption></figure><button class="lb__n lb__n--n" aria-label="Next">›</button>';
    document.body.appendChild(lb);
    const img = lb.querySelector('img'), cap = lb.querySelector('figcaption');
    let i = 0, opener = null, swapT = 0, closeT = 0;
    const fill = () => {
      const p = panels[i].querySelector('img');
      img.src = p.src; img.alt = p.alt;
      cap.textContent = panels[i].querySelector('figcaption b').textContent + ' — ' + panels[i].querySelector('figcaption em').textContent;
    };
    const show = (k, instant) => {
      i = (k + panels.length) % panels.length;
      clearTimeout(swapT);
      if (instant || reduce) { fill(); img.classList.remove('is-swap'); return; }
      img.classList.add('is-swap');
      swapT = setTimeout(() => { fill(); img.classList.remove('is-swap'); }, 220);
    };
    const close = () => {
      lb.classList.remove('is-open'); document.body.style.overflow = '';
      clearTimeout(closeT); closeT = setTimeout(() => { lb.hidden = true; }, reduce ? 0 : 450);
      if (opener) opener.focus();
    };
    panels.forEach((p, k) => {
      p.tabIndex = 0; p.style.cursor = 'zoom-in';
      const open = () => {
        opener = p; show(k, true); clearTimeout(closeT); lb.hidden = false; document.body.style.overflow = 'hidden';
        requestAnimationFrame(() => requestAnimationFrame(() => lb.classList.add('is-open')));
        lb.querySelector('.lb__x').focus();
      };
      p.addEventListener('click', open);
      p.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    });
    lb.addEventListener('click', (e) => { if (e.target === lb || e.target.closest('.lb__x')) close(); });
    lb.querySelector('.lb__n--p').addEventListener('click', () => show(i - 1));
    lb.querySelector('.lb__n--n').addEventListener('click', () => show(i + 1));
    document.addEventListener('keydown', (e) => {
      if (lb.hidden) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') show(i - 1);
      else if (e.key === 'ArrowRight') show(i + 1);
    });
    // swipe between photos on touch screens
    let sx = 0, sy = 0;
    lb.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    lb.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(i + (dx < 0 ? 1 : -1));
      else if (dy > 90) close();
    }, { passive: true });
  }

  /* ---------- Phones ---------- */
  const phone = window.matchMedia('(max-width: 820px)');

  /* swipe carousels: dot indicators + a one-time nudge hint */
  document.querySelectorAll('.team, .values__grid, .flow, .visit__cards, .tiles__grid').forEach((row) => {
    const items = [...row.children];
    if (items.length < 2) return;
    const dots = document.createElement('div');
    dots.className = 'cdots'; dots.setAttribute('aria-hidden', 'true');
    dots.innerHTML = items.map(() => '<i></i>').join('');
    row.after(dots);
    const ds = [...dots.children];
    const update = () => {
      const x = row.scrollLeft, max = row.scrollWidth - row.clientWidth;
      const k = max <= 0 ? 0 : Math.round((x / max) * (items.length - 1));
      ds.forEach((d, j) => d.classList.toggle('is-on', j === k));
    };
    let t = 0;
    row.addEventListener('scroll', () => { cancelAnimationFrame(t); t = requestAnimationFrame(update); }, { passive: true });
    update();
    if (!reduce) {
      const io = new IntersectionObserver((es) => es.forEach((e) => {
        if (e.isIntersecting && phone.matches) {
          row.classList.add('is-hint'); io.disconnect();
          row.addEventListener('touchstart', () => row.classList.remove('is-hint'), { once: true, passive: true });
        }
      }), { threshold: 0.6 });
      io.observe(row);
    }
  });

  /* sticky Call / Book bar (home page only): shows after the first screen, hides near the booking form and footer */
  const onHome = !!document.querySelector('.hero');
  if (!onHome) return;
  const bar = document.createElement('nav');
  bar.className = 'mbar'; bar.setAttribute('aria-label', 'Quick actions');
  bar.innerHTML = '<a class="mbar__call" href="tel:+10000000000"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg><span>Call</span></a>'
    + '<a class="mbar__book" href="#contact">Book a visit</a>';
  document.body.appendChild(bar);
  const blockers = [...document.querySelectorAll('#booking, .foot')];
  const seen = new Set();
  const barIO = new IntersectionObserver((es) => {
    es.forEach((e) => (e.isIntersecting ? seen.add(e.target) : seen.delete(e.target)));
    barState();
  });
  blockers.forEach((b) => barIO.observe(b));
  function barState() {
    bar.classList.toggle('is-on', phone.matches && window.scrollY > window.innerHeight * 0.6 && seen.size === 0);
  }
  window.addEventListener('scroll', barState, { passive: true });
  phone.addEventListener('change', barState);
})();
