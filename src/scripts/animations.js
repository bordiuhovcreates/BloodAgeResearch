// Анімації появи на GSAP. Вмикаються атрибутами в розмітці, без нового коду:
//
//   data-anim="fade-up"   — елемент з'являється знизу при скролі
//   data-anim="fade"      — плавна поява без зсуву
//   data-anim="stagger"   — дочірні елементи з'являються по черзі (картки в сітці)
//   data-count="350"      — лічильник цифр від 0 до числа (data-suffix="+" — знак після)
//   data-scroll-progress  — відсоток прокрутки сторінки (текст 0–100%)
//   data-decrypt          — текст «розшифровується» при наведенні на кнопку
//   data-bg-video         — фонове відео (зупиняється при reduced motion)
//   data-scroll-steps     — sticky-секція: шкала [data-tick] і кроки [data-step="N"] за прокруткою
//   data-count-group      — числа [data-to] «барабаном» (цифри прокручуються стрічкою 0–9), коли група на екрані
//   data-hover-gallery    — фото рядка під курсором виїжджає знизу/згори ([data-gallery-img], [data-gallery-item])
//   data-fit-text         — напис (текст у <span>) займає рівно всю ширину контейнера між полями
//   data-accordion        — акордеон (одна відкрита відповідь) + поява списку по черзі
//   data-scroll-reveal    — літери тексту проявляються від 0.2 до 1 разом із прокруткою
//   data-liquid           — фон [data-liquid-img] тече за мишкою (WebGL на [data-liquid-canvas])
//
// Для користувачів з увімкненим reduced motion анімації вимкнені.

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

gsap.registerPlugin(ScrollTrigger);

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Плавний скрол усього сайту (Lenis, як на Syntrex): колесо миші й тачпад гортають м'яко,
// а посилання на блоки (#block-7 тощо) плавно доїжджають до потрібного місця.
// Синхронізовано з ScrollTrigger, щоб sticky-блоки й анімації спрацьовували вчасно.
// Для reduced motion вимкнено — працює звичайний скрол браузера.
if (!reduce) {
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    anchors: { duration: 1.6 },
  });
  window.lenis = lenis;
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

function initAnimations() {
  if (reduce) return;

  const start = 'top 85%';

  gsap.utils.toArray('[data-anim="fade-up"]').forEach((el) => {
    gsap.from(el, {
      y: 30, opacity: 0, duration: 0.6, ease: 'power2.out',
      scrollTrigger: { trigger: el, start, once: true },
    });
  });

  gsap.utils.toArray('[data-anim="fade"]').forEach((el) => {
    gsap.from(el, {
      opacity: 0, duration: 0.8, ease: 'power1.out',
      scrollTrigger: { trigger: el, start, once: true },
    });
  });

  gsap.utils.toArray('[data-anim="stagger"]').forEach((el) => {
    gsap.from(el.children, {
      y: 30, opacity: 0, duration: 0.6, ease: 'power2.out', stagger: 0.1,
      scrollTrigger: { trigger: el, start, once: true },
    });
  });

  gsap.utils.toArray('[data-count]').forEach((el) => {
    const target = Number(el.dataset.count) || 0;
    const suffix = el.dataset.suffix || '';
    const counter = { value: 0 };
    el.textContent = `0${suffix}`;
    gsap.to(counter, {
      value: target, duration: 1.6, ease: 'power2.out',
      scrollTrigger: { trigger: el, start, once: true },
      onUpdate: () => { el.textContent = `${Math.round(counter.value)}${suffix}`; },
    });
  });
}

initAnimations();

// data-scroll-progress — показує, на скільки відсотків прокручено сторінку (0–100%).
// Це не анімація, тому працює і при reduced motion.
function initScrollProgress() {
  const els = document.querySelectorAll('[data-scroll-progress]');
  if (!els.length) return;
  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const value = max > 0 ? Math.round((window.scrollY / max) * 100) : 0;
    els.forEach((el) => { el.textContent = `${value}%`; });
  };
  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
}

