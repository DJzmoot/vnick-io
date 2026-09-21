import rss from '@astrojs/rss';
import { getPosts, TOPICS } from '../lib/posts';

export async function GET(context) {
  const posts = await getPosts();
  return rss({
    title: 'vNick.io — Writing',
    description:
      'Nick Manganiello on network infrastructure, virtualization, BCDR, cloud and MDM, and lighting design — systems, from the rack to the rigging.',
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
