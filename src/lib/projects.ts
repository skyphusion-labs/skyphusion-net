export type Project = {
  name: string;
  description: string;
  repo: string;
  demo?: string;
  post?: string;
  tags: string[];
};

export const PROJECTS: Project[] = [
  {
    name: 'Prism',
    description:
      'Multimodal AI playground on Cloudflare Workers: 35 chat models, voice chat, RAG, projects, streaming, and durable video/music jobs via Workflows.',
    repo: 'https://github.com/skyphusion-labs/prism',
    post: '/blog/llm/',
    tags: ['cloudflare', 'ai', 'llm', 'rag', 'workflows'],
  },
  {
    name: 'Vivijure',
    description:
      'Self-hosted AI film studio on Cloudflare Workers: planner UI, cast, render orchestration, and a module host. Attach your own GPU backend or cloud motion APIs per stage.',
    repo: 'https://github.com/skyphusion-labs/vivijure',
    demo: 'https://vivijure.skyphusion.org',
    post: '/blog/vivijure-talking-character/',
    tags: ['vivijure', 'ai', 'gpu', 'cloudflare', 'runpod', 'diffusion'],
  },
  {
    name: 'Slate',
    description:
      'Collaborative screenwriter assistant for Discord: storyboard brief, portraits, search, and render submission to Vivijure when the crew is ready.',
    repo: 'https://github.com/skyphusion-labs/slate',
    post: '/blog/slate/',
    tags: ['vivijure', 'discord', 'ai', 'cloudflare', 'film'],
  },
  {
    name: 'SidVicious_exe',
    description:
      'Punk rock Discord roadie on Cloudflare: Claude, web search, knowledge base, and image generation. Slate without the film stack.',
    repo: 'https://github.com/skyphusion-labs/SidVicious_exe',
    post: '/blog/sidvicious-exe/',
    tags: ['discord', 'ai', 'cloudflare'],
  },
  {
    name: 'Common Thread',
    description:
      'Methodology paper plus Workers implementation for sockpuppet attribution from public behavioral signals: archive, extract, reason, export evidence packets.',
    repo: 'https://github.com/skyphusion-labs/common-thread',
    demo: 'https://common-thread.skyphusion.org',
    post: '/blog/common-thread/',
    tags: ['cloudflare', 'ai', 'osint'],
  },
  {
    name: 'The Hollow Grid',
    description:
      'Multiplayer MUD on Cloudflare Workers and Durable Objects: federated worlds, shared character, $0 at idle.',
    repo: 'https://github.com/skyphusion-labs/the-hollow-grid',
    demo: 'https://hollow.skyphusion.org',
    post: '/blog/the-hollow-grid/',
    tags: ['cloudflare', 'durable-objects', 'mud', 'federation'],
  },
  {
    name: 'Postern',
    description:
      'Self-hostable mailbox on Cloudflare: send and receive, searchable storage, webmail and IMAP, plus a Go SMTP relay for legacy callers.',
    repo: 'https://github.com/skyphusion-labs/postern',
    post: '/blog/postern/',
    tags: ['cloudflare', 'email', 'smtp', 'go'],
  },
];
