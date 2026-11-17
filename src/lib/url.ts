// Додає до шляху адресу сайту (base), щоб посилання і картинки працювали
// і на github.io/назва-репозиторію, і на своєму домені.
// Використання: url('images/photo.jpg'), url('/thanks/'), url('#contacts')
export function url(path = ''): string {
  if (!path) return '';
  if (/^(https?:|mailto:|tel:|#|data:)/.test(path)) return path;
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/${path.replace(/^\//, '')}`;
}

// Посилання на блок головної (#block-3): на головній — сам якір, на інших сторінках — головна + якір.
// Використання: navHref('#block-3', Astro.url.pathname)
export function navHref(href: string, pathname: string): string {
  if (!href.startsWith('#')) return url(href);
  const slash = (p: string) => (p.endsWith('/') ? p : `${p}/`);
  const home = slash(url('/') || '/');
  return slash(pathname) === home ? href : `${home}${href}`;
}
