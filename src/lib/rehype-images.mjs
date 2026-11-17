// Фото в статтях (Markdown), як на Syntrex:
// 1) шлях /images/... отримує адресу сайту (BASE_PATH), щоб працювало і на github.io/назва-репозиторію;
// 2) фото з підписом — ![опис](/images/x-910.webp "Підпис") — стає <figure> з <figcaption>;
// 3) усі фото вантажаться ліниво; для x-910.webp додається x-1820.webp для чітких екранів.
export default function rehypeImages(base = '/') {
  const prefix = base.replace(/\/$/, '');
  const fix = (src) => (src && src.startsWith('/') && !src.startsWith(prefix + '/') ? prefix + src : src);

  const prepare = (img) => {
    img.properties.src = fix(img.properties.src);
    img.properties.loading = 'lazy';
    img.properties.decoding = 'async';
    const src = String(img.properties.src || '');
    if (/-910\.webp$/.test(src)) {
      img.properties.srcset = `${src} 910w, ${src.replace(/-910\.webp$/, '-1820.webp')} 1820w`;
      img.properties.sizes = '(min-width: 1024px) 48vw, 100vw';
      img.properties.width = 910;
      img.properties.height = 500;
    }
  };

  const walk = (node) => {
    if (!node.children) return;
    node.children = node.children.map((child) => {
      // внутрішні посилання (/privacy-policy/) теж отримують адресу сайту
      if (child.type === 'element' && child.tagName === 'a' && typeof child.properties.href === 'string' && !child.properties.href.startsWith('//')) {
        child.properties.href = fix(child.properties.href);
      }
      if (child.type === 'element' && child.tagName === 'img') prepare(child);
      // абзац, у якому лише одне фото → figure (з підписом, якщо він є)
      if (child.type === 'element' && child.tagName === 'p') {
        const kids = child.children.filter((k) => !(k.type === 'text' && !k.value.trim()));
        const img = kids.length === 1 && kids[0].type === 'element' && kids[0].tagName === 'img' ? kids[0] : null;
        if (img) {
          prepare(img);
          const caption = img.properties.title;
          delete img.properties.title;
          return {
            type: 'element', tagName: 'figure', properties: {},
            children: caption
              ? [img, { type: 'element', tagName: 'figcaption', properties: {}, children: [{ type: 'text', value: String(caption) }] }]
              : [img],
          };
        }
      }
      walk(child);
      return child;
    });
  };

  return (tree) => walk(tree);
}
