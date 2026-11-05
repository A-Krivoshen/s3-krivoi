(function () {
  const root = document.documentElement;
  const body = document.body;
  const langButtons = document.querySelectorAll('.lang-btn');
  const themeButtons = document.querySelectorAll('.theme-btn');
  const burger = document.querySelector('.burger');
  const nav = document.getElementById('mainNav');
  const year = document.getElementById('year');
  const matrixCanvas = document.querySelector('.matrix-canvas');
  const localizedMailtoLinks = document.querySelectorAll('[data-mailto-subject-ru][data-mailto-subject-en]');
  const storageKeys = {
    language: 'site-language',
    theme: 'drslon-theme-mode'
  };

  function readStorage(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function writeStorage(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      // The site still works when storage is blocked by the browser.
    }
  }

  function getAutoTheme() {
    const hour = new Date().getHours();
    return hour >= 7 && hour < 20 ? 'day' : 'night';
  }

  function updateControlLabels() {
    const language = body.dataset.currentLang === 'en' ? 'en' : 'ru';
    if (burger) {
      const isOpen = burger.getAttribute('aria-expanded') === 'true';
      const labels = language === 'en'
        ? { open: 'Open navigation', close: 'Close navigation' }
        : { open: 'Открыть навигацию', close: 'Закрыть навигацию' };
      burger.setAttribute('aria-label', isOpen ? labels.close : labels.open);
    }
    const themeNames = language === 'en'
      ? { auto: 'Automatic theme', day: 'Day theme', night: 'Night theme' }
      : { auto: 'Автоматическая тема', day: 'Дневная тема', night: 'Ночная тема' };
    themeButtons.forEach((button) => {
      const name = themeNames[button.dataset.themeMode];
      if (name) button.setAttribute('aria-label', name);
    });
  }

  function applyLanguage(language) {
    const nextLanguage = language === 'en' ? 'en' : 'ru';
    body.dataset.currentLang = nextLanguage;
    root.lang = nextLanguage;
    const localizedTitle = nextLanguage === 'en' ? body.dataset.titleEn : body.dataset.titleRu;
    if (localizedTitle) document.title = localizedTitle;

    langButtons.forEach((button) => {
      const active = button.dataset.lang === nextLanguage;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });

    localizedMailtoLinks.forEach((link) => {
      const subject = nextLanguage === 'en'
        ? link.dataset.mailtoSubjectEn
        : link.dataset.mailtoSubjectRu;
      const email = link.href.split('?')[0];
      link.href = `${email}?subject=${encodeURIComponent(subject)}`;
    });

    writeStorage(storageKeys.language, nextLanguage);
    updateControlLabels();
    if (root.dataset.themeMode) applyTheme(root.dataset.themeMode, false);
  }

  function applyTheme(mode, persist) {
    const nextMode = ['auto', 'day', 'night'].includes(mode) ? mode : 'auto';
    const resolvedTheme = nextMode === 'auto' ? getAutoTheme() : nextMode;
    root.dataset.themeMode = nextMode;
    root.dataset.theme = resolvedTheme;

    themeButtons.forEach((button) => {
      const active = button.dataset.themeMode === nextMode;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    updateControlLabels();

    const themeStatus = document.querySelector('[data-theme-status]');
    if (themeStatus) {
      const language = body.dataset.currentLang === 'en' ? 'en' : 'ru';
      const labels = language === 'en'
        ? { auto: `AUTO · ${resolvedTheme}`, day: 'DAY', night: 'NIGHT' }
        : { auto: `АВТО · ${resolvedTheme === 'day' ? 'день' : 'ночь'}`, day: 'ДЕНЬ', night: 'НОЧЬ' };
      themeStatus.textContent = labels[nextMode];
    }

    if (persist) writeStorage(storageKeys.theme, nextMode);
  }

  langButtons.forEach((button) => {
    button.addEventListener('click', () => applyLanguage(button.dataset.lang));
  });

  themeButtons.forEach((button) => {
    button.addEventListener('click', () => applyTheme(button.dataset.themeMode, true));
  });

  function detectLanguage() {
    const stored = readStorage(storageKeys.language);
    if (stored === 'en' || stored === 'ru') return stored;

    const ruZones = {
      'Europe/Kaliningrad': 1, 'Europe/Moscow': 1, 'Europe/Simferopol': 1, 'Europe/Kirov': 1,
      'Europe/Volgograd': 1, 'Europe/Astrakhan': 1, 'Europe/Saratov': 1, 'Europe/Ulyanovsk': 1,
      'Europe/Samara': 1, 'Asia/Yekaterinburg': 1, 'Asia/Omsk': 1, 'Asia/Novosibirsk': 1,
      'Asia/Barnaul': 1, 'Asia/Tomsk': 1, 'Asia/Novokuznetsk': 1, 'Asia/Krasnoyarsk': 1,
      'Asia/Irkutsk': 1, 'Asia/Chita': 1, 'Asia/Yakutsk': 1, 'Asia/Khandyga': 1,
      'Asia/Vladivostok': 1, 'Asia/Ust-Nera': 1, 'Asia/Magadan': 1, 'Asia/Sakhalin': 1,
      'Asia/Srednekolymsk': 1, 'Asia/Kamchatka': 1, 'Asia/Anadyr': 1
    };

    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      if (tz && ruZones[tz]) return 'ru';
      if (tz) return 'en';
    } catch (error) {
      // Fall through to navigator language.
    }

    const nav = String(navigator.language || '').toLowerCase();
    return nav.indexOf('ru') === 0 ? 'ru' : 'en';
  }

  applyLanguage(detectLanguage());
  applyTheme(readStorage(storageKeys.theme) || 'auto', false);

  if (burger && nav) {
    burger.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(isOpen));
      updateControlLabels();
    });

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        nav.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
        updateControlLabels();
      });
    });

    document.addEventListener('click', (event) => {
      if (!nav.classList.contains('is-open') || nav.contains(event.target) || burger.contains(event.target)) return;
      nav.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      updateControlLabels();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || !nav.classList.contains('is-open')) return;
      nav.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      burger.focus();
      updateControlLabels();
    });
  }

  if (year) year.textContent = new Date().getFullYear();

  function loadAnalytics() {
    if (window.__drslonAnalyticsLoaded) return;
    window.__drslonAnalyticsLoaded = true;
    (function (m, e, t, r, i, k, a) {
      m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
      m[i].l = 1 * new Date();
      for (var j = 0; j < document.scripts.length; j++) { if (document.scripts[j].src === r) return; }
      k = e.createElement(t);
      a = e.getElementsByTagName(t)[0];
      k.async = 1;
      k.src = r;
      a.parentNode.insertBefore(k, a);
    }(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js?id=114083181', 'ym'));
    window.ym(114083181, 'init', {
      ssr: true,
      webvisor: true,
      clickmap: true,
      ecommerce: 'dataLayer',
      referrer: document.referrer,
      url: location.href,
      accurateTrackBounce: true,
      trackLinks: true
    });
  }

  const cookieNotice = document.getElementById('cookieNotice');
  const consent = readStorage('analytics-consent');
  if (consent === 'accepted') loadAnalytics();
  if (cookieNotice && !consent) cookieNotice.hidden = false;
  cookieNotice?.querySelector('.cookie-accept')?.addEventListener('click', () => {
    writeStorage('analytics-consent', 'accepted');
    cookieNotice.hidden = true;
    loadAnalytics();
  });
  cookieNotice?.querySelector('.cookie-later')?.addEventListener('click', () => {
    writeStorage('analytics-consent', 'declined');
    cookieNotice.hidden = true;
  });

  document.querySelectorAll('[data-goal]').forEach((link) => {
    link.addEventListener('click', () => {
      if (typeof window.ym === 'function') window.ym(114083181, 'reachGoal', link.dataset.goal);
    });
  });

  window.setInterval(() => {
    if (root.dataset.themeMode === 'auto') applyTheme('auto', false);
  }, 60000);

  function startMatrix() {
    if (!matrixCanvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const context = matrixCanvas.getContext('2d');
    if (!context) return;

    const characters = '01{}[]<>/\\$#@+-*';
    let columns = 0;
    let drops = [];
    let lastFrame = 0;

    function resize() {
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      matrixCanvas.width = Math.floor(window.innerWidth * ratio);
      matrixCanvas.height = Math.floor(window.innerHeight * ratio);
      matrixCanvas.style.width = `${window.innerWidth}px`;
      matrixCanvas.style.height = `${window.innerHeight}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      columns = Math.ceil(window.innerWidth / 18);
      drops = Array.from({ length: columns }, () => Math.random() * -40);
    }

    function draw(timestamp) {
      if (timestamp - lastFrame < 72) {
        window.requestAnimationFrame(draw);
        return;
      }
      lastFrame = timestamp;
      context.fillStyle = root.dataset.theme === 'day'
        ? 'rgba(237, 248, 244, 0.16)'
        : 'rgba(3, 10, 15, 0.12)';
      context.fillRect(0, 0, window.innerWidth, window.innerHeight);
      context.font = '12px ui-monospace, SFMono-Regular, Menlo, monospace';
      context.fillStyle = root.dataset.theme === 'day'
        ? 'rgba(0, 118, 103, 0.16)'
        : 'rgba(71, 255, 166, 0.22)';

      drops.forEach((drop, index) => {
        const character = characters[Math.floor(Math.random() * characters.length)];
        context.fillText(character, index * 18, drop * 18);
        drops[index] = drop > window.innerHeight / 18 + Math.random() * 18 ? Math.random() * -12 : drop + 0.55;
      });

      window.requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize, { passive: true });
    window.requestAnimationFrame(draw);
  }

  startMatrix();
})();
