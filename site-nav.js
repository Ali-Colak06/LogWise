(function () {
  'use strict';

  const COPY = {
    en: {
      menu: 'Open navigation', close: 'Close navigation', label: 'Site navigation', eyebrow: 'Navigate',
      home: 'Home', tools: 'Tools', library: 'Library', learn: 'Learn', app: 'Open app'
    },
    tr: {
      menu: 'Menüyü aç', close: 'Menüyü kapat', label: 'Site yönlendirmesi', eyebrow: 'Sayfalar',
      home: 'Ana Sayfa', tools: 'Araçlar', library: 'Kütüphane', learn: 'Öğren', app: 'Uygulamayı aç'
    }
  };

  const ROUTES = {
    en: [
      { key: 'home', href: '/' },
      { key: 'tools', href: '/tools' },
      { key: 'library', href: '/library' },
      { key: 'learn', href: '/learn' }
    ],
    tr: [
      { key: 'home', href: '/tr' },
      { key: 'tools', href: '/araclar' },
      { key: 'library', href: '/kutuphane' },
      { key: 'learn', href: '/ogren' }
    ]
  };

  function activeRoute(pathname) {
    const path = pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';
    if (path === '/' || path === '/index' || path === '/tr') return 'home';
    if (path === '/tools' || path === '/araclar' || path === '/one-rep-max-calculator' || path === '/rpe-rir-calculator' || path === '/barbell-plate-calculator' || path === '/workout-log-template' || path === '/workout-volume-calculator') return 'tools';
    if (path === '/library' || path.startsWith('/library/') || path === '/kutuphane' || path.startsWith('/kutuphane/')) return 'library';
    if (path === '/learn' || path.startsWith('/learn/') || path === '/ogren' || path.startsWith('/ogren/')) return 'learn';
    return '';
  }

  function menuIcon() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
  }

  function closeIcon() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>';
  }

  function init() {
    const navRow = document.querySelector('.nav .nav-row');
    if (!navRow || document.querySelector('[data-site-menu-toggle]')) return;

    const lang = document.documentElement.lang.toLowerCase().startsWith('tr') ? 'tr' : 'en';
    const copy = COPY[lang];
    const current = activeRoute(window.location.pathname);

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'site-menu-toggle';
    toggle.setAttribute('data-site-menu-toggle', '');
    toggle.setAttribute('aria-controls', 'site-navigation-drawer');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', copy.menu);
    toggle.innerHTML = menuIcon();
    navRow.insertBefore(toggle, navRow.firstChild);

    const root = document.createElement('div');
    root.className = 'site-menu-root';
    root.innerHTML = `
      <button class="site-menu-scrim" type="button" tabindex="-1" aria-label="${copy.close}"></button>
      <aside class="site-menu-drawer" id="site-navigation-drawer" aria-label="${copy.label}" aria-hidden="true">
        <div class="site-menu-head">
          <a href="${lang === 'tr' ? '/tr' : '/'}" class="site-menu-brand" aria-label="LogWise ${copy.home}">
            <span class="site-menu-brand-mark"><img src="/Site_Logo180.svg" alt=""/></span>
            <span>LOG <b>WISE</b></span>
          </a>
          <button class="site-menu-close" type="button" aria-label="${copy.close}">${closeIcon()}</button>
        </div>
        <p class="site-menu-eyebrow">${copy.eyebrow}</p>
        <nav class="site-menu-links" aria-label="${copy.label}"></nav>
        <a class="site-menu-app" href="/app">${copy.app} <span aria-hidden="true">&rarr;</span></a>
      </aside>`;

    const links = root.querySelector('.site-menu-links');
    ROUTES[lang].forEach(function (route, index) {
      const link = document.createElement('a');
      link.className = 'site-menu-link';
      link.href = route.href;
      link.innerHTML = `<span class="site-menu-index">0${index + 1}</span><span>${copy[route.key]}</span>`;
      if (route.key === current) {
        link.classList.add('is-active');
        link.setAttribute('aria-current', 'page');
      }
      links.appendChild(link);
    });

    document.body.appendChild(root);

    const drawer = root.querySelector('.site-menu-drawer');
    const close = root.querySelector('.site-menu-close');
    const scrim = root.querySelector('.site-menu-scrim');
    const pageRoots = [document.querySelector('.nav'), document.querySelector('main'), document.querySelector('footer')].filter(Boolean);
    let isOpen = false;

    function setOpen(nextOpen, restoreFocus) {
      isOpen = nextOpen;
      root.classList.toggle('is-open', isOpen);
      document.body.classList.toggle('site-menu-open', isOpen);
      toggle.setAttribute('aria-expanded', String(isOpen));
      toggle.setAttribute('aria-label', isOpen ? copy.close : copy.menu);
      drawer.setAttribute('aria-hidden', String(!isOpen));
      drawer.inert = !isOpen;
      pageRoots.forEach(function (element) { element.inert = isOpen; });

      if (isOpen) {
        window.requestAnimationFrame(function () { close.focus(); });
      } else if (restoreFocus) {
        toggle.focus();
      }
    }

    function trapFocus(event) {
      if (!isOpen || event.key !== 'Tab') return;
      const focusable = Array.from(drawer.querySelectorAll('a[href], button:not([disabled])'));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    drawer.inert = true;
    toggle.addEventListener('click', function () { setOpen(!isOpen, false); });
    close.addEventListener('click', function () { setOpen(false, true); });
    scrim.addEventListener('click', function () { setOpen(false, true); });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && isOpen) setOpen(false, true);
      trapFocus(event);
    });
    window.matchMedia('(min-width: 761px)').addEventListener('change', function (event) {
      if (event.matches && isOpen) setOpen(false, false);
    });
  }

  window.LOGWISE_SITE_NAV = Object.freeze({ init: init });
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
