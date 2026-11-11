export const SITE_NAME = 'skyphusion.net';
export const AUTHOR_NAME = 'Conrad Rockenhaus';
export const AUTHOR_EMAIL = 'conrad@skyphusion.org';
export const X_USERNAME = 'rockrockenhaus';
export const DEFAULT_OG_IMAGE = '/og-default.png';
export const DEFAULT_OG_IMAGE_WIDTH = 1200;
export const DEFAULT_OG_IMAGE_HEIGHT = 630;
export const DEFAULT_OG_IMAGE_ALT =
  'skyphusion.net: engineering notes on open source AI, Cloudflare Workers, and self-hosted infrastructure by Conrad Rockenhaus.';

export const PUBLIC_RECORD_URL = 'https://rockenhaus.net/' as const;

export const SOCIAL_PROFILES = [
  `https://x.com/${X_USERNAME}`,
  'https://www.linkedin.com/in/skyphusion/',
  'https://facebook.com/skyphusion',
  'https://instagram.com/skyphusion',
  'https://github.com/skyphusion',
  'https://github.com/skyphusion-labs',
  PUBLIC_RECORD_URL,
  'https://skyphusion.org',
  'https://github.skyphusion.org',
  'https://github.skyphusion.net',
  'https://vivijure.dev',
] as const;

export const PRODUCT_URLS = [
  'https://github.com/skyphusion-labs/prism',
  'https://github.com/skyphusion-labs/postern',
  'https://github.com/skyphusion-labs/the-hollow-grid',
  'https://github.com/skyphusion-labs/mud-bots',
  'https://github.com/skyphusion-labs/vivijure',
  'https://github.com/skyphusion-labs/slate',
  'https://github.com/skyphusion-labs/SidVicious_exe',
  'https://github.com/skyphusion-labs/common-thread',
  'https://github.com/skyphusion-labs/security-audit',
  'https://github.com/skyphusion-labs/search-mcp',
  'https://github.com/skyphusion-labs/vivijure-backend',
  'https://github.com/skyphusion-labs/vivijure-local-12gb',
  'https://github.com/skyphusion-labs/vivijure-local-16gb',
  'https://github.com/skyphusion-labs/vivijure-musetalk',
  'https://github.com/skyphusion-labs/vivijure-upscale',
  'https://github.com/skyphusion-labs/vivijure-audio-upscale',
  'https://skyphusion.org',
  'https://github.skyphusion.org',
  'https://github.skyphusion.net',
  'https://vivijure.dev',
  'https://posternonline.com',
  'https://play.skyphusion.org',
  'https://demo.posternonline.com',
  'https://hollow.skyphusion.org',
  'https://dustfall.skyphusion.org',
] as const;

/** Normalize Astro.site (often trailing slash) so joins never produce //path. */
export function siteOrigin(site: URL | string): string {
  const raw = typeof site === 'string' ? site : site.href;
  return raw.replace(/\/+$/, '') || raw;
}

export function canonicalUrl(pathname: string, site: URL | string): string {
  const base = siteOrigin(site);
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return new URL(path, `${base}/`).href;
}

export function absoluteUrl(path: string, site: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return new URL(path, `${siteOrigin(site)}/`).href;
}

export function tagPath(tag: string): string {
  return `/blog/tags/${encodeURIComponent(tag)}/`;
}

type BreadcrumbItem = {
  name: string;
  url: string;
};

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

type BlogPostingInput = {
  title: string;
  description: string;
  url: string;
  pubDate: Date;
  updatedDate?: Date;
  image?: string;
  tags?: string[];
};

export function blogPostingJsonLd({
  title,
  description,
  url,
  pubDate,
  updatedDate,
  image,
  tags = [],
}: BlogPostingInput) {
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    datePublished: pubDate.toISOString(),
    dateModified: (updatedDate ?? pubDate).toISOString(),
    author: {
      '@type': 'Person',
      name: AUTHOR_NAME,
      url: 'https://skyphusion.net/about/',
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: 'https://skyphusion.net/',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    url,
  };

  if (image) {
    jsonLd.image = image;
  }

  if (tags.length > 0) {
    jsonLd.keywords = tags.join(', ');
  }

  return jsonLd;
}

export function webSiteJsonLd(site: string) {
  const origin = siteOrigin(site);
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: `${origin}/`,
    description:
      'Engineering blog by Conrad Rockenhaus: free AGPL open source AI film studio (Vivijure), Postern mailbox for agents, Cloudflare Workers infrastructure, and self-hosted systems from Skyphusion Labs.',
    author: {
      '@type': 'Person',
      name: AUTHOR_NAME,
      url: `${origin}/about/`,
      sameAs: [...SOCIAL_PROFILES, ...PRODUCT_URLS],
    },
    publisher: {
      '@type': 'Organization',
      name: 'Skyphusion Labs',
      url: 'https://skyphusion.org',
      sameAs: [
        'https://github.com/skyphusion-labs',
        'https://github.skyphusion.org',
        'https://github.skyphusion.net',
        'https://skyphusion.net',
        'https://vivijure.com',
        'https://play.skyphusion.org',
      ],
    },
  };
}

export function blogJsonLd(site: string) {
  const origin = siteOrigin(site);
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: `${SITE_NAME} blog`,
    url: `${origin}/blog/`,
    description:
      'Engineering posts on Vivijure, Postern, Prism, Cloudflare Workers, and self-hosted open source from Skyphusion Labs.',
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: `${origin}/`,
    },
  };
}

export function personJsonLd(site: string) {
  const origin = siteOrigin(site);
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: AUTHOR_NAME,
    email: AUTHOR_EMAIL,
    url: `${origin}/about/`,
    description:
      'Conrad Rockenhaus builds open source AI and Cloudflare infrastructure. Public Michigan court record at rockenhaus.net.',
    sameAs: [...SOCIAL_PROFILES, ...PRODUCT_URLS],
    jobTitle: 'Independent developer',
    worksFor: {
      '@type': 'Organization',
      name: 'Skyphusion Labs',
      url: 'https://skyphusion.org',
      sameAs: [
        'https://github.com/skyphusion-labs',
        'https://github.skyphusion.org',
        'https://github.skyphusion.net',
        'https://vivijure.com',
      ],
    },
  };
}

export function projectsJsonLd(site: string, projects: { name: string; description: string; repo: string }[]) {
  const origin = siteOrigin(site);
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Open source projects',
    url: `${origin}/projects/`,
    itemListElement: projects.map((project, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'SoftwareSourceCode',
        name: project.name,
        description: project.description,
        codeRepository: project.repo,
        programmingLanguage: 'TypeScript',
        author: {
          '@type': 'Person',
          name: AUTHOR_NAME,
        },
      },
    })),
  };
}
