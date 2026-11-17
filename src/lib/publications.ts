// Публікації: список статей (новіші — першими), час читання, дата і адреса сторінки.
import { getCollection, type CollectionEntry } from 'astro:content';

export type Publication = CollectionEntry<'publications'>;

export async function getPublications(): Promise<Publication[]> {
  const all = await getCollection('publications', (e) => !e.data.draft);
  return all.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

// Час читання рахується з кількості знаків тексту статті (з пробілами, без розмітки Markdown):
// науково-популярний текст англійською читають у середньому ~1200 знаків за хвилину (≈200 слів),
// плюс ~12 секунд на кожне фото (обкладинка + фото в тексті). Округлення до цілої хвилини.
const CHARS_PER_MINUTE = 1200;
const MINUTES_PER_IMAGE = 0.2;
export const readTime = (post: Publication) => {
  const body = post.body || '';
  const images = (body.match(/!\[[^\]]*\]\([^)]*\)/g) || []).length + 1; // + обкладинка
  const text = body
    .replace(/!\[[^\]]*\]\([^)]*?(?:"([^"]*)")?\)/g, '$1') // фото → лише підпис
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // посилання → текст
    .replace(/^#{1,6}\s+|^>\s?|^\s*(?:[-*]|\d+\.)\s+/gm, '') // заголовки, цитати, списки
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return Math.max(1, Math.round(text.length / CHARS_PER_MINUTE + images * MINUTES_PER_IMAGE));
};

export const formatDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export const publicationHref = (post: Publication) => `publications/${post.id}/`;
