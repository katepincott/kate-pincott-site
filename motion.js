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

  /* ---------------------------------------------------------- *
   *  4) Auto-mark the current nav tab                          *
   * ---------------------------------------------------------- *
   * Walks every <a> in nav.top, compares its href's file part  *
   * to the current page's file part, and adds .current to the  *
   * match. No per-page hardcoding needed — add a new nav item  *
   * or new page and it just works.                              */
  (function(){
    const currentFile = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
    document.querySelectorAll('nav.top a').forEach(a => {
      const href = a.getAttribute('href');
      if (!href) return;
      // Skip anchor-only links, mailto/tel, and external URLs
      if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || /^[a-z]+:\/\//i.test(href)) return;
      // Extract just the file part (drop any #hash)
      const file = href.split('#')[0].toLowerCase();
      if (!file) return;
      if (file === currentFile) a.classList.add('current');
    });
  })();

  /* ---------------------------------------------------------- *
   *  5) Hero h1 split-text reveal + per-word weight hover      *
   * ---------------------------------------------------------- */
  (function(){
    // Inject CSS once — every page benefits from the same h1-word styling
    const style = document.createElement('style');
    style.textContent = `
      .hero h1 .h1-word, .speaking-hero h1 .h1-word{
        display:inline-block;
        opacity:0;
        transform:translateY(0.4em);
        animation:h1-word-in .7s cubic-bezier(.2,.7,.2,1) forwards;
        will-change:opacity,transform;
        transition:font-weight .3s ease;
      }
      @keyframes h1-word-in{to{opacity:1;transform:translateY(0)}}
      .hero h1 .h1-word:not(em):hover,
      .speaking-hero h1 .h1-word:not(em):hover{font-weight:600}
      @media (prefers-reduced-motion: reduce){
        .hero h1 .h1-word, .speaking-hero h1 .h1-word{animation:none;opacity:1;transform:none}
      }
    `;
    document.head.appendChild(style);

    const h1 = document.querySelector('.hero h1, .speaking-hero h1');
    if (!h1) return;
    if (h1.querySelector('.h1-word')) return; // already split (e.g., page-inline JS already ran)

    // Tokenize the h1's direct children, preserving inline elements (like em.cycle on home)
    const tokens = [];
    for (const node of [...h1.childNodes]){
      if (node.nodeType === Node.TEXT_NODE){
        node.textContent.split(/(\s+)/).forEach(part => {
          if (part.trim())      tokens.push({kind:'word', text:part});
          else if (part)        tokens.push({kind:'space', text:part});
        });
      } else if (node.nodeType === Node.ELEMENT_NODE){
        tokens.push({kind:'el', el:node});
      }
    }

    h1.innerHTML = '';
    let i = 0;
    tokens.forEach(t => {
      if (t.kind === 'word'){
        const s = document.createElement('span');
        s.className = 'h1-word';
        s.style.animationDelay = (i * 70 + 200) + 'ms';
        s.textContent = t.text;
        h1.appendChild(s);
        i++;
      } else if (t.kind === 'space'){
        h1.appendChild(document.createTextNode(t.text));
      } else if (t.kind === 'el'){
        t.el.classList.add('h1-word');
        t.el.style.animationDelay = (i * 70 + 200) + 'ms';
        h1.appendChild(t.el);
        i++;
      }
    });
  })();
})();

/* ------------------------------------------------------------ *
 *  Mobile nav menu (runs on all devices, incl. touch/reduced)  *
 * ------------------------------------------------------------ */
(function () {
  const toggle = document.querySelector('.nav-toggle');
  const menu   = document.getElementById('nav-menu');
  if (!toggle || !menu) return;

  const backdrop = document.createElement('div');
  backdrop.className = 'nav-backdrop';
  backdrop.setAttribute('aria-hidden', 'true');
  document.body.appendChild(backdrop);

  const isOpen = () => menu.classList.contains('open');

  const open = () => {
    menu.classList.add('open');
    backdrop.classList.add('open');
    document.body.classList.add('nav-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close menu');
  };
  const close = () => {
    menu.classList.remove('open');
    backdrop.classList.remove('open');
    document.body.classList.remove('nav-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
  };

  toggle.addEventListener('click', () => { isOpen() ? close() : open(); });
  backdrop.addEventListener('click', close);
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isOpen()) close();
  });
  // Snap back to the inline desktop nav if the viewport grows past the breakpoint
  window.addEventListener('resize', () => {
    if (window.innerWidth > 720 && isOpen()) close();
  });
})();

/* ------------------------------------------------------------ *
 *  Mobile nav menu (runs on all devices, incl. touch/reduced)  *
 * ------------------------------------------------------------ */
(function () {
  const toggle = document.querySelector('.nav-toggle');
  const menu   = document.getElementById('nav-menu');
  if (!toggle || !menu) return;

  const backdrop = document.createElement('div');
  backdrop.className = 'nav-backdrop';
  backdrop.setAttribute('aria-hidden', 'true');
  document.body.appendChild(backdrop);

  const isOpen = () => menu.classList.contains('open');

  const open = () => {
    menu.classList.add('open');
    backdrop.classList.add('open');
    document.body.classList.add('nav-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close menu');
  };
  const close = () => {
    menu.classList.remove('open');
    backdrop.classList.remove('open');
    document.body.classList.remove('nav-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
  };

  toggle.addEventListener('click', () => { isOpen() ? close() : open(); });
  backdrop.addEventListener('click', close);
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isOpen()) close();
  });
  // Snap back to the inline desktop nav if the viewport grows past the breakpoint
  window.addEventListener('resize', () => {
    if (window.innerWidth > 720 && isOpen()) close();
  });
})();
