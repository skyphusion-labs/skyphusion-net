import { describe, it, expect } from 'vitest';

describe('Skyphusion Blog Engine Smoke Suite', () => {
  it('should verify the homepage renders successfully', async () => {
    const response = await fetch('http://localhost:4321/');
    expect(response.status).toBe(200);

    const html = await response.text();
    expect(html).toContain('Conrad Rockenhaus');
  });

  it('should verify recent blog posts render successfully', async () => {
    const response = await fetch('http://localhost:4321/blog/the-hollow-grid');
    expect(response.status).toBe(200);
  });
});