initScrollProgress();

// data-decrypt — при наведенні на кнопку/посилання літери перебираються випадковими символами
// і по черзі «розшифровуються» зліва направо (як на quasaragency.xyz). Лише десктоп з мишею.
const DECRYPT_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*?';

function initDecrypt() {
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 1024px)');

  document.querySelectorAll('[data-decrypt]').forEach((el) => {
    const text = el.textContent;
    const chars = Array.from(text);
    const host = el.closest('a, button') || el;

    el.textContent = '';
    el.classList.add('decrypt');
    const measure = document.createElement('span');
    measure.className = 'decrypt__measure';
    measure.setAttribute('aria-hidden', 'true');
    measure.textContent = text;
    const animated = document.createElement('span');
    animated.className = 'decrypt__animated';
    animated.setAttribute('aria-hidden', 'true');
    animated.textContent = text;
    const sr = document.createElement('span');
    sr.className = 'decrypt__sr';
    sr.textContent = text;
    el.append(measure, animated, sr);

    // Плавніше, але не довше: символи міняються раз на 45 мс (без мерехтіння),
    // а розкриття йде з уповільненням до кінця (спершу швидко, наприкінці м'яко)
    let timer;
    const stop = () => { clearInterval(timer); timer = undefined; animated.textContent = text; };
    const frame = (done) => chars
      .map((ch, i) => (i < done || ch.trim() === '' ? ch : DECRYPT_CHARS[Math.floor(Math.random() * DECRYPT_CHARS.length)]))
      .join('');
    const start = () => {
      if (!canHover.matches || reduce) return;
      clearInterval(timer);
      const duration = Math.min(chars.length * 52, 400);
      const t0 = performance.now();
      animated.textContent = frame(0);
      timer = setInterval(() => {
        const t = Math.min(1, (performance.now() - t0) / duration);
        const eased = 1 - (1 - t) * (1 - t);
        const done = t >= 1 ? chars.length : Math.floor(eased * chars.length);
        if (done >= chars.length) stop();
        else animated.textContent = frame(done);
      }, 45);
    };

    host.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') start(); });
    host.addEventListener('pointerleave', stop);
    host.addEventListener('focusin', start);
    host.addEventListener('focusout', stop);
  });
}

initDecrypt();

// data-scroll-steps — секція вища за екран зі sticky-вмістом. Поки вона прокручується (0 → 1):
//   [data-tick]       — червоні риски проявляються по черзі (шкала заповнюється плавно);
//   [data-step="N"]   — активний крок N (клас is-active, попередній — was-active), кроки рівномірно ділять прокрутку;
//   --p на секції     — доля прокрутки 0–1 для CSS;
//   [data-scroll-fit] — блок зменшується (--k), якщо екран нижчий за блок + 40 px макета зверху і знизу.
// Це прив'язка до прокрутки, а не анімація, тому працює і при reduced motion (переходи вимкнені в CSS).
function initScrollSteps() {
  document.querySelectorAll('[data-scroll-steps]').forEach((section) => {
    const ticks = [...section.querySelectorAll('[data-tick]')];
    const stepEls = [...section.querySelectorAll('[data-step]')];
    const count = new Set(stepEls.map((el) => el.dataset.step)).size;
    const fitEl = section.querySelector('[data-scroll-fit]');

    const fit = () => {
      if (!fitEl) return;
      const sticky = fitEl.parentElement;
      const w = document.documentElement.clientWidth;
      const u = w >= 1024 ? Math.min(w / 1920, window.innerHeight / 1080) : w / 390; // 1 px макета (як --u)
      const k = Math.min(1, (sticky.clientHeight - 80 * u) / fitEl.offsetHeight);
      fitEl.style.setProperty('--k', k);
    };

    let current = 0;
    let filled = -1;
    const update = (p) => {
      // data-scroll-steps="desktop" — лише на десктопі (на мобільній кроки перемикаються інакше, напр. натисканням)
      if (section.dataset.scrollSteps === 'desktop' && window.innerWidth < 1024) return;
      section.style.setProperty('--p', p); // доля прокрутки 0–1 для CSS (наприклад, заповнення лінії)
      const now = p * ticks.length;
      if (now !== filled) {
        // змінюються лише риски між старим і новим заповненням
        const from = filled < 0 ? 0 : Math.max(0, Math.floor(Math.min(now, filled)));
        const to = filled < 0 ? ticks.length - 1 : Math.min(ticks.length - 1, Math.ceil(Math.max(now, filled)));
        for (let i = from; i <= to; i++) ticks[i].style.opacity = Math.min(1, Math.max(0, now - i));
        filled = now;
      }
      if (!count) return;
      const step = Math.min(count - 1, Math.floor(p * count));
      if (step === current) return;
      // попередній крок отримує was-active (наприклад, старе фото лишається під новим, поки те проявляється)
      stepEls.forEach((el) => {
        const n = Number(el.dataset.step);
        el.classList.toggle('was-active', n === current);
        el.classList.toggle('is-active', n === step);
      });
      current = step;
    };

    ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => update(self.progress),
      onRefresh: (self) => { fit(); update(self.progress); },
    });
    window.addEventListener('resize', fit);
    fit();
    update(0);
  });
}

