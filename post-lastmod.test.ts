import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildPostLastmodMap } from './scripts/post-lastmod.mjs';

function fixture(files: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), 'lastmod-'));
  for (const [rel, body] of Object.entries(files)) {
    const full = join(dir, rel);
    mkdirSync(join(full, '..'), { recursive: true });
    writeFileSync(full, body);
  }
  return dir;
}

const post = (extra = '', body = 'text') =>
  `---\ntitle: t\ndescription: d\npubDate: 2026-01-02\n${extra}---\n${body}\n`;

describe('buildPostLastmodMap', () => {
  it('control: maps a flat post to its pubDate and prefers updatedDate', () => {
    const dir = fixture({
      'a.md': post(),
      'b.md': post('updatedDate: 2026-03-04\n'),
    });
    const m = buildPostLastmodMap(dir);
    expect(m.get('/blog/a/')?.toISOString()).toBe('2026-01-02T00:00:00.000Z');
    expect(m.get('/blog/b/')?.toISOString()).toBe('2026-03-04T00:00:00.000Z');
  });

  it('skips a draft declared in frontmatter', () => {
    const m = buildPostLastmodMap(fixture({ 'd.md': post('draft: true\n') }));
    expect(m.has('/blog/d/')).toBe(false);
  });

  it('does not treat "draft: true" in the post body as a draft', () => {
    const m = buildPostLastmodMap(fixture({ 'p.md': post('', 'example:\ndraft: true\n') }));
    expect(m.has('/blog/p/')).toBe(true);
  });

  it('does not read pubDate/updatedDate lines from the post body', () => {
    const m = buildPostLastmodMap(fixture({ 'p.md': post('', 'updatedDate: 2030-01-01\n') }));
    expect(m.get('/blog/p/')?.toISOString()).toBe('2026-01-02T00:00:00.000Z');
  });

  it('includes posts in subdirectories (the collection glob is **/*.md)', () => {
    const m = buildPostLastmodMap(fixture({ 'series/one.md': post() }));
    expect(m.has('/blog/series/one/')).toBe(true);
  });
});
