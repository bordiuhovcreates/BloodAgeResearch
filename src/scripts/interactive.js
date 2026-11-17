// Бургер-меню і попап з формою.
// Плавний скрол до блоків уже працює через CSS (scroll-behavior у global.css).

// Бургер-меню: кнопка [data-burger], меню [data-nav]
const burger = document.querySelector('[data-burger]');
const nav = document.querySelector('[data-nav]');

if (burger && nav) {
  const setOpen = (open) => {
    document.body.classList.toggle('nav-open', open);
    burger.setAttribute('aria-expanded', String(open));
  };
  burger.addEventListener('click', () => {
    setOpen(!document.body.classList.contains('nav-open'));
  });
  nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
}

// Курсор [data-cursor] як на revelatio.studio: точка йде за мишкою (наздоганяє через CSS transition),
// над посиланнями й кнопками збільшується в 1.5 раза, ховається, коли мишка виходить з вікна.
// Під нерухомою мишкою сторінка прокручується — тоді перераховуємо, що під точкою.
(() => {
  const cursor = document.querySelector('[data-cursor]');
  if (!cursor || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  let x = 0;
  let y = 0;
  let started = false;
  const pose = () => {
    const link = document.elementFromPoint(x, y)?.closest('a, button, [role="button"], label, [data-cursor-link]');
    cursor.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${link ? 1.5 : 1})`;
  };
  window.addEventListener('mousemove', (e) => {
    x = e.clientX;
    y = e.clientY;
    pose();
    if (!started) { started = true; cursor.style.opacity = '1'; }
  }, { passive: true });
  window.addEventListener('scroll', () => { if (started) pose(); }, { passive: true });
  document.addEventListener('mouseleave', () => { cursor.style.opacity = '0'; });
  document.addEventListener('mouseenter', () => { if (started) cursor.style.opacity = '1'; });
})();

// Підписка в підвалі [data-subscribe]: сервера для розсилки ще немає — сторінка не перезавантажується
// і адреса не потрапляє в URL. Коли буде сервіс розсилки, відправку додамо тут.
document.querySelectorAll('[data-subscribe]').forEach((form) => {
  form.addEventListener('submit', (e) => e.preventDefault());
});

// Панелі праворуч (Panel.astro): меню [data-panel="menu"] і форми [data-panel="patient" | "partner"].
//   data-panel-open="menu"       — відкриває меню (кнопка на першому екрані);
//   data-popup-open="Назва"      — відкриває форму пацієнта (або партнера, якщо є data-popup-target="partner");
//                                  назва додається до назви форми в заявці: «Request Research Access — Перший екран»;
//   data-panel-close             — хрестик і затемнення закривають панель; також Esc.
// Поки панель відкрита, сторінка під нею не прокручується. Пункт меню закриває меню і плавно веде до блоку.
(() => {
  const panels = new Map([...document.querySelectorAll('[data-panel]')].map((p) => [p.dataset.panel, p]));
  if (!panels.size) return;
  let current = null;
  // Закріплена кнопка меню (Menu.astro): відкриває меню; коли відкрита будь-яка панель — стає хрестиком і закриває її
  const toggle = document.querySelector('[data-menu-toggle]');
  const setToggle = (open) => {
    if (!toggle) return;
    toggle.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };
  let opener = null;

  const close = (then) => {
    if (!current) { then?.(); return; }
    const panel = current;
    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    panel.inert = true;
    current = null;
    setToggle(false);
    document.documentElement.style.overflow = '';
    window.lenis?.start();
    opener?.focus?.({ preventScroll: true });
    then?.();
  };

  const open = (name, from) => {
    const panel = panels.get(name);
    if (!panel) return;
    if (current && current !== panel) close();
    opener = from || null;
    panel.inert = false;
    panel.setAttribute('aria-hidden', 'false');
    panel.classList.add('is-open');
    current = panel;
    setToggle(true); // кнопка меню — хрестик для будь-якої відкритої панелі (меню чи форми)
    window.lenis?.stop();
    if (!window.lenis) document.documentElement.style.overflow = 'hidden';
    setTimeout(() => (panel.querySelector('.panel__close') || panel.querySelector('a, button'))?.focus({ preventScroll: true }), 350);
  };

  toggle?.addEventListener('click', () => {
    if (current) close();
    else open('menu', toggle);
  });

  document.querySelectorAll('[data-panel-open]').forEach((btn) => {
    btn.addEventListener('click', () => open(btn.dataset.panelOpen, btn));
  });

  document.querySelectorAll('[data-popup-open]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.popupTarget || 'patient';
      const panel = panels.get(name);
      const wrap = panel?.querySelector('[data-service-default]');
      const input = panel?.querySelector('input[name="service"]');
      if (wrap && input) {
        const base = wrap.dataset.serviceDefault;
        input.value = btn.dataset.popupOpen ? `${base} — ${btn.dataset.popupOpen}` : base;
      }
      open(name, btn);
    });
  });

  panels.forEach((panel) => {
    panel.querySelectorAll('[data-panel-close]').forEach((el) => el.addEventListener('click', () => close()));
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

  // Пункт меню: закрити меню, потім плавно доїхати до блоку
  document.querySelectorAll('[data-menu-link]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const hash = link.hash;
      const target = hash && document.querySelector(hash);
      if (!target) return;
      e.preventDefault();
      close(() => {
        if (window.lenis) window.lenis.scrollTo(target, { duration: 1.6 });
        else target.scrollIntoView({ behavior: 'smooth' });
      });
    });
  });
})();
