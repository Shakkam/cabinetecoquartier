/* ================================================
   CABINET DE L'ÉCOQUARTIER — script.js v3
   ================================================ */

(function () {
  'use strict';

  /* ---- Utils ---- */
  const qs  = (s, ctx = document) => ctx.querySelector(s);
  const qsa = (s, ctx = document) => Array.from(ctx.querySelectorAll(s));
  const pref = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ================================================
     PAGE TRANSITIONS
     ================================================ */

  // Marquer la page comme chargée → body passe de opacity:0 à 1
  function onPageReady () {
    document.body.classList.add('is-loaded');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onPageReady);
  } else {
    requestAnimationFrame(onPageReady);
  }

  // Intercepter les liens internes pour la transition de sortie
  document.addEventListener('click', function (e) {
    const link = e.target.closest('a[href]');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href) return;

    // Ignorer ancres, mailto, tel, externe, _blank, JS
    if (
      href.startsWith('#') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:') ||
      href.startsWith('http') ||
      href.startsWith('//') ||
      href.startsWith('javascript:') ||
      link.target === '_blank'
    ) return;

    // Ignorer Ctrl+click / Cmd+click (nouvel onglet)
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;

    e.preventDefault();
    if (pref) { window.location.href = href; return; }

    document.body.classList.add('is-exiting');
    setTimeout(() => { window.location.href = href; }, 240);
  });

  /* ================================================
     HEADER — scroll → glass
     ================================================ */

  const header = qs('.site-header');

  function updateHeader () {
    if (!header) return;
    if (window.scrollY > 12) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }

  if (header) {
    window.addEventListener('scroll', updateHeader, { passive: true });
    updateHeader();
  }

  /* ================================================
     ACTIVE NAV — via data-page sur <body>
     ================================================ */

  const page = document.body.dataset.page || '';
  const navLinks = qsa('.nav-link[data-nav], .overlay-link[data-nav]');

  navLinks.forEach(function (link) {
    if (link.dataset.nav === page) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
  });

  /* ================================================
     DROPDOWN DESKTOP
     ================================================ */

  const dropdownBtn = qs('.nav-dropdown-btn');
  const dropdown    = qs('.nav-dropdown');

  if (dropdownBtn && dropdown) {
    function openDropdown () {
      dropdown.classList.add('is-open');
      dropdownBtn.setAttribute('aria-expanded', 'true');
    }
    function closeDropdown () {
      dropdown.classList.remove('is-open');
      dropdownBtn.setAttribute('aria-expanded', 'false');
    }
    function isOpen () { return dropdown.classList.contains('is-open'); }

    dropdownBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      isOpen() ? closeDropdown() : openDropdown();
    });

    dropdownBtn.addEventListener('keydown', function (e) {
      const items = qsa('.nav-dropdown-link', dropdown);
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault(); isOpen() ? closeDropdown() : openDropdown();
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault(); openDropdown(); items[0] && items[0].focus();
      }
      if (e.key === 'Escape') { closeDropdown(); dropdownBtn.focus(); }
    });

    dropdown.addEventListener('keydown', function (e) {
      const items = qsa('.nav-dropdown-link', dropdown);
      const idx   = items.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); items[idx + 1] && items[idx + 1].focus(); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); idx > 0 ? items[idx - 1].focus() : (closeDropdown(), dropdownBtn.focus()); }
      if (e.key === 'Escape')    { closeDropdown(); dropdownBtn.focus(); }
    });

    document.addEventListener('click', function (e) {
      if (!dropdownBtn.contains(e.target) && !dropdown.contains(e.target)) closeDropdown();
    });
  }

  /* ================================================
     OVERLAY MOBILE
     ================================================ */

  const burger  = qs('.burger');
  const overlay = qs('.overlay-menu');

  if (burger && overlay) {
    const overlayItems = qsa('.overlay-item', overlay);
    const focusable    = 'a[href], button:not([disabled]), [tabindex="0"]';
    let   lastFocus;

    function openOverlay () {
      lastFocus = document.activeElement;
      overlay.classList.add('is-open');
      burger.setAttribute('aria-expanded', 'true');
      burger.setAttribute('aria-label', 'Fermer le menu');
      document.body.style.overflow = 'hidden';

      overlayItems.forEach(function (item, i) {
        if (pref) { item.classList.add('is-visible'); return; }
        setTimeout(function () { item.classList.add('is-visible'); }, i * 60);
      });

      const firstLink = qs(focusable, overlay);
      requestAnimationFrame(function () { firstLink && firstLink.focus(); });
    }

    function closeOverlay () {
      overlay.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', 'Ouvrir le menu');
      document.body.style.overflow = '';
      overlayItems.forEach(function (item) { item.classList.remove('is-visible'); });
      lastFocus && lastFocus.focus();
    }

    burger.addEventListener('click', function () {
      overlay.classList.contains('is-open') ? closeOverlay() : openOverlay();
    });

    // Fermer sur Escape
    overlay.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeOverlay(); }
    });

    // Focus trap
    overlay.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      const els   = qsa(focusable, overlay).filter(el => !el.closest('[hidden]'));
      const first = els[0];
      const last  = els[els.length - 1];
      if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus(); } }
      else            { if (document.activeElement === last)  { e.preventDefault(); first.focus(); } }
    });

    /* Sous-menu dans l'overlay */
    qsa('.overlay-submenu-btn', overlay).forEach(function (btn) {
      const sub = qs('.overlay-sub', btn.closest('.overlay-item'));
      if (!sub) return;

      btn.addEventListener('click', function () {
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!expanded));
        if (expanded) { sub.setAttribute('hidden', ''); }
        else          { sub.removeAttribute('hidden'); }
      });
    });
  }

  /* ================================================
     SCROLL REVEAL (IntersectionObserver)
     ================================================ */

  if (!pref && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    qsa('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    // Pas d'animation réduite : révéler immédiatement
    qsa('.reveal').forEach(function (el) { el.classList.add('revealed'); });
  }

})();
