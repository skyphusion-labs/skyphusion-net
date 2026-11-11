// Controls for scripts/check-links.mjs (skyphusion-net#153): the gate must pass a clean page and
// fail each defect it exists to catch. Pure: no build, no server, no network.
import { describe, it, expect } from 'vitest';
import { checkPage, RETIRED_HOSTS, FORBIDDEN_HOSTS } from './scripts/check-links.mjs';

const BUILT = new Set(['blog/postern/index.html', 'privacy/index.html', 'rss.xml', 'index.html']);
const exists = (p: string) => BUILT.has(p);
const page = (body: string, head = '<title>A title</title><meta name="description" content="A description.">') =>
  `<!doctype html><html><head>${head}</head><body>${body}</body></html>`;

describe('check-links', () => {
  it('passes a clean page', () => {
    expect(checkPage('/x/', page('<a href="/blog/postern/">p</a> <a href="/rss.xml">r</a> <a href="https://github.com/x">g</a> <a href="#top">t</a>'), exists)).toEqual([]);
  });

  it('fails an internal link without its trailing slash (the 307 class)', () => {
    expect(checkPage('/x/', page('<a href="/blog/postern">p</a>'), exists)).toEqual([
      '/x/: internal link without trailing slash /blog/postern (a 307 on the live site)',
    ]);
  });

  it('fails an internal link to a page the build did not produce', () => {
    expect(checkPage('/x/', page('<a href="/blog/tags/ios/">t</a>'), exists)).toEqual(['/x/: links missing page /blog/tags/ios/']);
  });

  it('fails an absolute self-link to a missing page, and a missing file', () => {
    expect(checkPage('/x/', page('<a href="https://skyphusion.net/nope/">n</a> <a href="/gone.xml">f</a>'), exists)).toEqual([
      '/x/: links missing page /nope/',
      '/x/: links missing file /gone.xml',
    ]);
  });

  it('keeps every host the 2026-11-11 audit found dead (NXDOMAIN or no address) on the list', () => {
    for (const host of ['demo.vivijure.com', 'analytics.skyphusion.org', 'common-thread.skyphusion.org', 'common-thread-backend.skyphusion.org', 'rustchoir.skyphusion.org', 'verdigris.skyphusion.org', 'ferrite.skyphusion.org']) {
      expect(RETIRED_HOSTS).toContain(host);
    }
  });

  it('fails any mention of a retired host, linked or as plain text', () => {
    for (const host of RETIRED_HOSTS) {
      expect(checkPage('/x/', page(`<a href="https://${host}/a">d</a>`), exists)).toEqual([`/x/: names retired host ${host}`]);
      expect(checkPage('/x/', page(`<p>Play at ${host} today.</p>`), exists)).toEqual([`/x/: names retired host ${host}`]);
    }
  });

  it('fails any reference to a forbidden third party, such as the Giscus loader', () => {
    expect(FORBIDDEN_HOSTS).toContain('giscus.app');
    expect(checkPage('/x/', page('<script src="https://giscus.app/client.js" async></script>'), exists)).toEqual([
      '/x/: references forbidden host giscus.app',
    ]);
  });

  it('fails an empty title and a missing description', () => {
    expect(checkPage('/x/', page('', '<title></title>'), exists)).toEqual(['/x/: empty <title>', '/x/: no meta description']);
  });
});