initScrollSteps();


// data-count-group — числа [data-to] (data-suffix="+") «барабаном», як на Syntrex: кожна цифра — віконце,
// в якому прокручується стрічка 0–9 кілька кіл і зупиняється на своїй цифрі; кожна наступна цифра
// справа крутиться на коло більше і довше. Грає щоразу, коли група повністю на екрані;
// коли вона йде з екрана — стрічки повертаються на 0, щоб зіграти знову.
function buildDrum(el) {
  const text = new Intl.NumberFormat('en-US').format(Number(el.dataset.to) || 0) + (el.dataset.suffix || '');
  el.textContent = '';
  const sr = document.createElement('span');
  sr.className = 'visually-hidden';
  sr.textContent = text;
  el.append(sr);
  const strips = [];
  [...text].forEach((ch) => {
    if (!/\d/.test(ch)) {
      const s = document.createElement('span');
      s.setAttribute('aria-hidden', 'true');
      s.textContent = ch;
      el.append(s);
      return;
    }
    const col = document.createElement('span');
    col.className = 'roll-col';
    col.setAttribute('aria-hidden', 'true');
    const sizer = document.createElement('span');
    sizer.className = 'roll-sizer';
    sizer.textContent = ch; // невидима кінцева цифра задає розмір віконця — верстка не зсувається
    const strip = document.createElement('span');
    strip.className = 'roll-strip';
    const loops = 1 + strips.length; // зліва направо: 1, 2, 3… кола
    const digits = [];
    for (let l = 0; l < loops; l++) for (let d = 0; d < 10; d++) digits.push(d);
    for (let d = 0; d <= Number(ch); d++) digits.push(d);
    strip.innerHTML = digits.map((d) => `<span>${d}</span>`).join('');
    col.append(sizer, strip);
    el.append(col);
    strips.push({ strip, total: digits.length });
  });
  return strips;
}

function initCountGroups() {
  document.querySelectorAll('[data-count-group]').forEach((group) => {
    const nums = [...group.querySelectorAll('[data-to]')];
    if (reduce || !nums.length) return;

    const tl = gsap.timeline({ paused: true });
    nums.forEach((el) => {
      buildDrum(el).forEach(({ strip, total }, i) => {
        tl.fromTo(strip, { yPercent: 0 }, {
          yPercent: (-(total - 1) / total) * 100,
          duration: 1.4 + i * 0.25,
          ease: 'power3.out',
        }, i * 0.05);
      });
    });

    new IntersectionObserver(([e]) => {
      if (e.intersectionRatio >= 0.95) tl.restart();
      else if (!e.isIntersecting) tl.pause(0);
    }, { threshold: [0, 0.95] }).observe(group);
  });
}

