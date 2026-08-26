import { getSiteContent } from '../lib/directus';

const escapeXml = (value: string) =>
  value.replace(/[<>&'\"]/g, (character) => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;',
  })[character] ?? character);

export async function GET({ site }: { site: URL | undefined }) {
  const { posts } = await getSiteContent();
  const base = site ?? new URL('https://0712121.xyz');
  const items = posts.map((post) => `
    <item>
      <title>${escapeXml(post.title)}</title>
      <description>${escapeXml(post.excerpt)}</description>
      <link>${new URL(`/notes/${post.slug}/`, base)}</link>
      <guid>${new URL(`/notes/${post.slug}/`, base)}</guid>
      <pubDate>${new Date(`${post.date}T00:00:00+08:00`).toUTCString()}</pubDate>
    </item>`).join('');

  return new Response(`<?xml version="1.0" encoding="UTF-8" ?>
    <rss version="2.0"><channel>
      <title>0712121</title>
      <description>记录建站、AIGC、设计与数字生活。</description>
      <link>${base}</link>${items}
    </channel></rss>`, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
