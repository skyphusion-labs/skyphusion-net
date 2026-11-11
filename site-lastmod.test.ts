// Controls for scripts/site-lastmod.mjs (skyphusion-net#153): lastmod for every sitemap page.
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildSiteLastmodMap, gitLastmod, postTags } from './scripts/site-lastmod.mjs';

function content(posts: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), 'site-lastmod-'));
  for (const [name, fm] of Object.entries(posts)) writeFileSync(join(dir, `${name}.md`), `---\n${fm}\n---\nbody\n`);
  return dir;
}
const iso = (d?: Date) => d?.toISOString().slice(0, 10);

describe('buildSiteLastmodMap', () => {
  const dir = content({
    a: 'title: A\npubDate: 2026-07-01\ntags: ["go", "mud"]',
    b: 'title: B\npubDate: 2026-08-01\nupdatedDate: 2026-11-01\ntags:\n  - mud\n  - ai',
    c: 'title: C\npubDate: 2026-12-01\ndraft: true\ntags: ["go"]',
  });
  const git = (files: string[]) => (files.includes('src/pages/about.md') ? new Date('2026-10-10T00:00:00Z') : null);
  const map = buildSiteLastmodMap({ contentDir: dir, git });

  it('dates the listing pages by the newest published post, ignoring drafts', () => {
    for (const p of ['/', '/blog/', '/blog/tags/']) expect(iso(map.get(p))).toBe('2026-11-01');
  });

  it('dates each tag page by the newest post carrying the tag, for inline and list tags', () => {
    expect(iso(map.get('/blog/tags/go/'))).toBe('2026-07-01');
    expect(iso(map.get('/blog/tags/mud/'))).toBe('2026-11-01');
    expect(iso(map.get('/blog/tags/ai/'))).toBe('2026-11-01');
  });

  it('dates a static page from git, and leaves one git cannot date without a lastmod', () => {
    expect(iso(map.get('/about/'))).toBe('2026-10-10');
    expect(map.has('/privacy/')).toBe(false);
  });

  it('reads tags from both frontmatter forms', () => {
    expect(postTags(dir).get('/blog/b/')).toEqual(['mud', 'ai']);
  });
});

describe('gitLastmod', () => {
  it('refuses to date anything in a shallow clone (HEAD would be a false lastmod)', () => {
    const run = (args: string[]) => (args[0] === 'rev-parse' ? 'true' : '2026-01-01T00:00:00Z');
    expect(gitLastmod(['x'], run)).toBeNull();
  });
  it('uses the last commit date in a full clone', () => {
    const run = (args: string[]) => (args[0] === 'rev-parse' ? 'false' : '2026-09-09T12:00:00+00:00');
    expect(iso(gitLastmod(['x'], run) ?? undefined)).toBe('2026-09-09');
  });
});