initCountGroups();

// data-hover-gallery — фото [data-gallery-img] рядка [data-gallery-item] під курсором виїжджає знизу
// (рух вниз по списку) або згори (вгору) і виштовхує попереднє, за 0.5 с. Обирає лише миша:
// звичайна прокрутка фото не змінює. Спочатку показане перше фото. При reduced motion — без руху.
function initHoverGallery() {
  const SLIDE = 'transform 0.5s cubic-bezier(0.455, 0.03, 0.515, 0.955)';
  // Мобільна — як на revelatio.studio (GSAP power2.inOut, 0.5 с)
  const SLIDE_MOBILE = 'transform 0.5s cubic-bezier(0.645, 0.045, 0.355, 1)';
  const mobile = window.matchMedia('(max-width: 1023px)');
  document.querySelectorAll('[data-hover-gallery]').forEach((root) => {
    const imgs = [...root.querySelectorAll('[data-gallery-img]')];
    const items = [...root.querySelectorAll('[data-gallery-item]')];
    if (!imgs.length) return;
    let active = -1;
    const select = (i, animate = true) => {
      if (i === active || i < 0 || !imgs[i]) return;
      const forward = i > active;
      const slide = mobile.matches ? SLIDE_MOBILE : SLIDE;
      imgs.forEach((img, k) => {
        if (k === i || !img.classList.contains('is-on')) return;
        img.classList.remove('is-on');
        img.style.transition = animate ? slide : 'none';
        img.style.transform = `translateY(${forward ? -101 : 101}%)`; // 101 — щоб на дробових пікселях не лишалось смужки старого фото
      });
      const img = imgs[i];
      img.classList.add('is-on');
      img.style.transition = 'none';
      img.style.transform = `translateY(${forward ? 101 : -101}%)`;
      void img.offsetWidth; // зафіксувати стартову позицію перед анімацією
      img.style.transition = animate ? slide : 'none';
      img.style.transform = 'translateY(0)';
      active = i;
    };
    select(0, false);
    items.forEach((item, i) => item.addEventListener('mouseenter', () => {
      if (!mobile.matches) select(i, !reduce);
    }));

    // Мобільна — точно як preview-follower на revelatio.studio:
    //  • активний рядок — найближчий до центру екрана (він чорний, інші сірі);
    //  • фото не стрибає, а плавно «доганяє» рядок: щокадру проходить 16% відстані, що лишилась (--gallery-y);
    //  • зміна фото — із затримкою 110 мс, щоб при швидкій прокрутці не накладались кілька кадрів.
    let lastActive = -1;
    let shown = -1;
    let cur = null;
    let target = 0;
    let posRaf = 0;
    let imgTimer = 0;
    let scrollRaf = 0;
    const markActive = (i) => items.forEach((item, k) => item.classList.toggle('is-active', k === i));
    const setY = (y) => root.style.setProperty('--gallery-y', `${y}px`);
    const posLoop = () => {
      posRaf = 0;
      if (cur === null) cur = target;
      cur += (target - cur) * 0.16;
      if (Math.abs(target - cur) > 0.4) {
        setY(cur);
        posRaf = requestAnimationFrame(posLoop);
      } else {
        cur = target;
        setY(cur);
      }
    };
    const showImg = (i, instant) => {
      if (i === shown) return;
      clearTimeout(imgTimer);
      if (instant) { select(i, false); shown = i; return; }
      imgTimer = setTimeout(() => { select(i, !reduce); shown = i; }, 110);
    };
    const update = (instant) => {
      const mid = window.innerHeight / 2;
      let best = 0;
      let dist = Infinity;
      items.forEach((item, k) => {
        const r = item.getBoundingClientRect();
        const d = Math.abs(r.top + r.height / 2 - mid);
        if (d < dist) { dist = d; best = k; }
      });
      target = items[best].offsetTop;
      if (instant || reduce) {
        cancelAnimationFrame(posRaf);
        posRaf = 0;
        cur = target;
        setY(cur);
      } else if (!posRaf) {
        posRaf = requestAnimationFrame(posLoop);
      }
      if (instant || best !== lastActive) {
        markActive(best);
        showImg(best, instant);
        lastActive = best;
      }
    };
    const reset = () => {
      clearTimeout(imgTimer);
      cancelAnimationFrame(posRaf);
      posRaf = 0;
      cur = null;
      lastActive = -1;
      shown = -1;
      markActive(-1);
      root.style.removeProperty('--gallery-y');
    };
    window.addEventListener('scroll', () => {
      if (!mobile.matches) { if (lastActive !== -1) reset(); return; }
      if (scrollRaf) return;
      scrollRaf = requestAnimationFrame(() => { scrollRaf = 0; update(false); });
    }, { passive: true });
    window.addEventListener('resize', () => (mobile.matches ? update(true) : reset()), { passive: true });
    if (mobile.matches) update(true);

    // Сховані фото (за краєм рамки) браузер з loading="lazy" може не завантажити вчасно —
    // коли блок за ~600 px від екрана, вантажимо всі, щоб при наведенні не було порожнечі
    new IntersectionObserver(([e], obs) => {
      if (!e.isIntersecting) return;
      imgs.forEach((img) => { img.loading = 'eager'; });
      obs.disconnect();
    }, { rootMargin: '600px 0px' }).observe(root);
  });
}

