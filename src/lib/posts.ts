import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;
export type Topic = Post['data']['topic'];

/** Display names for the three topics, in site order. */
export const TOPICS: Record<Topic, string> = {
  infrastructure: 'Infrastructure',
  production: 'Live production',
  build: 'Build',
};

/**
 * All published posts, newest first. Drafts are visible in `npm run dev`
 * but never appear in production builds (pages, lists, RSS or sitemap).
 */
export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection('posts', ({ data }) => import.meta.env.DEV || !data.draft);
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
