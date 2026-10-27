/* Cadê o Flávio? — lógica do jogo.
 * Textos, cores e parâmetros vêm de config.js (window.FLAVIO_CONFIG).
 * Placar só em memória: recarregar a página zera tudo. */
(function () {
  'use strict';

  var C = window.FLAVIO_CONFIG;
  var M = window.FLAVIO_MAP;
  var T = C.texts;
  var G = C.game;
  var K = C.colors;

  function $(id) { return document.getElementById(id); }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function getPath(obj, path) {
    return path.split('.').reduce(function (o, k) { return o == null ? o : o[k]; }, obj);
  }
  function fmt(str, vars) {
    return String(str).replace(/\{(\w+)\}/g, function (m, k) { return k in vars ? vars[k] : m; });
  }
  function now() { return performance.now(); }

  /* ---------- Textos do config ---------- */
  document.title = C.site.title;
  document.querySelectorAll('[data-text]').forEach(function (el) {
    var v = getPath(T, el.dataset.text);
    if (v != null) el.textContent = v;
  });
  document.querySelectorAll('[data-aria]').forEach(function (el) {
    var v = getPath(T, el.dataset.aria);
    if (v != null) { el.setAttribute('aria-label', v); el.title = v; }
  });
  if (G.showMisses) $('hud-misses-wrap').hidden = false;

  var nf = new Intl.NumberFormat(C.locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  function secs(ms, spaced) {
    if (ms == null) return T.hud.empty;
    return nf.format(ms / 1000) + (spaced ? ' ' : '') + T.hud.secondsSuffix;
  }

  /* ---------- Estado (só memória) ---------- */
  var stats = { hits: 0, misses: 0, total: 0, last: null, best: null };
  var scene = null;        // cena atual
  var lastHitScene = null; // cena do último acerto (para a imagem)
  var playing = false;
  var busy = false;
  var roundStart = 0;
  var pausedAt = null;
  var pausedTotal = 0;
  var pauseReasons = {};

  /* ---------- Desenho dos bonecos (unidades base 26x42) ---------- */
  function rrect(ctx, x, y, w, h, rt, rb) {
    ctx.moveTo(x + rt, y);
    ctx.lineTo(x + w - rt, y);
    ctx.arcTo(x + w, y, x + w, y + rt, rt);
    ctx.lineTo(x + w, y + h - rb);
    ctx.arcTo(x + w, y + h, x + w - rb, y + h, rb);
    ctx.lineTo(x + rb, y + h);
    ctx.arcTo(x, y + h, x, y + h - rb, rb);
    ctx.lineTo(x, y + rt);
    ctx.arcTo(x, y, x + rt, y, rt);
    ctx.closePath();
  }

  function drawPerson(ctx, p, s) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(s, s);
    // corpo
    ctx.beginPath();
    rrect(ctx, 3, 19, 20, 22, 9, 3);
    ctx.fillStyle = p.flavio ? K.suit : p.shirt;
    ctx.fill();
    if (p.flavio) {
      // camisa branca em V + gravata, recortadas pelo corpo
      ctx.save();
      ctx.clip();
      ctx.beginPath();
      ctx.moveTo(8.2, 18);
      ctx.lineTo(17.8, 18);
      ctx.lineTo(13, 30);
      ctx.closePath();
      ctx.fillStyle = K.shirtV;
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(11.7, 19.4);
      ctx.lineTo(14.3, 19.4);
      ctx.lineTo(13.8, 21.6);
      ctx.lineTo(15, 28.5);
      ctx.lineTo(13, 31);
      ctx.lineTo(11, 28.5);
      ctx.lineTo(12.2, 21.6);
      ctx.closePath();
      ctx.fillStyle = K.tie;
      ctx.fill();
      ctx.restore();
    }
    // cabeça
    ctx.beginPath();
    ctx.arc(13, 11, 7, 0, Math.PI * 2);
    ctx.fillStyle = p.skin;
    ctx.fill();
    // cabelo (meia-cápsula)
    ctx.beginPath();
    rrect(ctx, 5, 2, 16, 7, 5.6, 1.4);
    ctx.fillStyle = p.hair;
    ctx.fill();
    ctx.restore();
  }

  function randomPerson(x, y) {
    return { x: x, y: y, skin: pick(K.skins), shirt: pick(K.shirts), hair: pick(K.hairs) };
  }

  /* ---------- Retrato do Flávio (SVG) ---------- */
  function portraitSVG() {
    var skin = K.flavioSkin, hair = K.flavioHair;
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240" width="400" height="480">' +
      '<path d="M14 240 C14 186 46 160 100 160 C154 160 186 186 186 240 Z" fill="' + K.suit + '"/>' +
      '<rect x="84" y="134" width="32" height="34" rx="10" fill="' + skin + '"/>' +
      '<path d="M74 160 L100 222 L126 160 Z" fill="' + K.shirtV + '"/>' +
      '<path d="M74 160 L100 222 L82 182 L64 176 Z" fill="#26304A"/>' +
      '<path d="M126 160 L100 222 L118 182 L136 176 Z" fill="#26304A"/>' +
      '<path d="M91 164 L109 164 L105 178 L95 178 Z" fill="' + K.tie + '"/>' +
      '<path d="M95 177 L105 177 L111 214 L100 228 L89 214 Z" fill="' + K.tie + '"/>' +
      '<ellipse cx="52" cy="104" rx="11" ry="14" fill="' + skin + '"/>' +
      '<ellipse cx="148" cy="104" rx="11" ry="14" fill="' + skin + '"/>' +
      '<ellipse cx="100" cy="100" rx="47" ry="56" fill="' + skin + '"/>' +
      '<path d="M52 96 C48 52 74 36 100 36 C128 36 154 52 148 96 C142 74 124 64 104 66 C86 66 66 74 52 96 Z" fill="' + hair + '"/>' +
      '<circle cx="82" cy="104" r="5.5" fill="' + K.ink + '"/>' +
      '<circle cx="118" cy="104" r="5.5" fill="' + K.ink + '"/>' +
      '<path d="M83 127 C92 138 108 138 117 127" fill="none" stroke="' + K.ink + '" stroke-width="4.5" stroke-linecap="round"/>' +
      '</svg>';
  }
  $('start-portrait').innerHTML = portraitSVG();

  var portraitImg = new Image();
  var portraitReady = new Promise(function (res) {
    portraitImg.onload = res;
    portraitImg.onerror = res;
  });
  portraitImg.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(portraitSVG());

  /* ---------- Mapa ---------- */
  var bordersPath = new Path2D(M.borders);
  var landPath = new Path2D(M.land);

  function mapFit(W, H) {
    var k = Math.min(W / M.width, H / M.height);
    return { k: k, ox: (W - M.width * k) / 2, oy: (H - M.height * k) / 2 };
  }

  // Desenha a planta no contexto já transformado em px CSS do palco.
  // zoom = fator extra aplicado por fora (para manter o traço fino na imagem).
  function drawMap(ctx, W, H, zoom) {
    zoom = zoom || 1;
    var f = mapFit(W, H);
    ctx.fillStyle = K.map;
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.translate(f.ox, f.oy);
    ctx.scale(f.k, f.k);
    if (C.map.landAlpha > 0) {
      ctx.globalAlpha = C.map.landAlpha;
      ctx.fillStyle = K.mapLine;
      ctx.fill(landPath);
    }
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = K.mapLine;
    if (C.map.grid) {
      ctx.globalAlpha = C.map.gridAlpha;
      ctx.lineWidth = 1 / f.k;
      ctx.setLineDash([4 / f.k, 4 / f.k]);
      ctx.beginPath();
      var step = C.map.gridStepDeg;
      var top = 83.5, bot = -56, span = top - bot;
      for (var lon = -180; lon <= 180; lon += step) {
        var x = (lon + 180) / 360 * M.width;
        ctx.moveTo(x, 0); ctx.lineTo(x, M.height);
      }
      for (var lat = -60 + step; lat <= 80; lat += step) {
        if (lat < bot || lat > top) continue;
        var y = (top - lat) / span * M.height;
        ctx.moveTo(0, y); ctx.lineTo(M.width, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = Math.min(1, C.map.gridAlpha * 2);
      ctx.strokeRect(0, 0, M.width, M.height);
    }
    ctx.globalAlpha = C.map.lineAlpha;
    ctx.lineWidth = C.map.lineWidth / f.k / zoom * clamp(zoom * 0.4, 1, 2.5);
    ctx.stroke(bordersPath);
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  /* ---------- Palco ---------- */
  var stage = $('stage');
  var canvas = $('game');
  var ctx = canvas.getContext('2d');
  var fx = $('fx');
  var mapLayer = document.createElement('canvas');
  var view = { W: 0, H: 0, dpr: 1 };

  function sizeCanvas() {
    var W = stage.clientWidth, H = stage.clientHeight;
    var dpr = Math.min(window.devicePixelRatio || 1, G.maxDpr);
    view = { W: W, H: H, dpr: dpr };
    canvas.width = mapLayer.width = Math.round(W * dpr);
    canvas.height = mapLayer.height = Math.round(H * dpr);
    var mctx = mapLayer.getContext('2d');
    mctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawMap(mctx, W, H, 1);
  }

  /* Países: Path2D em coordenadas do mapa + caixa delimitadora */
  var countries = M.countries.map(function (c) {
    return { path: new Path2D(c.d), x0: c.b[0], y0: c.b[1], x1: c.b[2], y1: c.b[3] };
  });
  var hitCtx = document.createElement('canvas').getContext('2d');
  function countryAt(mx, my) {
    for (var i = 0; i < countries.length; i++) {
      var c = countries[i];
      if (mx < c.x0 || mx > c.x1 || my < c.y0 || my > c.y1) continue;
      if (hitCtx.isPointInPath(c.path, mx, my)) return c;
    }
    return null;
  }
  // Pontos do boneco (unidades base 26x42) que precisam cair dentro do mesmo país
  var SAMPLES = [[13, 31], [13, 5], [5, 30], [21, 30], [13, 41]];
  function fitsInCountry(x, y, s, f) {
    var first = null;
    for (var i = 0; i < SAMPLES.length; i++) {
      var mx = (x + SAMPLES[i][0] * s - f.ox) / f.k;
      var my = (y + SAMPLES[i][1] * s - f.oy) / f.k;
      if (i === 0) {
        first = countryAt(mx, my);
        if (!first) return false;
      } else if (!hitCtx.isPointInPath(first.path, mx, my)) {
        return false;
      }
    }
    return true;
  }

  function scaleFor(f) {
    var h = Math.max(G.minPersonHeight, M.height * f.k * G.personHeightRatio);
    return h / 42;
  }

  function avoidRects() {
    var sr = stage.getBoundingClientRect();
    return [$('hud'), $('actions'), $('btn-share')].map(function (el) {
      var r = el.getBoundingClientRect();
      return { x: r.left - sr.left - 10, y: r.top - sr.top - 10, w: r.width + 20, h: r.height + 20 };
    });
  }
  function overlaps(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function buildScene() {
    var W = view.W, H = view.H, f = mapFit(W, H), s = scaleFor(f);
    var pw = 26 * s, ph = 42 * s, cw = G.cellW * pw, ch = G.cellH * ph;
    var mapX = f.ox, mapY = f.oy, mapW = M.width * f.k, mapH = M.height * f.k;
    var avoid = avoidRects();
    function blocked(x, y) {
      var box = { x: x, y: y, w: pw, h: ph };
      return x < 2 || y < 2 || x + pw > W - 2 || y + ph > H - 2 ||
        avoid.some(function (a) { return overlaps(a, box); });
    }
    // multidão: grade com deslocamento, só onde o boneco cabe inteiro num país
    var people = [];
    for (var y = mapY - ph / 2; y < mapY + mapH; y += ch) {
      for (var x = mapX - pw / 2; x < mapX + mapW; x += cw) {
        if (Math.random() < G.emptyRate) continue;
        var px = x + rand(-1, 1) * G.jitter * cw;
        var py = y + rand(-1, 1) * G.jitter * ch;
        if (fitsInCountry(px, py, s, f)) people.push(randomPerson(px, py));
      }
    }
    // Flávio: um lugar dentro de um país, longe do HUD e das bordas
    var fl = null, candidates = people.filter(function (p) { return !blocked(p.x, p.y); });
    if (candidates.length) {
      var spot = pick(candidates);
      fl = { x: spot.x, y: spot.y };
    } else {
      for (var i = 0; i < 2000 && !fl; i++) {
        var fx0 = rand(mapX, mapX + mapW - pw), fy0 = rand(mapY, mapY + mapH - ph);
        if (!blocked(fx0, fy0) && fitsInCountry(fx0, fy0, s, f)) fl = { x: fx0, y: fy0 };
      }
      if (!fl) fl = { x: (W - pw) / 2, y: (H - ph) / 2 };
    }
    fl.skin = K.flavioSkin;
    fl.hair = K.flavioHair;
    fl.flavio = true;
    // tira quem estiver praticamente em cima dele
    people = people.filter(function (p) {
      return Math.abs(p.x - fl.x) > pw * 0.6 || Math.abs(p.y - fl.y) > ph * 0.45;
    });
    people.sort(function (a, b) { return a.y - b.y; });
    return { W: W, H: H, s: s, pw: pw, ph: ph, people: people, flavio: fl };
  }

  function drawPeople(c, sc) {
    for (var i = 0; i < sc.people.length; i++) drawPerson(c, sc.people[i], sc.s);
    drawPerson(c, sc.flavio, sc.s); // por cima: nunca fica coberto
  }

  function render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(mapLayer, 0, 0);
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    drawPeople(ctx, scene);
  }

  function newRound() {
    scene = buildScene();
    render();
    roundStart = now();
    pausedTotal = 0;
    if (pausedAt != null) pausedAt = roundStart;
    busy = false;
  }

  /* ---------- Pausa ---------- */
  function setPaused(reason, on) {
    if (on) pauseReasons[reason] = true; else delete pauseReasons[reason];
    var any = Object.keys(pauseReasons).length > 0;
    var t = now();
    if (any && pausedAt == null) pausedAt = t;
    else if (!any && pausedAt != null) { pausedTotal += t - pausedAt; pausedAt = null; }
  }

  /* ---------- HUD ---------- */
  function updateHud(popHits) {
    $('hud-hits').textContent = stats.hits;
    $('hud-avg').textContent = stats.hits ? secs(stats.total / stats.hits) : T.hud.empty;
    $('hud-best').textContent = secs(stats.best);
    $('hud-misses').textContent = stats.misses;
    if (popHits) {
      var el = $('hud-hits');
      el.classList.remove('pop');
      void el.offsetWidth;
      el.classList.add('pop');
    }
  }

  /* ---------- Entrada ---------- */
  function hitBox(pointerType) {
    var pad = pointerType === 'mouse' ? G.hitPadding : G.hitPaddingCoarse;
    var f = scene.flavio;
    return { x: f.x - pad, y: f.y - pad, w: scene.pw + pad * 2, h: scene.ph + pad * 2 };
  }

  canvas.addEventListener('pointerdown', function (e) {
    if (!playing || busy || pausedAt != null || !scene) return;
    var r = canvas.getBoundingClientRect();
    var x = e.clientX - r.left, y = e.clientY - r.top;
    var b = hitBox(e.pointerType);
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) onHit();
    else onMiss(x, y);
  });
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  function flavioCenter() {
    return { x: scene.flavio.x + scene.pw / 2, y: scene.flavio.y + scene.ph / 2 };
  }

  function onHit() {
    busy = true;
    var t = now();
    var elapsed = t - roundStart - pausedTotal;
    stats.hits++;
    stats.total += elapsed;
    stats.last = elapsed;
    stats.best = stats.best == null ? elapsed : Math.min(stats.best, elapsed);
    lastHitScene = scene;
    updateHud(true);

    var c = flavioCenter();
    var ring = document.createElement('div');
    ring.className = 'ring';
    var d = Math.max(36, scene.ph * 2.2);
    ring.style.cssText = 'left:' + c.x + 'px;top:' + c.y + 'px;width:' + d + 'px;height:' + d + 'px';
    var plus = document.createElement('div');
    plus.className = 'plus';
    plus.textContent = T.feedback.plusOne;
    plus.style.cssText = 'left:' + c.x + 'px;top:' + (scene.flavio.y - 4) + 'px';
    fx.appendChild(ring);
    fx.appendChild(plus);
    setTimeout(function () {
      ring.remove(); plus.remove();
      newRound();
    }, G.successMs);
  }

  function onMiss(x, y) {
    busy = true;
    stats.misses++;
    updateHud(false);

    var f = scene.flavio, pad = 3;
    var blink = document.createElement('div');
    blink.className = 'blink';
    blink.style.cssText = 'left:' + (f.x - pad) + 'px;top:' + (f.y - pad) + 'px;width:' + (scene.pw + pad * 2) + 'px;height:' + (scene.ph + pad * 2) + 'px';
    var label = document.createElement('div');
    label.className = 'miss-label';
    label.textContent = T.feedback.miss;
    label.style.cssText = 'left:' + clamp(x, 70, view.W - 70) + 'px;top:' + Math.max(36, y - 8) + 'px';
    fx.appendChild(blink);
    fx.appendChild(label);

    var per = G.missBlinkMs / G.missBlinks;
    if (blink.animate) {
      blink.animate([{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 1, offset: 0.6 }, { opacity: 0 }],
        { duration: per, iterations: G.missBlinks });
      label.animate([{ opacity: 1 }, { opacity: 1, offset: 0.7 }, { opacity: 0 }], { duration: G.missBlinkMs, fill: 'forwards' });
    } else {
      blink.style.opacity = 1;
    }
    setTimeout(function () {
      blink.remove(); label.remove();
      newRound();
    }, G.missBlinkMs);
  }

  /* ---------- Orientação ---------- */
  var coarse = window.matchMedia('(pointer: coarse)');
  function checkOrientation() {
    var portrait = window.innerHeight > window.innerWidth;
    var show = playing && coarse.matches && portrait;
    $('rotate').hidden = !show;
    setPaused('rotate', show);
  }

  /* ---------- Tela cheia ---------- */
  var root = document.documentElement;
  var fsEnabled = !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
  function isFs() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
  function enterFs() {
    try {
      var p = root.requestFullscreen ? root.requestFullscreen({ navigationUI: 'hide' })
        : root.webkitRequestFullscreen ? root.webkitRequestFullscreen() : null;
      if (p && p.then) {
        p.then(function () {
          try { screen.orientation.lock('landscape').catch(function () {}); } catch (e) {}
        }).catch(function () {});
      }
    } catch (e) {}
  }
  function exitFs() {
    try {
      var p = document.exitFullscreen ? document.exitFullscreen() : document.webkitExitFullscreen && document.webkitExitFullscreen();
      if (p && p.catch) p.catch(function () {});
    } catch (e) {}
  }
  if (fsEnabled) $('btn-fullscreen').hidden = false;
  $('btn-fullscreen').addEventListener('click', function () { isFs() ? exitFs() : enterFs(); });
  function onFsChange() {
    var label = isFs() ? T.hud.exitFullscreen : T.hud.fullscreen;
    $('btn-fullscreen').setAttribute('aria-label', label);
    $('btn-fullscreen').title = label;
  }
  document.addEventListener('fullscreenchange', onFsChange);
  document.addEventListener('webkitfullscreenchange', onFsChange);

  var wakeLock = null;
  function keepAwake() {
    try {
      if (navigator.wakeLock && !wakeLock) {
        navigator.wakeLock.request('screen').then(function (w) {
          wakeLock = w;
          w.addEventListener('release', function () { wakeLock = null; });
        }).catch(function () {});
      }
    } catch (e) {}
  }

  /* ---------- Início ---------- */
  $('btn-play').addEventListener('click', function () {
    if (fsEnabled && coarse.matches) enterFs();
    keepAwake();
    $('start').hidden = true;
    playing = true;
    // espera o layout assentar (tela cheia/rotação) antes de montar a cena
    setTimeout(function () {
      sizeCanvas();
      newRound();
      checkOrientation();
    }, 120);
  });

  var startCanvas = $('start-crowd');
  function drawStartCrowd() {
    if ($('start').hidden) return;
    var W = window.innerWidth, H = window.innerHeight;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    startCanvas.width = W * dpr;
    startCanvas.height = H * dpr;
    var c = startCanvas.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.fillStyle = K.sand;
    c.fillRect(0, 0, W, H);
    var s = 1.2, cw = 40 * s, ch = 52 * s, list = [];
    for (var y = -20; y < H + 20; y += ch) {
      for (var x = -20; x < W + 20; x += cw) {
        list.push(randomPerson(x + rand(-6, 6), y + rand(-8, 8)));
      }
    }
    list.forEach(function (p) { drawPerson(c, p, s); });
  }
  drawStartCrowd();

  /* ---------- Redimensionar ---------- */
  var resizeTimer = null;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      drawStartCrowd();
      checkOrientation();
      if (playing && !busy) {
        sizeCanvas();
        newRound();
      } else if (playing) {
        sizeCanvas();
      }
    }, 150);
  }
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onResize);
  document.addEventListener('visibilitychange', function () {
    setPaused('hidden', document.hidden);
    if (!document.hidden && playing) keepAwake();
  });

  /* ---------- Toast ---------- */
  var toastTimer = null;
  function toast(msg, ms) {
    var el = $('toast');
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, ms || 2600);
  }

  /* ---------- Imagem de compartilhamento (1080x1920) ---------- */
  function roundRectPath(c, x, y, w, h, r) {
    c.beginPath();
    rrect(c, x, y, w, h, r, r);
  }
  function card(c, x, y, w, h, r, fill, shadow) {
    c.fillStyle = K.ink;
    roundRectPath(c, x, y + shadow, w, h, r);
    c.fill();
    c.fillStyle = fill;
    roundRectPath(c, x, y, w, h, r);
    c.fill();
  }
  function centerText(c, parts, y, W) {
    // parts: [{text, font, color}]
    var total = 0;
    parts.forEach(function (p) { c.font = p.font; p.w = c.measureText(p.text).width; total += p.w; });
    var x = (W - total) / 2;
    parts.forEach(function (p) {
      c.font = p.font; c.fillStyle = p.color; c.textAlign = 'left';
      c.fillText(p.text, x, y);
      x += p.w;
    });
  }
  function fitFont(c, text, family, weight, size, maxW) {
    c.font = weight + ' ' + size + 'px ' + family;
    while (c.measureText(text).width > maxW && size > 20) {
      size -= 2;
      c.font = weight + ' ' + size + 'px ' + family;
    }
    return c.font;
  }

  var TITLE = '"Lilita One", "Arial Rounded MT Bold", sans-serif';
  var BODY = '"Nunito", system-ui, sans-serif';

  function makeShareImage() {
    var fontsReady = (document.fonts && document.fonts.load)
      ? Promise.all([document.fonts.load('400 80px "Lilita One"'), document.fonts.load('800 40px "Nunito"')]).catch(function () {})
      : Promise.resolve();
    return Promise.all([fontsReady, portraitReady]).then(function () {
      var W = C.share.width, H = C.share.height;
      var cv = document.createElement('canvas');
      cv.width = W; cv.height = H;
      var c = cv.getContext('2d');
      c.textBaseline = 'alphabetic';

      // fundo areia com bonequinhos
      c.fillStyle = K.sand;
      c.fillRect(0, 0, W, H);
      // áreas reservadas para textos e cartões (sem bonequinhos por cima)
      var ps = 2.1;
      var reserved = [
        { x: 40, y: 70, w: 1000, h: 210 },
        { x: 70, y: 280, w: 940, h: 1110 },
        { x: 360, y: 1380, w: 360, h: 340 },
        { x: 20, y: 1690, w: 1040, h: 210 }
      ];
      for (var yy = -30; yy < H; yy += 120) {
        for (var xx = -20; xx < W; xx += 92) {
          if (Math.random() < 0.3) continue;
          var pp = randomPerson(xx + rand(-14, 14), yy + rand(-16, 16));
          var pb = { x: pp.x, y: pp.y, w: 26 * ps, h: 42 * ps };
          if (reserved.some(function (r) { return overlaps(r, pb); })) continue;
          drawPerson(c, pp, ps);
        }
      }

      // título
      var tsize = 128;
      centerText(c, [
        { text: T.share.imageTitleBefore + ' ', font: '400 ' + tsize + 'px ' + TITLE, color: K.ink },
        { text: T.share.imageTitleName, font: '400 ' + tsize + 'px ' + TITLE, color: K.accent }
      ], 230, W);

      // cena recortada
      var sc = lastHitScene;
      var cx = 90, cy = 300, cwid = 900, chei = 620;
      card(c, cx, cy, cwid, chei, 36, K.map, 14);
      if (sc) {
        var z = clamp(cwid / (sc.pw * 16), 2.2, 7);
        var vw = cwid / z, vh = chei / z;
        var fc = { x: sc.flavio.x + sc.pw / 2, y: sc.flavio.y + sc.ph / 2 };
        var x0 = clamp(fc.x - vw / 2, 0, Math.max(0, sc.W - vw));
        var y0 = clamp(fc.y - vh / 2, 0, Math.max(0, sc.H - vh));
        c.save();
        roundRectPath(c, cx, cy, cwid, chei, 36);
        c.clip();
        c.translate(cx, cy);
        c.scale(z, z);
        c.translate(-x0, -y0);
        drawMap(c, sc.W, sc.H, z);
        drawPeople(c, sc);
        // anel no Flávio
        c.beginPath();
        c.arc(fc.x, fc.y, sc.ph * 1.1, 0, Math.PI * 2);
        c.lineWidth = 14 / z;
        c.strokeStyle = K.accent;
        c.stroke();
        c.restore();
        // etiqueta "Ele estava aqui!"
        var lx = cx + (fc.x - x0) * z, ly = cy + (fc.y - y0) * z - sc.ph * 1.1 * z - 24;
        c.font = '800 38px ' + BODY;
        var lw = c.measureText(T.share.imageHere).width + 44;
        var lxx = clamp(lx - lw / 2, cx + 16, cx + cwid - lw - 16);
        var lyy = clamp(ly - 64, cy + 16, cy + chei - 80);
        card(c, lxx, lyy, lw, 64, 18, K.accent, 6);
        c.fillStyle = K.cream;
        c.textAlign = 'center';
        c.fillText(T.share.imageHere, lxx + lw / 2, lyy + 45);
      }

      // números
      var by = 990;
      card(c, 90, by, 900, 380, 36, K.cream, 14);
      var hitsText = stats.hits === 1 ? T.share.imageHitsOne : fmt(T.share.imageHits, { acertos: stats.hits });
      c.fillStyle = K.ink;
      c.textAlign = 'center';
      c.font = fitFont(c, hitsText, TITLE, '400', 76, 820);
      c.fillText(hitsText, W / 2, by + 110);
      c.fillStyle = K.ink;
      c.fillRect(140, by + 150, 800, 4);
      var cols = [
        { label: T.share.imageAverage, value: stats.hits ? secs(stats.total / stats.hits, true) : T.hud.empty },
        { label: T.share.imageBest, value: secs(stats.best, true) }
      ];
      cols.forEach(function (col, i) {
        var mx = 90 + 225 + i * 450;
        c.textAlign = 'center';
        c.globalAlpha = 0.65;
        c.font = '800 38px ' + BODY;
        c.fillStyle = K.ink;
        c.fillText(col.label.toUpperCase(), mx, by + 225);
        c.globalAlpha = 1;
        c.font = '400 104px ' + TITLE;
        c.fillStyle = i === 0 ? K.accent : K.ink;
        c.fillText(col.value, mx, by + 335);
      });

      // retrato
      if (portraitImg.naturalWidth || portraitImg.width) {
        c.drawImage(portraitImg, (W - 250) / 2, 1400, 250, 300);
      }

      // chamada
      c.textAlign = 'center';
      c.fillStyle = K.ink;
      c.font = fitFont(c, T.share.imageCta, BODY, '800', 50, 960);
      c.fillText(T.share.imageCta, W / 2, 1775);
      c.fillStyle = K.accent;
      c.font = fitFont(c, T.share.imageUrl, TITLE, '400', 76, 960);
      c.fillText(T.share.imageUrl, W / 2, 1860);

      return new Promise(function (res) { cv.toBlob(res, 'image/png'); });
    });
  }

  /* ---------- Compartilhar ---------- */
  var shareBlob = null, shareFile = null, shareUrl = null;

  function shareText() {
    var avg = stats.hits ? secs(stats.total / stats.hits, true) : T.hud.empty;
    var tpl = stats.hits ? C.share.text : C.share.textFallback;
    return fmt(tpl, { acertos: stats.hits, media: avg, melhor: secs(stats.best, true), url: C.site.url });
  }
  function canShareFile() {
    try { return !!(shareFile && navigator.canShare && navigator.canShare({ files: [shareFile] })); }
    catch (e) { return false; }
  }
  function nativeShare(withText) {
    var data = { files: [shareFile], title: C.share.title };
    if (withText) data.text = shareText();
    return navigator.share(data).then(function () { return true; }, function (err) {
      return err && err.name === 'AbortError';
    });
  }
  function openLink(url) {
    var a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  function download() {
    if (!shareUrl) return;
    try {
      var a = document.createElement('a');
      a.href = shareUrl;
      a.download = C.share.fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {}
    $('share-hint').textContent = T.share.saveHint;
  }

  function openShare() {
    if (!stats.hits) { toast(T.share.noHitsYet); return; }
    setPaused('share', true);
    $('share').hidden = false;
    $('share-img').hidden = true;
    $('share-generating').hidden = false;
    $('share-hint').textContent = '';
    if (shareUrl) { URL.revokeObjectURL(shareUrl); shareUrl = null; }
    makeShareImage().then(function (blob) {
      shareBlob = blob;
      try { shareFile = new File([blob], C.share.fileName, { type: 'image/png' }); } catch (e) { shareFile = null; }
      shareUrl = URL.createObjectURL(blob);
      $('share-img').src = shareUrl;
      $('share-img').alt = shareText();
      $('share-img').hidden = false;
      $('share-generating').hidden = true;
    });
    $('btn-share-close').focus();
  }
  function closeShare() {
    $('share').hidden = true;
    setPaused('share', false);
  }

  $('btn-share').addEventListener('click', openShare);
  $('btn-share-close').addEventListener('click', closeShare);
  $('share').addEventListener('click', function (e) { if (e.target === $('share')) closeShare(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('share').hidden) closeShare(); });

  function linkFor(tpl) { return fmt(tpl, { text: encodeURIComponent(shareText()) }); }

  $('share-wa').addEventListener('click', function () {
    if (canShareFile()) nativeShare(true);
    else openLink(linkFor(C.share.whatsappUrl));
  });
  $('share-x').addEventListener('click', function () {
    if (canShareFile()) nativeShare(true);
    else openLink(linkFor(C.share.xUrl));
  });
  $('share-ig').addEventListener('click', function () {
    if (canShareFile()) nativeShare(false);
    else { download(); $('share-hint').textContent = T.share.instagramHint; }
  });
  $('share-save').addEventListener('click', download);

  updateHud(false);
})();