initHoverGallery();

// data-fit-text — однорядковий напис (текст у <span>) займає рівно всю ширину контейнера без полів.
// Підгонка йде за контуром самих літер (без внутрішніх полів шрифту): край першої літери — точно на
// лівому полі, край останньої — на правому. Перераховується, коли завантажився шрифт і при зміні вікна.
// Це підгонка верстки, а не анімація, тому працює і при reduced motion.
function initFitText() {
  const els = [...document.querySelectorAll('[data-fit-text]')];
  if (!els.length) return;
  const ctx = document.createElement('canvas').getContext('2d');
  const fit = () => {
    els.forEach((el) => {
      const span = el.firstElementChild;
      if (!span || !ctx) return;
      el.style.fontSize = '';
      span.style.marginLeft = '';
      const cs = getComputedStyle(el);
      const size = parseFloat(cs.fontSize);
      const avail = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      ctx.font = `${cs.fontWeight} ${size}px ${cs.fontFamily}`;
      const m = ctx.measureText((span.dataset.text || span.textContent).trim()); // data-text — текст через CSS
      const inkLeft = -m.actualBoundingBoxLeft; // де починається контур першої літери
      const inkWidth = m.actualBoundingBoxRight - inkLeft;
      if (inkWidth <= 0 || avail <= 0) return;
      const k = avail / inkWidth;
      el.style.fontSize = `${size * k}px`;
      span.style.marginLeft = `${-inkLeft * k}px`; // зсуваємо, щоб контур став рівно на поле
    });
  };
  fit();
  document.fonts?.ready.then(fit);
  window.addEventListener('resize', fit);
}

initFitText();


// data-accordion — акордеон: [data-acc-trigger] у [data-acc-item] відкриває свою відповідь (клас is-open),
// відкрита лише одна, клік по відкритій закриває. Поява один раз, коли список на екрані: секція має
// клас is-pending (у CSS — сховано), елементи [data-acc-reveal] поза питаннями й самі питання
// отримують затримки --d по черзі. При reduced motion поява без анімації.
function initAccordion() {
  document.querySelectorAll('[data-accordion]').forEach((root) => {
    const items = [...root.querySelectorAll('[data-acc-item]')];
    items.forEach((item) => {
      const trigger = item.querySelector('[data-acc-trigger]');
      trigger?.addEventListener('click', () => {
        const open = !item.classList.contains('is-open');
        items.forEach((other) => {
          const on = other === item && open;
          other.classList.toggle('is-open', on);
          other.querySelector('[data-acc-trigger]')?.setAttribute('aria-expanded', String(on));
        });
      });
    });

    if (reduce || !items.length) return;
    const outer = [...root.querySelectorAll('[data-acc-reveal]')].filter((el) => !el.closest('[data-acc-item]'));
    outer.forEach((el, i) => el.style.setProperty('--d', `${i * 0.05}s`));
    items.forEach((item, i) => item.style.setProperty('--d', `${0.1 + i * 0.07}s`));
    root.classList.add('is-pending');
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      root.classList.remove('is-pending');
      io.disconnect();
      // після появи затримки сповільнювали б відкриття відповідей — прибираємо їх
      setTimeout(() => root.querySelectorAll('[style*="--d"]').forEach((el) => el.style.removeProperty('--d')), 1800);
    }, { threshold: 0.25 });
    io.observe(items[0].parentElement);
  });
}

