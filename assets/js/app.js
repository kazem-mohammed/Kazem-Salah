/* =============================================================
   Kazem Salah — Portfolio
   Behaviour: theme engine, i18n, cursor, project viewer, lightbox
   ============================================================= */
(function () {
  'use strict';

  var DICT = window.KS_I18N;
  var PROJECTS = window.KS_PROJECTS;
  var SOCIALS = window.KS_SOCIALS;
  var STACK = window.KS_STACK;
  var GRAPH = window.KS_SKILL_GRAPH;

  var root = document.documentElement;
  var body = document.body;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var state = {
    lang: 'en',
    theme: 'dark',
    themePref: 'system',
    gallery: [],
    galleryIndex: 0,
    lastFocus: null
  };

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------------------------------------------------------
     Toast
     --------------------------------------------------------- */
  var toastEl = $('#toast');
  var toastTimer = null;
  function t(key, fallback) {
    return (DICT[state.lang] && DICT[state.lang][key]) || DICT.en[key] || fallback || key;
  }
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-visible'); }, 2400);
  }

  /* ---------------------------------------------------------
     Theme engine — dark / light / system
     --------------------------------------------------------- */
  var media = window.matchMedia('(prefers-color-scheme: light)');

  function resolveTheme(pref) {
    if (pref === 'system') return media.matches ? 'light' : 'dark';
    return pref === 'light' ? 'light' : 'dark';
  }

  function applyTheme(pref, persist) {
    state.themePref = pref;
    state.theme = resolveTheme(pref);
    root.setAttribute('data-theme', state.theme);
    root.setAttribute('data-theme-pref', pref);
    $$('[data-theme-set]').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-theme-set') === pref);
      btn.setAttribute('aria-pressed', btn.getAttribute('data-theme-set') === pref ? 'true' : 'false');
    });
    if (persist) {
      try { localStorage.setItem('ks-theme', pref); } catch (e) { /* storage blocked */ }
    }
  }

  function initTheme() {
    var stored = 'dark';
    try { stored = localStorage.getItem('ks-theme') || 'dark'; } catch (e) { /* storage blocked */ }
    applyTheme(stored, false);

    $$('[data-theme-set]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        applyTheme(btn.getAttribute('data-theme-set'), true);
      });
    });

    var onChange = function () {
      if (state.themePref === 'system') applyTheme('system', false);
    };
    if (media.addEventListener) media.addEventListener('change', onChange);
    else if (media.addListener) media.addListener(onChange);
  }

  /* ---------------------------------------------------------
     Bilingual layer
     --------------------------------------------------------- */
  function applyI18n(rootEl) {
    $$('[data-i18n]', rootEl).forEach(function (el) {
      var v = t(el.getAttribute('data-i18n'));
      if (v && el.textContent !== v) el.textContent = v;
    });
    $$('[data-i18n-aria]', rootEl).forEach(function (el) {
      var v = t(el.getAttribute('data-i18n-aria'));
      if (v) el.setAttribute('aria-label', v);
    });
    $$('[data-i18n-placeholder]', rootEl).forEach(function (el) {
      var v = t(el.getAttribute('data-i18n-placeholder'));
      if (v) el.setAttribute('placeholder', v);
    });
  }

  function setLanguage(lang, persist) {
    state.lang = lang === 'ar' ? 'ar' : 'en';
    root.setAttribute('lang', state.lang);
    root.setAttribute('dir', state.lang === 'ar' ? 'rtl' : 'ltr');
    applyI18n(document);
    renderSocials();
    renderStack();
    renderSkillMap();
    if (persist !== false) {
      try { localStorage.setItem('ks-lang', state.lang); } catch (e) { /* storage blocked */ }
    }
    updateUrl();
  }

  function updateUrl() {
    if (!window.history || !history.replaceState) return;
    var url = new URL(window.location.href);
    if (state.lang === 'ar') url.searchParams.set('lang', 'ar');
    else url.searchParams.delete('lang');
    history.replaceState(null, '', url.toString());
  }

  function initLang() {
    var param = new URLSearchParams(window.location.search).get('lang');
    var stored = null;
    try { stored = localStorage.getItem('ks-lang'); } catch (e) { /* storage blocked */ }
    var lang = (param === 'ar' || param === 'en') ? param : (stored === 'ar' ? 'ar' : 'en');
    setLanguage(lang, false);

    var btn = $('#langBtn');
    if (btn) {
      btn.addEventListener('click', function () {
        var next = state.lang === 'en' ? 'ar' : 'en';
        setLanguage(next, true);
        toast(t('toast.langNote'));
      });
    }
  }

  /* ---------------------------------------------------------
     Social links
     --------------------------------------------------------- */
  function socialMarkup(s, compact) {
    var label = s.label;
    var handle = s.handle;
    if (state.lang === 'ar') {
      if (s.id === 'linkedin') label = 'لينكدإن';
      else if (s.id === 'github') label = 'جيت هاب';
      else if (s.id === 'instagram') label = 'إنستجرام';
      else if (s.id === 'facebook') label = 'فيسبوك';
      else if (s.id === 'whatsapp') label = 'واتساب';
      else if (s.id === 'tiktok') label = 'تيك توك';
      else if (s.id === 'snapchat') label = 'سناب شات';
    }
    if (compact) {
      return '<a href="' + s.url + '" target="_blank" rel="noopener noreferrer" aria-label="' + label + '">' +
             '<svg width="18" height="18" aria-hidden="true"><use href="#' + s.icon + '"/></svg></a>';
    }
    return '<a href="' + s.url + '" target="_blank" rel="noopener noreferrer">' +
             '<i><svg width="17" height="17" aria-hidden="true"><use href="#' + s.icon + '"/></svg></i>' +
             '<span><b>' + label + '</b><small dir="ltr">' + handle + '</small></span></a>';
  }

  function renderSocials() {
    var list = $('#socialLinks');
    if (list) list.innerHTML = SOCIALS.map(function (s) { return socialMarkup(s, false); }).join('');
    var mob = $('#socialLinksMobile');
    if (mob) mob.innerHTML = SOCIALS.map(function (s) { return socialMarkup(s, true); }).join('');
  }

  /* ---------------------------------------------------------
     Technology stack
     --------------------------------------------------------- */
  function renderStack() {
    var list = $('#stackList');
    if (!list) return;
    list.innerHTML = STACK.map(function (s) {
      return '<li class="stack__item"><i><svg width="17" height="17" aria-hidden="true"><use href="#' + s.icon + '"/></svg></i>' +
             '<span><b>' + s.name + '</b><small>' + s.sub + '</small></span></li>';
    }).join('');
  }

  /* ---------------------------------------------------------
     Interactive skill map
     Positioned in real pixels so type stays legible at any size
     --------------------------------------------------------- */
  var GRAPH_POS = {
    ads:    [0.215, 0.215],
    cro:    [0.455, 0.095],
    kpi:    [0.705, 0.195],
    data:   [0.450, 0.375],
    seo:    [0.735, 0.405],
    web:    [0.215, 0.495],
    ui:     [0.070, 0.340],
    clients:[0.445, 0.630],
    ops:    [0.700, 0.615],
    comm:   [0.905, 0.455]
  };

  function renderSkillMap() {
    var canvas = $('#skillMapCanvas');
    if (!canvas) return;
    var w = canvas.clientWidth || 640;
    var h = canvas.clientHeight || 300;
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    svg.setAttribute('width', w);
    svg.setAttribute('height', h);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', t('skills.mapIntro'));

    var defs = document.createElementNS(ns, 'defs');
    defs.innerHTML =
      '<radialGradient id="nodeGlow"><stop offset="0%" stop-color="var(--accent)" stop-opacity=".26"/>' +
      '<stop offset="100%" stop-color="var(--accent)" stop-opacity="0"/></radialGradient>';
    svg.appendChild(defs);

    function px(id) {
      var p = GRAPH_POS[id];
      return [p[0] * w, p[1] * h];
    }

    var linkLayer = document.createElementNS(ns, 'g');
    GRAPH.links.forEach(function (pair) {
      var a = px(pair[0]), b = px(pair[1]);
      var line = document.createElementNS(ns, 'line');
      line.setAttribute('x1', a[0]); line.setAttribute('y1', a[1]);
      line.setAttribute('x2', b[0]); line.setAttribute('y2', b[1]);
      line.setAttribute('class', 'map-link');
      linkLayer.appendChild(line);
    });
    svg.appendChild(linkLayer);

    GRAPH.nodes.forEach(function (n) {
      var pos = px(n.id);
      var g = document.createElementNS(ns, 'g');
      g.setAttribute('class', 'map-node');
      g.setAttribute('tabindex', '0');
      g.setAttribute('role', 'listitem');

      var glow = document.createElementNS(ns, 'circle');
      glow.setAttribute('cx', pos[0]); glow.setAttribute('cy', pos[1]); glow.setAttribute('r', 22);
      glow.setAttribute('fill', 'url(#nodeGlow)');
      glow.setAttribute('opacity', '0');
      glow.style.transition = 'opacity .3s';

      var c = document.createElementNS(ns, 'circle');
      c.setAttribute('cx', pos[0]); c.setAttribute('cy', pos[1]); c.setAttribute('r', 7);
      c.setAttribute('fill', 'var(--surface-3)');
      c.setAttribute('stroke', 'var(--line-2)');
      c.setAttribute('stroke-width', '1.6');

      var txt = document.createElementNS(ns, 'text');
      txt.setAttribute('x', pos[0]);
      txt.setAttribute('y', pos[1] - 16);
      txt.setAttribute('text-anchor', 'middle');
      txt.textContent = (state.lang === 'ar' && n.ar) ? n.ar : n.label;

      var title = document.createElementNS(ns, 'title');
      title.textContent = (state.lang === 'ar' && n.arTitle) ? n.arTitle : n.label;

      g.appendChild(glow);
      g.appendChild(c);
      g.appendChild(txt);
      g.appendChild(title);

      g.addEventListener('mouseenter', function () { glow.setAttribute('opacity', '1'); });
      g.addEventListener('mouseleave', function () { glow.setAttribute('opacity', '0'); });
      g.addEventListener('focus', function () { glow.setAttribute('opacity', '1'); });
      g.addEventListener('blur', function () { glow.setAttribute('opacity', '0'); });

      svg.appendChild(g);
    });

    canvas.innerHTML = '';
    canvas.appendChild(svg);
  }

  /* ---------------------------------------------------------
     Preloader
     --------------------------------------------------------- */
  function initPreloader() {
    var pre = $('#preloader');
    if (!pre) return;
    if (reduceMotion.matches) { pre.remove(); return; }
    var done = false;
    function hide() {
      if (done) return;
      done = true;
      pre.classList.add('is-done');
      setTimeout(function () { if (pre && pre.parentNode) pre.parentNode.removeChild(pre); }, 600);
    }
    // Dismiss as soon as the document is ready — never block on slow images.
    if (document.readyState === 'complete') setTimeout(hide, 260);
    else window.addEventListener('load', function () { setTimeout(hide, 180); });
    setTimeout(hide, 1800); // hard safety net
  }

  /* ---------------------------------------------------------
     Custom cursor (desktop, fine pointer)
     --------------------------------------------------------- */
  function initCursor() {
    var cursor = $('#cursor');
    if (!cursor) return;
    var fine = window.matchMedia('(pointer: fine)');
    var touch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

    function destroy() { cursor.hidden = true; }
    function enable() {
      if (touch || reduceMotion.matches) { destroy(); return; }
      cursor.hidden = false;
    }

    if (!fine.matches) { destroy(); return; }
    enable();

    var x = 0, y = 0, rx = 0, ry = 0, raf = null;

    function loop() {
      rx += (x - rx) * 0.18;
      ry += (y - ry) * 0.18;
      cursor.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0)';
      raf = (Math.abs(x - rx) > 0.4 || Math.abs(y - ry) > 0.4) ? requestAnimationFrame(loop) : null;
    }
    function move(e) {
      x = e.clientX; y = e.clientY;
      if (!raf) raf = requestAnimationFrame(loop);
    }
    document.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerdown', function () { cursor.classList.add('is-down'); });
    document.addEventListener('pointerup', function () { cursor.classList.remove('is-down'); });
    document.addEventListener('mouseover', function (e) {
      var t = e.target;
      if (t && t.closest && t.closest('a, button, input, textarea, [role="button"], .tag-list li, .stack__item')) {
        cursor.classList.add('is-hover');
      }
    });
    document.addEventListener('mouseout', function (e) {
      var t = e.target;
      if (t && t.closest && t.closest('a, button, input, textarea, [role="button"], .tag-list li, .stack__item')) {
        cursor.classList.remove('is-hover');
      }
    });
    document.addEventListener('mouseleave', destroy);
    document.addEventListener('mouseenter', enable);
  }

  /* ---------------------------------------------------------
     Scroll: progress, sticky header, back to top
     --------------------------------------------------------- */
  function initScroll() {
    var bar = $('#scrollProgress');
    var fill = bar ? bar.firstElementChild : null;
    var header = $('#siteHeader');
    var toTop = $('#toTopBtn');
    var ticking = false;

    function onScroll() {
      var y = window.pageYOffset || document.documentElement.scrollTop;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var pct = max > 0 ? Math.min(100, (y / max) * 100) : 0;
      if (fill) fill.style.width = pct + '%';
      if (bar) bar.classList.toggle('is-visible', y > 40);
      if (header) header.classList.toggle('is-stuck', y > 12);
      if (toTop) toTop.classList.toggle('is-visible', y > 520);
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
    }, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();

    function goTop() {
      window.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    }
    if (toTop) toTop.addEventListener('click', goTop);
    var footTop = $('#toTop');
    if (footTop) footTop.addEventListener('click', goTop);
  }

  /* ---------------------------------------------------------
     Mobile menu
     --------------------------------------------------------- */
  function initMobileMenu() {
    var btn = $('#menuBtn');
    var menu = $('#mobileMenu');
    if (!btn || !menu) return;

    function open() {
      menu.hidden = false;
      requestAnimationFrame(function () { menu.classList.add('is-open'); });
      btn.setAttribute('aria-expanded', 'true');
      body.classList.add('is-locked');
      var first = menu.querySelector('a, button');
      if (first) first.focus();
    }
    function close() {
      menu.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
      body.classList.remove('is-locked');
      setTimeout(function () { menu.hidden = true; }, 300);
    }
    btn.addEventListener('click', function () {
      if (menu.classList.contains('is-open')) close(); else open();
    });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', close); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) { close(); btn.focus(); }
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 900 && menu.classList.contains('is-open')) close();
    });
  }

  /* ---------------------------------------------------------
     Active section indicator
     --------------------------------------------------------- */
  function initSectionSpy() {
    var nav = $('#primaryNav');
    if (!nav) return;
    var links = $$('a[href^="#"]', nav);
    var indicator = $('#navIndicator');
    var sections = links.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); }).filter(Boolean);
    var bottomNav = $('.bottom-nav');
    var bottomLinks = bottomNav ? $$('a[href^="#"]', bottomNav) : [];

    function moveIndicator(link) {
      if (!indicator || !link) return;
      var r = link.getBoundingClientRect();
      var navRect = nav.getBoundingClientRect();
      indicator.style.width = r.width + 'px';
      indicator.style.transform = 'translateX(' + (r.left - navRect.left - 5) + 'px)';
      indicator.classList.add('is-ready');
    }

    function setActive(id) {
      links.forEach(function (a) {
        var on = a.getAttribute('href') === '#' + id;
        a.classList.toggle('is-active', on);
        if (on) { a.setAttribute('aria-current', 'true'); moveIndicator(a); }
        else a.removeAttribute('aria-current');
      });
      bottomLinks.forEach(function (a) {
        a.classList.toggle('is-active', a.getAttribute('href') === '#' + id);
      });
    }

    if (!('IntersectionObserver' in window)) return;

    var visible = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { visible[entry.target.id] = entry.isIntersecting ? entry.intersectionRatio : 0; });
      var bestId = null, best = 0;
      Object.keys(visible).forEach(function (id) { if (visible[id] > best) { best = visible[id]; bestId = id; } });
      if (bestId) setActive(bestId);
    }, { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5, 1] });

    sections.forEach(function (s) { io.observe(s); });

    // keep the indicator correct after fonts / resize
    var t = null;
    window.addEventListener('resize', function () {
      clearTimeout(t);
      t = setTimeout(function () {
        var active = links.filter(function (a) { return a.classList.contains('is-active'); })[0];
        if (active) moveIndicator(active);
      }, 160);
    });
    window.addEventListener('load', function () {
      var active = links.filter(function (a) { return a.classList.contains('is-active'); })[0];
      if (active) moveIndicator(active);
    });
  }

  /* ---------------------------------------------------------
     Reveal on scroll
     --------------------------------------------------------- */
  function initReveal() {
    var items = $$('.reveal');
    if (!('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.style.setProperty('--d', el.getAttribute('data-delay') || '0');
        el.classList.add('is-in');
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------------------------------------------------------
     3D tilt — hero stage + project cards
     --------------------------------------------------------- */
  function initTilt() {
    if (reduceMotion.matches) return;
    var fine = window.matchMedia('(pointer: fine)');
    if (!fine.matches) return;

    var stage = $('#heroStage');
    if (stage) {
      stage.addEventListener('pointermove', function (e) {
        var r = stage.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        stage.style.setProperty('--ry', (px * 16 - 11).toFixed(2) + 'deg');
        stage.style.setProperty('--rx', (-py * 12 + 5).toFixed(2) + 'deg');
        stage.classList.add('is-tilting');
      });
      stage.addEventListener('pointerleave', function () {
        stage.classList.remove('is-tilting');
      });
    }

    $$('.project').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        card.style.setProperty('--ry', (px * 9).toFixed(2) + 'deg');
        card.style.setProperty('--rx', (-py * 7).toFixed(2) + 'deg');
        card.classList.add('is-tilting');
      });
      card.addEventListener('pointerleave', function () {
        card.classList.remove('is-tilting');
        card.style.removeProperty('--ry');
        card.style.removeProperty('--rx');
      });
    });
  }

  /* ---------------------------------------------------------
     Project filtering
     --------------------------------------------------------- */
  function initFilters() {
    var bar = $('#filters');
    var grid = $('#projectGrid');
    var empty = $('#projectsEmpty');
    if (!bar || !grid) return;

    bar.addEventListener('click', function (e) {
      var btn = e.target.closest('.filter');
      if (!btn) return;
      var key = btn.getAttribute('data-filter');
      $$('.filter', bar).forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });

      var shown = 0;
      $$('.project', grid).forEach(function (card) {
        var cats = (card.getAttribute('data-category') || '').split(' ');
        var match = key === 'all' ||
          (key === 'featured' && card.getAttribute('data-featured') === 'true') ||
          cats.indexOf(key) !== -1;
        card.hidden = !match;
        if (match) shown++;
      });
      if (empty) empty.hidden = shown !== 0;
    });
  }

  /* ---------------------------------------------------------
     Focus trap helper
     --------------------------------------------------------- */
  var FOCUSABLE = 'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])';
  function trapFocus(container, e) {
    var items = $$(FOCUSABLE, container).filter(function (el) { return el.offsetParent !== null; });
    if (!items.length) return;
    var first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* ---------------------------------------------------------
     Project modal
     --------------------------------------------------------- */
  function localise(obj, key) {
    if (!obj) return '';
    if (state.lang === 'ar' && obj.ar) return obj.ar;
    return obj.en || obj.value || '';
  }

  function buildProjectModal(id) {
    var p = PROJECTS[id];
    if (!p) return;

    var title = p.name + (p.nameAr && p.nameAr !== p.name ? ' — ' + p.nameAr : '') + (p.tagline ? ' · ' + p.tagline : '');

    $('#pmHero').innerHTML =
      '<img src="' + p.cover + '" alt="' + p.coverAlt + '" loading="lazy" decoding="async">';

    $('#pmType').textContent = localise(p.category);
    $('#pmTitle').textContent = title;
    $('#pmSummary').textContent = localise(p.summary);

    $('#pmFacts').innerHTML =
      '<div><dt>' + t('work.meta.role') + '</dt><dd>' + localise(p.role) + '</dd></div>' +
      '<div><dt>' + t('work.meta.year') + '</dt><dd>' + localise(p.year) + '</dd></div>' +
      '<div><dt>' + t('work.meta.location') + '</dt><dd>' + localise(p.location) + '</dd></div>' +
      '<div><dt>' + t('work.meta.stack') + '</dt><dd>' + p.tech.slice(0, 3).join(' · ') + '</dd></div>';

    $('#pmAbout').textContent = localise(p.about);

    var feats = localise(p.features) || [];
    $('#pmFeatures').innerHTML = feats.map(function (f) { return '<li>' + f + '</li>'; }).join('');
    $('#pmFeaturesBlock').hidden = feats.length === 0;

    $('#pmTech').innerHTML = p.tech.map(function (x) { return '<span>' + x + '</span>'; }).join('');

    // gallery
    var gal = p.gallery || [];
    state.gallery = gal.map(function (g) {
      return { src: g.src, caption: state.lang === 'ar' ? (g.ar || g.en) : g.en };
    });
    $('#pmGallery').innerHTML = state.gallery.map(function (g, i) {
      return '<button type="button" data-lb-index="' + i + '" aria-label="' + (state.lang === 'ar' ? 'افتح الصورة' : 'Open image') + '">' +
             '<img src="' + g.src + '" alt="' + g.caption + '" loading="lazy" decoding="async">' +
             '<i><svg width="20" height="20" aria-hidden="true"><use href="#i-expand"/></svg></i></button>';
    }).join('');

    // actions
    var actions = '<a class="btn btn--primary" href="' + p.url + '" target="_blank" rel="noopener noreferrer">' +
      '<span>' + t('pm.visitSite') + '</span><svg width="16" height="16" aria-hidden="true"><use href="#i-arrow-up-right"/></svg></a>';
    if (p.source) {
      actions += '<a class="btn btn--outline" href="' + p.source + '" target="_blank" rel="noopener noreferrer">' +
        '<svg width="16" height="16" aria-hidden="true"><use href="#i-github"/></svg><span>' + t('pm.source') + '</span></a>';
    }
    $('#pmActions').innerHTML = actions;

    // refresh modal headings in the current language
    $('#pmAbout').closest('.pm-block').querySelector('h3').textContent = t('pm.about');
    $('#pmFeaturesBlock').querySelector('h3').textContent = t('pm.features');
    var blocks = $$('#pmScroll .pm-block h3');
    if (blocks[2]) blocks[2].textContent = t('pm.gallery');
    if (blocks[3]) blocks[3].textContent = t('pm.tech');
  }

  function openProjectModal(id) {
    var modal = $('#projectModal');
    if (!modal) return;
    buildProjectModal(id);
    state.lastFocus = document.activeElement;
    modal.hidden = false;
    body.classList.add('is-locked');
    requestAnimationFrame(function () {
      modal.classList.add('is-open');
      var dlg = $('.modal__dialog', modal);
      if (dlg) dlg.focus();
    });
  }

  function closeProjectModal() {
    var modal = $('#projectModal');
    if (!modal || modal.hidden) return;
    modal.classList.remove('is-open');
    body.classList.remove('is-locked');
    setTimeout(function () { modal.hidden = true; }, 360);
    if (state.lastFocus && state.lastFocus.focus) state.lastFocus.focus();
  }

  /* ---------------------------------------------------------
     Lightbox
     --------------------------------------------------------- */
  function renderLightbox() {
    if (!state.gallery.length) return;
    var g = state.gallery[state.galleryIndex];
    $('#lbImage').src = g.src;
    $('#lbImage').alt = g.caption;
    $('#lbCaption').textContent = g.caption;
    $('#lbCounter').textContent = (state.galleryIndex + 1) + ' / ' + state.gallery.length;
  }

  function openLightbox(index) {
    var lb = $('#lightbox');
    if (!lb) return;
    state.galleryIndex = index;
    renderLightbox();
    lb.hidden = false;
    body.classList.add('is-locked');
    requestAnimationFrame(function () { lb.classList.add('is-open'); });
  }

  function closeLightbox() {
    var lb = $('#lightbox');
    if (!lb || lb.hidden) return;
    lb.classList.remove('is-open');
    body.classList.remove('is-locked');
    setTimeout(function () { lb.hidden = true; }, 320);
  }

  function stepLightbox(dir) {
    if (!state.gallery.length) return;
    state.galleryIndex = (state.galleryIndex + dir + state.gallery.length) % state.gallery.length;
    renderLightbox();
  }

  function initLightbox() {
    var lb = $('#lightbox');
    if (!lb) return;
    var startX = 0, startY = 0, delta = 0, tracking = false;

    $$('#pmGallery').forEach(function () { /* placeholder */ });

    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-lb-index]');
      if (btn) { openLightbox(parseInt(btn.getAttribute('data-lb-index'), 10)); }
    });

    $('#lbPrev').addEventListener('click', function () { stepLightbox(-1); });
    $('#lbNext').addEventListener('click', function () { stepLightbox(1); });
    $$('[data-lb-close]').forEach(function (el) { el.addEventListener('click', closeLightbox); });

    // touch swipe
    lb.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) return;
      tracking = true; startX = e.touches[0].clientX; startY = e.touches[0].clientY; delta = 0;
    }, { passive: true });
    lb.addEventListener('touchmove', function (e) {
      if (!tracking) return;
      var dx = e.touches[0].clientX - startX;
      var dy = e.touches[0].clientY - startY;
      if (Math.abs(dx) > Math.abs(dy)) { delta = dx; e.preventDefault(); }
    }, { passive: false });
    lb.addEventListener('touchend', function () {
      if (!tracking) return;
      tracking = false;
      if (Math.abs(delta) > 55) stepLightbox(delta < 0 ? 1 : -1);
      delta = 0;
    });
  }

  /* ---------------------------------------------------------
     CV modal
     --------------------------------------------------------- */
  function initCv() {
    var modal = $('#cvModal');
    if (!modal) return;
    var frame = $('#cvFrame');
    var download = $('#cvDownload');
    var current = 'Kazem-Salah-CV.pdf';

    function select(file, btn) {
      current = file;
      $$('.cv-option', modal).forEach(function (b) { b.classList.toggle('is-active', b === btn); });
      frame.setAttribute('src', file + '#view=FitH');
      download.setAttribute('href', file);
      download.setAttribute('download', file);
    }

    $$('.cv-option', modal).forEach(function (btn) {
      btn.addEventListener('click', function () { select(btn.getAttribute('data-cv-file'), btn); });
    });

    function open() {
      state.lastFocus = document.activeElement;
      modal.hidden = false;
      body.classList.add('is-locked');
      var active = $('.cv-option.is-active', modal);
      if (active) select(active.getAttribute('data-cv-file'), active);
      requestAnimationFrame(function () {
        modal.classList.add('is-open');
        var dlg = $('.modal__dialog', modal);
        if (dlg) dlg.focus();
      });
    }
    function close() {
      modal.classList.remove('is-open');
      body.classList.remove('is-locked');
      setTimeout(function () { modal.hidden = true; }, 360);
      if (state.lastFocus && state.lastFocus.focus) state.lastFocus.focus();
    }

    $$('[data-cv-trigger]').forEach(function (b) {
      b.addEventListener('click', open);
      b.setAttribute('aria-expanded', 'false');
    });
    var mob = $('#cvBtnMobile');
    if (mob) mob.addEventListener('click', open);
    $$('[data-close-cv]').forEach(function (el) { el.addEventListener('click', close); });
    modal.addEventListener('click', function (e) {
      if (e.target === modal) close();
    });

    // Keep the modal labels in sync with the active language
    applyI18n(modal);
  }

  /* ---------------------------------------------------------
     Project card triggers
     --------------------------------------------------------- */
  function initProjectTriggers() {
    $$('.project').forEach(function (card) {
      var id = card.getAttribute('data-project');
      if (!id) return;
      var media = card.querySelector('.project__media');
      if (media) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'project__open';
        btn.setAttribute('data-open-project', id);
        btn.setAttribute('aria-haspopup', 'dialog');
        var nm = PROJECTS[id] ? (PROJECTS[id].name + ' ' + (PROJECTS[id].nameAr || '')) : id;
        btn.setAttribute('aria-label', (state.lang === 'ar' ? 'افتح دراسة الحالة: ' : 'Open case study: ') + nm);
        media.insertBefore(btn, media.firstChild);
        btn.addEventListener('click', function () { openProjectModal(id); });
      }
    });
  }

  /* ---------------------------------------------------------
     Contact: copy, compose, share
     --------------------------------------------------------- */
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); resolve(); } catch (e) { reject(e); }
      document.body.removeChild(ta);
    });
  }

  function initContact() {
    $$('[data-copy]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var value = btn.getAttribute('data-copy');
        copyText(value).then(function () {
          btn.classList.add('is-copied');
          var icon = btn.querySelector('use');
          if (icon) icon.setAttribute('href', '#i-check');
          setTimeout(function () {
            btn.classList.remove('is-copied');
            if (icon) icon.setAttribute('href', '#i-copy');
          }, 1800);
          toast(value.indexOf('@') > -1 ? t('toast.copiedEmail') : t('toast.copiedPhone'));
        }).catch(function () { toast(t('toast.shareFailed')); });
      });
    });

    // quick message composer
    var form = $('#composeForm');
    if (form) {
      var subject = $('#composeSubject');
      var message = $('#composeBody');
      var EMAIL = 'kazemsalah77@gmail.com';
      var WA = '201115116456';

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!subject.value.trim()) { subject.focus(); toast(t('toast.subjectNeeded')); return; }
        if (!message.value.trim()) { message.focus(); toast(t('toast.messageNeeded')); return; }
        var href = 'mailto:' + EMAIL +
          '?subject=' + encodeURIComponent(subject.value.trim()) +
          '&body=' + encodeURIComponent(message.value.trim());
        window.location.href = href;
      });

      var waBtn = $('#composeWhatsApp');
      if (waBtn) {
        waBtn.addEventListener('click', function () {
          if (!subject.value.trim()) { subject.focus(); toast(t('toast.subjectNeeded')); return; }
          if (!message.value.trim()) { message.focus(); toast(t('toast.messageNeeded')); return; }
          var text = subject.value.trim() + '\n\n' + message.value.trim();
          window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
        });
      }
    }
  }

  function initShare() {
    var btn = $('#shareBtn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var url = window.location.href;
      var data = {
        title: 'Kazem Salah — Junior Media Buyer & Data Scientist',
        text: state.lang === 'ar'
          ? 'كازم محمد صلاح — ميديا باير مبتدئ وداتا سايcientist، مع ستة مواقع منيو رقمية منشورة.'
          : 'Kazem Salah — Junior Media Buyer & Data Scientist, with six live digital-menu websites.',
        url: url
      };
      if (navigator.share) {
        navigator.share(data).then(function () { toast(t('toast.shared')); }).catch(function (err) {
          if (err && err.name === 'AbortError') return;
          copyText(url).then(function () { toast(t('toast.linkCopied')); });
        });
      } else {
        copyText(url).then(function () { toast(t('toast.linkCopied')); })
          .catch(function () { toast(t('toast.shareFailed')); });
      }
    });
  }

  /* ---------------------------------------------------------
     Global keyboard handling
     --------------------------------------------------------- */
  function initKeys() {
    document.addEventListener('keydown', function (e) {
      var lb = $('#lightbox');
      var pm = $('#projectModal');
      var cv = $('#cvModal');

      if (lb && !lb.hidden) {
        if (e.key === 'Escape') { e.preventDefault(); closeLightbox(); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); stepLightbox(-1); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); stepLightbox(1); }
        else if (e.key === 'Tab') { trapFocus(lb, e); }
        return;
      }
      if (pm && !pm.hidden) {
        if (e.key === 'Escape') { e.preventDefault(); closeProjectModal(); }
        else if (e.key === 'Tab') { trapFocus(pm, e); }
        return;
      }
      if (cv && !cv.hidden) {
        if (e.key === 'Escape') { e.preventDefault(); $$('[data-close-cv]').forEach(function (el) { el.click(); }); }
        else if (e.key === 'Tab') { trapFocus(cv, e); }
      }
    });
  }

  /* ---------------------------------------------------------
     Smooth anchor scrolling (respects reduced motion)
     --------------------------------------------------------- */
  function initSmoothScroll() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute('href');
      if (!id || id === '#') return;
      var target = document.getElementById(id.slice(1));
      if (!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.pageYOffset - (parseInt(getComputedStyle(root).getPropertyValue('--header-h'), 10) + 14);
      window.scrollTo({ top: Math.max(0, top), behavior: reduceMotion.matches ? 'auto' : 'smooth' });
      if (history.replaceState) history.replaceState(null, '', id);
    });
  }

  /* ---------------------------------------------------------
     Boot
     --------------------------------------------------------- */
  function boot() {
    initTheme();
    initLang();
    renderSocials();
    renderStack();
    renderSkillMap();
    initPreloader();
    initCursor();
    initScroll();
    initMobileMenu();
    initSectionSpy();
    initReveal();
    initTilt();
    initFilters();
    initProjectTriggers();
    initLightbox();
    initCv();
    initContact();
    initShare();
    initKeys();
    initSmoothScroll();

    // the skill map is drawn in pixels, so it must be re-laid out on resize
    var mapTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(mapTimer);
      mapTimer = setTimeout(renderSkillMap, 160);
    });

    var year = $('#year');
    if (year) year.textContent = String(new Date().getFullYear());
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
