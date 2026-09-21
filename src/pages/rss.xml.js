import rss from '@astrojs/rss';
import { getPosts, TOPICS } from '../lib/posts';

export async function GET(context) {
  const posts = await getPosts();
  return rss({
    title: 'vNick.io — Writing',
    description:
      'Nick is an infrastructure architect. He writes about data centers, storage and disaster recovery, and about the networks and lighting behind live shows.',
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `/writing/${post.id}/`,
      categories: [TOPICS[post.data.topic]],
    })),
  });
}
