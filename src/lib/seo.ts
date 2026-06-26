export const SITE_NAME = 'skyphusion.net';
export const AUTHOR_NAME = 'Conrad Rockenhaus';
export const AUTHOR_EMAIL = 'conrad@skyphusion.org';
export const X_USERNAME = 'skyphusion';
export const DEFAULT_OG_IMAGE = '/og-default.png';
export const DEFAULT_OG_IMAGE_WIDTH = 1200;
export const DEFAULT_OG_IMAGE_HEIGHT = 630;

export const SOCIAL_PROFILES = [
  `https://x.com/${X_USERNAME}`,
  'https://github.com/skyphusion-labs',
] as const;

export const PRODUCT_URLS = [
  'https://github.com/skyphusion-labs/prism',
  'https://github.com/skyphusion-labs/postern',
  'https://github.com/skyphusion-labs/the-hollow-grid',
  'https://github.com/skyphusion-labs/vivijure',
  'https://github.com/skyphusion-labs/slate',
  'https://github.com/skyphusion-labs/SidVicious_exe',
  'https://github.com/skyphusion-labs/common-thread',
  'https://github.com/skyphusion-labs/vivijure-backend',
  'https://vivijure.skyphusion.org',
  'https://hollow.skyphusion.org',
  'https://common-thread.skyphusion.org',
] as const;

export function canonicalUrl(pathname: string, site: URL | string): string {
  const base = typeof site === 'string' ? site : site.origin;
  return new URL(pathname, base).href;
}

export function absoluteUrl(path: string, site: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return new URL(path, site).href;
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
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: site,
    description: 'Notes on technology, infrastructure, and occasional findings.',
    author: {
      '@type': 'Person',
      name: AUTHOR_NAME,
      url: `${site}/about/`,
    },
  };
}

export function blogJsonLd(site: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: `${SITE_NAME} blog`,
    url: `${site}/blog/`,
    description: 'All posts on skyphusion.net',
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: site,
    },
  };
}

export function personJsonLd(site: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: AUTHOR_NAME,
    email: AUTHOR_EMAIL,
    url: `${site}/about/`,
    sameAs: [...SOCIAL_PROFILES, ...PRODUCT_URLS],
    jobTitle: 'Independent developer',
    worksFor: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: site,
    },
  };
}

export function projectsJsonLd(site: string, projects: { name: string; description: string; repo: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Open source projects',
    url: `${site}/projects/`,
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
