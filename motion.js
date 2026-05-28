/* Motion module: Lenis smooth scroll + cursor-follow dot + magnetic links.
   Skips on touch devices and when the user prefers reduced motion. */
(function () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touch   = window.matchMedia('(pointer: coarse)').matches;

  /* ---------------------------------------------------------- *
   *  1) Lenis smooth scroll                                    *
   * ---------------------------------------------------------- */
  let lenis = null;
  if (!reduced && window.Lenis) {
    lenis = new window.Lenis({
      duration: 1.0,
      easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    const raf = time => { lenis.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);

    // Intercept same-page hash links so they smooth-scroll via Lenis
    const currentFile = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('a[href*="#"]').forEach(a => {
      const href = a.getAttribute('href');
      const hashIdx = href.indexOf('#');
      if (hashIdx === -1) return;
      const path = href.slice(0, hashIdx);
      const hash = href.slice(hashIdx);
      if (hash.length < 2) return;
      // Only intercept anchors that target the current page
      if (path && path !== currentFile) return;
      a.addEventListener('click', e => {
        const target = document.querySelector(hash);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -16 });
      });
    });

    // Page loaded with a hash → scroll to it via Lenis after layout settles
    if (window.location.hash) {
      setTimeout(() => {
        const target = document.querySelector(window.location.hash);
        if (target) lenis.scrollTo(target, { duration: 1.2, offset: -16 });
      }, 60);
    }
  }

  /* ---------------------------------------------------------- *
   *  2) Cursor-follow accent dot                               *
   * ---------------------------------------------------------- */
  if (!touch && !reduced) {
    const dot = document.createElement('div');
    dot.setAttribute('aria-hidden', 'true');
    dot.style.cssText = [
      'position:fixed',
      'width:10px', 'height:10px',
      'border-radius:50%',
      'background:var(--accent)',
      'pointer-events:none',
      'z-index:9999',
      'margin-left:-5px', 'margin-top:-5px',
      'left:0', 'top:0',
      'will-change:transform,width,height',
      'opacity:0',
      'transition:opacity .2s ease, width .25s ease, height .25s ease, margin .25s ease, background-color .2s ease',
    ].join(';');
    document.body.appendChild(dot);

    let mx = -100, my = -100, dx = -100, dy = -100, active = false;

    const setSize = (size) => {
      dot.style.width  = size + 'px';
      dot.style.height = size + 'px';
      dot.style.marginLeft = (-size / 2) + 'px';
      dot.style.marginTop  = (-size / 2) + 'px';
    };

    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      if (!active) { dx = mx; dy = my; active = true; dot.style.opacity = '0.65'; }
    });
    document.addEventListener('mouseleave', () => { active = false; dot.style.opacity = '0'; });
    document.addEventListener('mouseenter', () => { if (!active) { active = true; dot.style.opacity = '0.65'; } });

    // Grow + soften when hovering links/buttons
    document.addEventListener('mouseover', e => {
      if (e.target.closest('a, button, [role="button"], .def')) {
        setSize(28);
        dot.style.opacity = '0.25';
      }
    });
    document.addEventListener('mouseout', e => {
      const from = e.target.closest('a, button, [role="button"], .def');
      const to   = e.relatedTarget && e.relatedTarget.closest('a, button, [role="button"], .def');
      if (from && !to) {
        setSize(10);
        dot.style.opacity = '0.65';
      }
    });

    const loop = () => {
      dx += (mx - dx) * 0.18;
      dy += (my - dy) * 0.18;
      dot.style.transform = `translate(${dx}px, ${dy}px)`;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  /* ---------------------------------------------------------- *
   *  3) Magnetic links (elements with [data-magnetic])         *
   * ---------------------------------------------------------- */
  if (!touch && !reduced) {
    const STRENGTH = 0.28;
    document.querySelectorAll('[data-magnetic]').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width  / 2;
        const y = e.clientY - r.top  - r.height / 2;
        el.style.transform = `translate(${x * STRENGTH}px, ${y * STRENGTH}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }
})();
