// Колекції контенту (редагуються в адмінці).
// Юридичні сторінки — src/content/legal/: privacy-policy.md → /privacy-policy/
// Публікації (статті) — src/content/publications/: назва файлу = адреса статті,
// blood-biomarkers-pace-of-aging.md → /publications/blood-biomarkers-pace-of-aging/
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const legal = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/legal' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    updated: z.coerce.date(),
  }),
});

const publications = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/publications' }),
  schema: z.object({
    title: z.string(),
    description: z.string(), // короткий опис: картка статті, вступ над текстом і пошук Google
    category: z.string(), // тема: за нею працює фільтр на сторінці публікацій
    date: z.coerce.date(),
    image: z.string(), // фото для картки (405×300, поруч лежить версія -810 для чітких екранів)
    draft: z.boolean().optional(), // чернетка: не показується на сайті
  }),
});

export const collections = { legal, publications };