initAccordion();

// data-scroll-reveal — літери тексту по черзі проявляються від 0.2 до 1 разом із прокруткою:
// починається, коли верх тексту на 90% висоти екрана, повністю видно — на 20%. Назад — знову згасає.
function initScrollReveal() {
  const SOFT = 12; // скільки літер проявляються одночасно (м'який край)
  const MIN = 0.2;
  document.querySelectorAll('[data-scroll-reveal]').forEach((el) => {
    const text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    el.textContent = '';
    const chars = [];
    text.split(/(\s+)/).forEach((part) => {
      if (!part) return;
      if (/^\s+$/.test(part)) { el.append(' '); return; }
      const word = document.createElement('span');
      word.style.display = 'inline-block';
      word.setAttribute('aria-hidden', 'true');
      [...part].forEach((c) => {
        const s = document.createElement('span');
        s.textContent = c;
        word.append(s);
        chars.push(s);
      });
      el.append(word);
    });
    if (reduce) return;

    let head = -1;
    const update = (p) => {
      const now = p * (chars.length + SOFT);
      if (now === head) return;
      // змінюються лише літери між старим і новим положенням м'якого краю
      const from = head < 0 ? 0 : Math.max(0, Math.floor(Math.min(now, head)) - SOFT - 1);
      const to = head < 0 ? chars.length - 1 : Math.min(chars.length - 1, Math.ceil(Math.max(now, head)) + 1);
      for (let i = from; i <= to; i++) {
        chars[i].style.opacity = MIN + (1 - MIN) * Math.min(1, Math.max(0, (now - i) / SOFT));
      }
      head = now;
    };
    ScrollTrigger.create({
      trigger: el,
      start: 'top 90%',
      end: 'top 20%',
      onUpdate: (self) => update(self.progress),
      onRefresh: (self) => update(self.progress),
    });
    update(0);
  });
}

initScrollReveal();

