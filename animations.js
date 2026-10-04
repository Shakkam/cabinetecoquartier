/* ================================================
   CABINET DE L'ÉCOQUARTIER — animations.js
   Particules légères et accents thématisés.
   Toutes les animations :
   - Respectent prefers-reduced-motion (désactivation totale)
   - Se mettent en pause hors viewport (IntersectionObserver)
   - Utilisent requestAnimationFrame avec dF cap à 60fps
   - N'affectent pas la lisibilité du texte (opacités basses)
   ================================================ */

(function () {
  'use strict';

  /* ---- Guard reduced-motion ---- */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const PI2 = Math.PI * 2;
  const now = () => performance.now();

  /* Utilitaire RAF avec cap 60fps */
  function loop (fn) {
    let raf, last = 0;
    function tick (t) {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(t - last, 50); // cap 50ms → évite les sauts
      last = t;
      fn(dt / 16.67); // dt normalisé : 1 = 60fps
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }

  /* Utilitaire IntersectionObserver pause/resume */
  function pauseWhenHidden (canvas, startFn) {
    let stop;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        if (!stop) stop = startFn();
      } else {
        if (stop) { stop(); stop = null; }
      }
    }, { threshold: 0.01 });
    io.observe(canvas);
    return io;
  }

  /* ================================================
     1. HERO — particules prairie (pollen / graines sèches)
     Canvas plein hero, particules qui dérivent en diagonale douce
     Palette : blanc cassé / vert sauge / jaune pâle
     ================================================ */

  const heroSection = document.querySelector('.hero');
  if (heroSection) {
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = [
      'position:absolute',
      'inset:0',
      'width:100%',
      'height:100%',
      'pointer-events:none',
      'z-index:1',       // sous le hero-content (z-index:1 aussi — on met à 0)
      'opacity:.55',
    ].join(';');
    // Mettre le canvas juste avant hero-content
    const heroContent = heroSection.querySelector('.hero-content');
    heroSection.insertBefore(canvas, heroContent);
    canvas.style.zIndex = '0'; // hero-content reste à z-index:1

    const COLORS = [
      'rgba(220,215,190,0.7)',  // blanc-paille
      'rgba(192,212,184,0.55)', // sauge clair
      'rgba(232,192,48,0.45)',  // jaune doré
    ];

    let W, H, particles;

    function makeParticle () {
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        r: .8 + Math.random() * 2.2,
        vx: (.15 + Math.random() * .35) * (Math.random() < .5 ? 1 : -1) * .4,
        vy: -.08 - Math.random() * .18,
        phase: Math.random() * PI2, // oscillation latérale
        freq: .004 + Math.random() * .006,
        amp: .3 + Math.random() * .5,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        life: .6 + Math.random() * .4,  // opacité
      };
    }

    function resize () {
      W = canvas.width  = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
      particles = Array.from({ length: Math.min(Math.round(W * H / 8000), 90) }, makeParticle);
    }

    window.addEventListener('resize', resize, { passive: true });
    resize();

    function render (dt) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, W, H);
      const t = now() * .001;

      particles.forEach(p => {
        // Oscillation latérale douce (effet vent)
        const wobble = Math.sin(t * p.freq * 1000 + p.phase) * p.amp;
        p.x += (p.vx + wobble * .02) * dt;
        p.y += p.vy * dt;

        // Wrap
        if (p.y < -6) { p.y = H + 4; p.x = Math.random() * W; }
        if (p.x < -6) p.x = W + 4;
        if (p.x > W + 6) p.x = -4;

        // Dessin : petite graine elliptique légèrement inclinée
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(wobble * .4 + .4);
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.r * .5, p.r * 1.8, 0, 0, PI2);
        ctx.fill();
        ctx.restore();
      });
    }

    pauseWhenHidden(canvas, () => loop(render));
  }

  /* ================================================
     2. TILES DISCIPLINES — accent SVG au survol
     Chaque tile reçoit un SVG overlay discret thématisé
     ================================================ */

  const tileAccents = {
    'tile--osteo':    drawOsteoWave,
    'tile--mbsr':     drawBreathCircles,
    'tile--yoga':     drawYogaPetals,
    'tile--energie':  drawMeridianLines,
    'tile--sophro':   drawBreathCircles,
    'tile--somato':   drawOsteoWave,
    'tile--kinesio':  drawMeridianLines,
  };

  document.querySelectorAll('.tile').forEach(tile => {
    const cls = Object.keys(tileAccents).find(c => tile.classList.contains(c));
    if (!cls) return;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:2;opacity:0;transition:opacity .45s ease';
    tile.style.position = 'relative'; // assure le positionnement
    tile.appendChild(svg);

    tile.addEventListener('mouseenter', () => { svg.style.opacity = '1'; });
    tile.addEventListener('mouseleave', () => { svg.style.opacity = '0'; });
    tile.addEventListener('focusin',   () => { svg.style.opacity = '1'; });
    tile.addEventListener('focusout',  () => { svg.style.opacity = '0'; });

    tileAccents[cls](svg);
  });

  /* Ostéo / Somato : ondes concentriques (mains / vibrations) */
  function drawOsteoWave (svg) {
    svg.innerHTML = '';
    for (let i = 0; i < 4; i++) {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      const r = 20 + i * 18;
      c.setAttribute('cx', '50%');
      c.setAttribute('cy', '75%');
      c.setAttribute('r', r);
      c.setAttribute('fill', 'none');
      c.setAttribute('stroke', 'rgba(192,212,184,0.35)');
      c.setAttribute('stroke-width', '1');
      c.style.animation = `ecq-ring ${1.8 + i * .4}s ${i * .3}s ease-out infinite`;
      svg.appendChild(c);
    }
  }

  /* MBSR / Sophrologie : cercles de souffle qui se dilatent */
  function drawBreathCircles (svg) {
    svg.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', '50%');
      c.setAttribute('cy', '50%');
      c.setAttribute('r', 30 + i * 20);
      c.setAttribute('fill', 'none');
      c.setAttribute('stroke', 'rgba(122,62,124,0.28)');
      c.setAttribute('stroke-width', '1.5');
      c.style.animation = `ecq-breath ${3 + i * .7}s ${i * .6}s ease-in-out infinite alternate`;
      svg.appendChild(c);
    }
  }

  /* Yoga : pétales (ellipses radiées) */
  function drawYogaPetals (svg) {
    svg.innerHTML = '';
    for (let i = 0; i < 6; i++) {
      const e = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
      e.setAttribute('cx', '50%');
      e.setAttribute('cy', '50%');
      e.setAttribute('rx', '12');
      e.setAttribute('ry', '28');
      e.setAttribute('fill', 'rgba(74,184,66,0.15)');
      e.setAttribute('transform-origin', '50% 50%');
      e.setAttribute('transform', `rotate(${i * 60} 50% 50%)`);
      e.style.animation = `ecq-petal ${4}s ${i * .25}s ease-in-out infinite alternate`;
      svg.appendChild(e);
    }
  }

  /* Énergétique chinoise / Kinésiologie : lignes-méridiens lumineuses */
  function drawMeridianLines (svg) {
    svg.innerHTML = '';
    const paths = [
      'M 50% 0 Q 60% 50% 50% 100%',
      'M 30% 0 Q 20% 50% 30% 100%',
      'M 70% 0 Q 80% 50% 70% 100%',
    ];
    paths.forEach((d, i) => {
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', d);
      p.setAttribute('fill', 'none');
      p.setAttribute('stroke', 'rgba(232,192,48,0.3)');
      p.setAttribute('stroke-width', '1');
      p.style.strokeDasharray = '4 8';
      p.style.animation = `ecq-dash ${2.5 + i * .5}s ${i * .4}s linear infinite`;
      svg.appendChild(p);
    });
  }

  /* ================================================
     3. SECTION DISCIPLINES NUM — canvas fond sombre
     Petites étoiles / points lumineux qui pulsent doucement
     ================================================ */

  const numSection = document.querySelector('.disciplines-num-section');
  if (numSection) {
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;';
    numSection.style.position = 'relative';
    numSection.prepend(canvas);

    // S'assurer que le contenu est par-dessus
    numSection.querySelector('.container').style.position = 'relative';
    numSection.querySelector('.container').style.zIndex = '1';

    let W, H, dots;

    function makeDot () {
      return {
        x: Math.random(),
        y: Math.random(),
        r: .5 + Math.random() * 1.2,
        phase: Math.random() * PI2,
        speed: .0005 + Math.random() * .001,
        color: ['rgba(74,184,66,', 'rgba(232,192,48,', 'rgba(192,212,184,'][Math.floor(Math.random() * 3)],
      };
    }

    function resizeNum () {
      W = canvas.width  = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
      dots = Array.from({ length: 55 }, makeDot);
    }

    window.addEventListener('resize', resizeNum, { passive: true });
    resizeNum();

    pauseWhenHidden(canvas, () => loop(() => {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, W, H);
      const t = now();
      dots.forEach(d => {
        const alpha = (.04 + Math.abs(Math.sin(t * d.speed + d.phase)) * .12).toFixed(3);
        ctx.beginPath();
        ctx.arc(d.x * W, d.y * H, d.r, 0, PI2);
        ctx.fillStyle = d.color + alpha + ')';
        ctx.fill();
      });
    }));
  }

  /* ================================================
     4. PAGE HERO — formes décoratives flottantes
     Uniquement sur pages intérieures (page-hero prune)
     ================================================ */

  const pageHero = document.querySelector('.page-hero');
  if (pageHero) {
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;';
    pageHero.style.position = 'relative';
    pageHero.prepend(canvas);
    pageHero.querySelector('.page-hero-inner').style.position = 'relative';
    pageHero.querySelector('.page-hero-inner').style.zIndex = '1';

    let W, H, shapes;

    function makeShape () {
      return {
        x: Math.random() * 1.4 - .2,
        y: Math.random() * 1.4 - .2,
        r: 30 + Math.random() * 80,
        phase: Math.random() * PI2,
        speed: .0003 + Math.random() * .0006,
        color: ['rgba(74,184,66,', 'rgba(122,62,124,', 'rgba(232,192,48,'][Math.floor(Math.random() * 3)],
      };
    }

    function resizeHero () {
      W = canvas.width  = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
      shapes = Array.from({ length: 8 }, makeShape);
    }

    window.addEventListener('resize', resizeHero, { passive: true });
    resizeHero();

    pauseWhenHidden(canvas, () => loop(() => {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, W, H);
      const t = now();
      shapes.forEach((s, i) => {
        const floatX = Math.sin(t * s.speed + s.phase) * 12;
        const floatY = Math.cos(t * s.speed * .7 + s.phase) * 10;
        const alpha = (.03 + Math.abs(Math.sin(t * s.speed * .5 + i)) * .06).toFixed(3);
        ctx.beginPath();
        ctx.arc(s.x * W + floatX, s.y * H + floatY, s.r, 0, PI2);
        ctx.fillStyle = s.color + alpha + ')';
        ctx.fill();
      });
    }));
  }

  /* ================================================
     CSS keyframes injectés (tile accents)
     ================================================ */

  const style = document.createElement('style');
  style.textContent = `
    @keyframes ecq-ring {
      0%   { r: 20px; opacity: .5; }
      80%  { r: 70px; opacity: 0; }
      100% { r: 70px; opacity: 0; }
    }
    @keyframes ecq-breath {
      from { r: attr(r); opacity: .15; transform: scale(.85); }
      to   { opacity: .45; transform: scale(1.15); }
    }
    @keyframes ecq-petal {
      from { opacity: .08; transform: scale(.9) rotate(0deg); }
      to   { opacity: .25; transform: scale(1.1) rotate(6deg); }
    }
    @keyframes ecq-dash {
      from { stroke-dashoffset: 0; }
      to   { stroke-dashoffset: -48; }
    }
  `;
  document.head.appendChild(style);

})();
