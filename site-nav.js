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

  const STORAGE_KEY = 'gym-log-lang';
  const LANGUAGE_SWITCH_DURATION = 440;
  const LEGACY_STORAGE_KEY = 'logwise-blog-lang';

  function normalizeLanguage(lang) {
    return lang === 'tr' || lang === 'en' ? lang : '';
  }

  function documentLanguage() {
    return document.documentElement.lang.toLowerCase().startsWith('tr') ? 'tr' : 'en';
  }

  function readLanguage() {
    try {
      const saved = normalizeLanguage(window.localStorage.getItem(STORAGE_KEY));
      if (saved) return saved;

      const legacy = normalizeLanguage(window.localStorage.getItem(LEGACY_STORAGE_KEY));
      if (legacy) {
        window.localStorage.setItem(STORAGE_KEY, legacy);
        return legacy;
      }
    } catch (err) {}
    return '';
  }

  function saveLanguage(lang) {
    const normalized = normalizeLanguage(lang);
    if (!normalized) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, normalized);
    } catch (err) {}
  }

  function languageFromControl(control) {
    const declared = control.getAttribute('hreflang') || control.getAttribute('data-blog-lang-option');
    return normalizeLanguage((declared || control.textContent || '').trim().toLowerCase());
  }

  function prepareLanguageSwitches() {
    document.querySelectorAll('.lang-switch').forEach(function (languageSwitch) {
      const selected = languageSwitch.querySelector('a.on, a[aria-current="page"]');
      const lang = selected ? languageFromControl(selected) : documentLanguage();
      languageSwitch.setAttribute('data-language', lang || documentLanguage());
      if (!languageSwitch.getAttribute('role')) languageSwitch.setAttribute('role', 'group');
      if (!languageSwitch.getAttribute('aria-label')) {
        languageSwitch.setAttribute('aria-label', documentLanguage() === 'tr' ? 'Dil' : 'Language');
      }
    });
  }

  function canAnimateLanguageSwitch(event, control, targetLang) {
    if (event.defaultPrevented || event.button !== 0) return false;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
    if (control.hasAttribute('download')) return false;
    const target = control.getAttribute('target');
    if (target && target !== '_self') return false;
    if (!control.getAttribute('href')) return false;
    return targetLang && targetLang !== documentLanguage();
  }

  function animateLanguageSwitch(languageSwitch, targetLang, targetUrl) {
    const motionClass = targetLang === 'tr' ? 'is-moving-to-tr' : 'is-moving-to-en';
    languageSwitch.classList.remove('is-moving-to-tr', 'is-moving-to-en');
    void languageSwitch.offsetWidth;
    languageSwitch.setAttribute('data-language', targetLang);
    languageSwitch.setAttribute('aria-busy', 'true');
    languageSwitch.classList.add('is-transitioning', motionClass);

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.setTimeout(function () {
      languageSwitch.classList.remove('is-moving-to-tr', 'is-moving-to-en', 'is-transitioning');
      languageSwitch.removeAttribute('aria-busy');
      window.location.assign(targetUrl);
    }, reduceMotion ? 0 : LANGUAGE_SWITCH_DURATION);
  }

  function bindLanguageControls() {
    document.addEventListener('click', function (event) {
      if (!(event.target instanceof Element)) return;
      const control = event.target.closest('.lang-switch a, [data-blog-lang-option]');
      if (!control) return;
      const targetLang = languageFromControl(control);
      saveLanguage(targetLang);

      const languageSwitch = control.closest('.lang-switch');
      if (!languageSwitch || !canAnimateLanguageSwitch(event, control, targetLang)) return;
      event.preventDefault();
      animateLanguageSwitch(languageSwitch, targetLang, control.href);
    }, true);
  }

  function comparablePath(pathname) {
    return pathname
      .replace(/\/index(?:\.html)?$/, '')
      .replace(/\.html$/, '')
      .replace(/\/$/, '') || '/';
  }

  function redirectToLanguage(preferredLang, currentLang) {
    if (!preferredLang || preferredLang === currentLang) return false;

    const alternate = document.querySelector('link[rel~="alternate"][hreflang="' + preferredLang + '"]');
    if (!alternate) return false;

    try {
      const alternateUrl = new URL(alternate.getAttribute('href'), window.location.href);
      if (comparablePath(alternateUrl.pathname) === comparablePath(window.location.pathname)) return false;
      window.location.replace(alternateUrl.pathname + window.location.search + window.location.hash);
      return true;
    } catch (err) {
      return false;
    }
  }

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

  function init(preferredLang) {
    const navRow = document.querySelector('.nav .nav-row');
    if (!navRow || document.querySelector('[data-site-menu-toggle]')) return;

    const lang = normalizeLanguage(preferredLang) || readLanguage() || documentLanguage();
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

  function boot() {
    prepareLanguageSwitches();
    bindLanguageControls();

    const currentLang = documentLanguage();
    const savedLang = readLanguage();
    const preferredLang = savedLang || currentLang;
    if (!savedLang) saveLanguage(preferredLang);
    if (redirectToLanguage(preferredLang, currentLang)) return;
    init(preferredLang);
  }

  window.LOGWISE_SITE_NAV = Object.freeze({
    init: init,
    getLanguage: function () { return readLanguage() || documentLanguage(); },
    setLanguage: saveLanguage
  });
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
