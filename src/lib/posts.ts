import { getCollection, type CollectionEntry } from 'astro:content';

type BlogPost = CollectionEntry<'blog'>;

export function relatedPosts(post: BlogPost, allPosts: BlogPost[], limit = 3): BlogPost[] {
  const others = allPosts.filter((candidate) => candidate.id !== post.id);

  const scored = others
    .map((candidate) => ({
      post: candidate,
      score: candidate.data.tags.filter((tag) => post.data.tags.includes(tag)).length,
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.post.data.pubDate.valueOf() - a.post.data.pubDate.valueOf();
    })
    .map(({ post: candidate }) => candidate);

  if (scored.length >= limit) {
    return scored.slice(0, limit);
  }

  const fallback = others
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
    .filter((candidate) => !scored.some((picked) => picked.id === candidate.id))
    .slice(0, limit - scored.length);

  return [...scored, ...fallback];
}
