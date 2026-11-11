// Invariants for src/lib/projects.ts (skyphusion-net#153). Pure: reads the data, no server.
import { describe, it, expect } from 'vitest';
import { PROJECTS } from './src/lib/projects';

const urlsOf = (p: (typeof PROJECTS)[number]) =>
  [p.repo, p.site, p.demo, p.post, ...(p.more ?? []).map((m) => m.url)].filter(Boolean) as string[];

describe('projects data', () => {
  it('the trading bot is a teaser only: no repository, site, demo, write-up or extra link', () => {
    const bot = PROJECTS.filter((p) => /trading bot/i.test(p.name) || /forex/i.test(p.description));
    expect(bot).toHaveLength(1);
    expect(urlsOf(bot[0])).toEqual([]);
    expect(bot[0].status).toBe('in development');
  });

  it('lists no archived repository', () => {
    const repos = PROJECTS.flatMap(urlsOf).join(' ');
    for (const archived of ['vivijure-musetalk', 'vivijure-audio-upscale', 'cf-email-relay']) expect(repos).not.toContain(archived);
  });

  it('gives every repository link in the public org, and every site path a trailing slash', () => {
    for (const p of PROJECTS) {
      if (p.repo) expect(p.repo).toMatch(/^https:\/\/github\.com\/skyphusion-labs\/[A-Za-z0-9_.-]+$/);
      for (const u of urlsOf(p)) if (u.startsWith('/')) expect(u.endsWith('/')).toBe(true);
    }
  });
});