// data-liquid — фон тече за мишкою, як густа рідина (WebGL): тягнеться за рухом курсора, трохи
// закручується, повільно дрейфує і легко зсувається від курсора (паралакс). Малює лише поки блок на екрані.
// Без WebGL або при reduced motion лишається звичайна картинка [data-liquid-img].
function initLiquid() {
  document.querySelectorAll('[data-liquid]').forEach((section) => {
    const canvas = section.querySelector('[data-liquid-canvas]');
    const img = section.querySelector('[data-liquid-img]');
    if (!canvas || !img || reduce) return;
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false });
    if (!gl) return;

    const vs = 'attribute vec2 p; varying vec2 v; void main(){ v = p * .5 + .5; v.y = 1. - v.y; gl_Position = vec4(p, 0., 1.); }';
    const fs = `precision mediump float;
      varying vec2 v;
      uniform sampler2D tex;
      uniform vec2 res, imgSize, mouse, vel;
      uniform float time;
      void main() {
        float rs = res.x / res.y, ri = imgSize.x / imgSize.y;
        vec2 scale = rs > ri ? vec2(1., ri / rs) : vec2(rs / ri, 1.);
        vec2 uv = v;
        vec2 d = (uv - mouse) * vec2(rs, 1.);
        float fall = exp(-dot(d, d) * 9.);
        uv -= vel * fall * .35;
        float a = fall * length(vel) * 2.5;
        vec2 c = uv - mouse; uv = mouse + mat2(cos(a), -sin(a), sin(a), cos(a)) * c;
        uv += vec2(sin(uv.y * 6. + time * .5), cos(uv.x * 5. + time * .4)) * .004;
        uv += (mouse - .5) * -.02;
        uv = (uv - .5) * scale / 1.06 + .5;
        gl_FragColor = texture2D(tex, uv);
      }`;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uni = (name) => gl.getUniformLocation(prog, name);
    const uRes = uni('res'), uImg = uni('imgSize'), uMouse = uni('mouse'), uVel = uni('vel'), uTime = uni('time');

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas.width = section.clientWidth * dpr;
      canvas.height = section.clientHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    };

    const target = { x: 0.5, y: 0.5 }, mouse = { x: 0.5, y: 0.5 }, vel = { x: 0, y: 0 };
    section.addEventListener('pointermove', (e) => {
      const r = section.getBoundingClientRect();
      target.x = (e.clientX - r.left) / r.width;
      target.y = (e.clientY - r.top) / r.height;
    });

    let visible = false, raf = 0;
    const frame = (now) => {
      const px = mouse.x, py = mouse.y;
      mouse.x += (target.x - mouse.x) * 0.08;
      mouse.y += (target.y - mouse.y) * 0.08;
      vel.x += ((mouse.x - px) * 6 - vel.x) * 0.1;
      vel.y += ((mouse.y - py) * 6 - vel.y) * 0.1;
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.uniform2f(uVel, vel.x, vel.y);
      gl.uniform1f(uTime, now / 1000);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = visible ? requestAnimationFrame(frame) : 0;
    };

    const start = () => {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.uniform2f(uImg, img.naturalWidth, img.naturalHeight);
      resize();
      window.addEventListener('resize', resize);
      new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        if (visible && !raf) raf = requestAnimationFrame(frame);
      }).observe(section);
      requestAnimationFrame((t) => { frame(t); canvas.classList.add('is-ready'); });
    };
    if (img.complete && img.naturalWidth) start();
    else img.addEventListener('load', start, { once: true });
  });
}

initLiquid();

// data-bg-video — фонове відео. Спочатку видно постер; саме відео ([data-src] у <source>) вантажиться
// й запускається після повного завантаження сторінки, щоб не забирати канал у першого екрана.
// При reduced motion лишається постер.
function initBgVideo() {
  const videos = [...document.querySelectorAll('[data-bg-video]')];
  if (!videos.length || reduce) return;
  const start = () => videos.forEach((v) => {
    v.querySelectorAll('source[data-src]').forEach((s) => { s.src = s.dataset.src; s.removeAttribute('data-src'); });
    v.load();
    v.play().catch(() => {});
  });
  const later = () => (window.requestIdleCallback ? requestIdleCallback(start, { timeout: 1500 }) : setTimeout(start, 300));
  if (document.readyState === 'complete') later();
  else window.addEventListener('load', later, { once: true });
}

initBgVideo();

// data-defer-src / data-defer-srcset — фото, якого спочатку не видно (наступні кроки Блоку 2):
// вантажиться після повного завантаження сторінки, щоб не забирати канал у першого екрана.
function initDeferredImages() {
  const imgs = [...document.querySelectorAll('img[data-defer-src]')];
  if (!imgs.length) return;
  const start = () => imgs.forEach((img) => {
    if (img.dataset.deferSrcset) img.srcset = img.dataset.deferSrcset;
    img.src = img.dataset.deferSrc;
    img.removeAttribute('data-defer-src');
    img.removeAttribute('data-defer-srcset');
  });
  const later = () => (window.requestIdleCallback ? requestIdleCallback(start, { timeout: 1500 }) : setTimeout(start, 300));
  if (document.readyState === 'complete') later();
  else window.addEventListener('load', later, { once: true });
}

initDeferredImages();
