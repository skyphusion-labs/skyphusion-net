// The projects page (/projects/) and its ItemList JSON-LD are built from this list.
// Each one-liner is taken from the project's own README or GitHub description (read 2026-11-11,
// skyphusion-net#153). Claim nothing the code does not do. Every URL here must answer: the link
// gate (scripts/check-links.mjs) fails the build on a retired host.
export type Project = {
  name: string;
  description: string;
  /** Public source. Omit for a private or not-yet-public project: the page then shows no GitHub link. */
  repo?: string;
  /** The project's own site. */
  site?: string;
  /** A live instance a visitor can use. */
  demo?: string;
  /** A write-up on this blog, as a site path with its trailing slash. */
  post?: string;
  /** GitHub's measured primary language, when there is one. */
  language?: string;
  /** Shown as a badge. */
  status?: 'in development';
  /** More links for a card that covers several repositories. */
  more?: { label: string; url: string }[];
  tags: string[];
};

const GH = 'https://github.com/skyphusion-labs/';

export const PROJECTS: Project[] = [
  {
    name: 'Postern',
    description:
      'Email for humans and agents: a self-hostable mailbox on Cloudflare that sends, receives, stores and searches mail, with one API for agents (including MCP) and IMAP and webmail for people. Each identity sends as itself.',
    repo: `${GH}postern`,
    site: 'https://posternonline.com/',
    demo: 'https://demo.posternonline.com/',
    post: '/blog/postern-v1-7/',
    language: 'TypeScript',
    tags: ['email', 'cloudflare', 'mcp', 'smtp', 'self-hosted'],
  },
  {
    name: 'Vivijure',
    description:
      'A self-hosted, AGPL-3.0 AI film studio: storyboard, cast, render orchestration and a module host. Run the control panel on Cloudflare (vivijure-cf) or on a home computer or any cloud server (vivijure-local).',
    repo: `${GH}vivijure`,
    site: 'https://vivijure.dev/',
    post: '/blog/vivijure-constellation/',
    tags: ['vivijure', 'ai', 'film', 'cloudflare', 'self-hosted'],
  },
  {
    name: 'vivijure-cf',
    description:
      'The Vivijure control panel on Cloudflare Workers: storyboard, cast, modules and render orchestration.',
    repo: `${GH}vivijure-cf`,
    post: '/blog/vivijure-constellation/',
    language: 'TypeScript',
    tags: ['vivijure', 'cloudflare', 'workers'],
  },
  {
    name: 'vivijure-local',
    description:
      'The same studio control panel on a home computer or any cloud server: Node, SQLite, and S3-compatible storage.',
    repo: `${GH}vivijure-local`,
    post: '/blog/vivijure-run-anywhere/',
    language: 'TypeScript',
    tags: ['vivijure', 'self-hosted', 'docker'],
  },
  {
    name: 'vivijure-core',
    description: 'Shared orchestration for both control panels: the module registry and the film pipeline.',
    repo: `${GH}vivijure-core`,
    language: 'TypeScript',
    tags: ['vivijure'],
  },
  {
    name: 'vivijure-mcp',
    description: 'Drive the film studio API from an agent over MCP. Works with vivijure-cf and vivijure-local.',
    repo: `${GH}vivijure-mcp`,
    language: 'TypeScript',
    tags: ['vivijure', 'mcp'],
  },
  {
    name: 'vivijure-backend',
    description:
      'The RunPod GPU render engine for Vivijure: SDXL keyframes, Wan image-to-video, LoRA training and ffmpeg assembly. You deploy it on your own RunPod account.',
    repo: `${GH}vivijure-backend`,
    post: '/blog/vivijure-constellation/',
    language: 'Python',
    tags: ['vivijure', 'gpu', 'runpod'],
  },
  {
    name: 'vivijure-upscale',
    description: 'Real-ESRGAN CUDA video upscale, a finish module for Vivijure on RunPod.',
    repo: `${GH}vivijure-upscale`,
    language: 'Python',
    tags: ['vivijure', 'gpu', 'runpod'],
  },
  {
    name: 'vivijure-local-12gb and vivijure-local-16gb',
    description:
      'Own-GPU motion backends for Vivijure: LTX-Video on a 12GB card, and CogVideoX-5B on a 16GB card for higher fidelity.',
    repo: `${GH}vivijure-local-12gb`,
    more: [{ label: '16GB backend', url: `${GH}vivijure-local-16gb` }],
    post: '/blog/vivijure-run-anywhere/',
    language: 'Python',
    tags: ['vivijure', 'gpu', 'homelab'],
  },
  {
    name: 'Slate',
    description:
      'A Discord bot that co-writes a film with you and your friends in chat, then sends it to a Vivijure studio to be made into video.',
    repo: `${GH}slate`,
    post: '/blog/slate/',
    language: 'JavaScript',
    tags: ['vivijure', 'discord', 'film'],
  },
  {
    name: 'Prism',
    description:
      'A multimodal AI playground on one Cloudflare Worker: public signup, bring your own AI Gateway, chat, voice, image, video and music, RAG and projects.',
    repo: `${GH}prism`,
    demo: 'https://play.skyphusion.org/',
    post: '/blog/prism-v1/',
    language: 'TypeScript',
    tags: ['ai', 'llm', 'cloudflare', 'rag'],
  },
  {
    name: 'prism-mcp',
    description:
      'MIT-licensed MCP door for the Prism playground: agents can chat, generate media, manage RAG documents and poll long jobs without a browser.',
    repo: `${GH}prism-mcp`,
    post: '/blog/prism-v1/',
    language: 'TypeScript',
    tags: ['mcp', 'ai', 'cloudflare'],
  },
  {
    name: 'Prism control plane, iOS and Android',
    description:
      'The metered commercial door for Prism, and the native iOS and Android clients that talk to it. The plane does not store prompts.',
    repo: `${GH}prism-control-plane`,
    more: [
      { label: 'iOS', url: `${GH}prism-ios` },
      { label: 'Android', url: `${GH}prism-android` },
    ],
    post: '/blog/prism-v1/',
    language: 'TypeScript',
    tags: ['ai', 'llm', 'cloudflare'],
  },
  {
    name: 'Skyphusion AI',
    description:
      'A free WordPress plugin for Cloudflare Workers AI, AI Gateway and AI Search: site search, an optional chat button, and a Cloudflare provider for the WordPress AI Client. Live on WordPress.org.',
    repo: `${GH}skyphusion-ai`,
    site: 'https://wordpress.org/plugins/skyphusion-ai/',
    post: '/blog/skyphusion-ai/',
    language: 'PHP',
    tags: ['wordpress', 'woocommerce', 'ai', 'cloudflare'],
  },
  {
    name: 'WordPress on Cloudflare',
    description:
      'A framework for running many WordPress sites and WooCommerce stores on your own Cloudflare Workers for Platforms account, and the measured research behind it.',
    repo: `${GH}wordpress-on-cloudflare`,
    post: '/blog/wordpress-on-cloudflare/',
    tags: ['wordpress', 'woocommerce', 'cloudflare', 'php'],
  },
  {
    name: 'Zaraz Consent',
    description:
      'A WordPress must-use drop-in that reopens the Cloudflare Zaraz consent modal and reads the consent cookie.',
    repo: `${GH}zaraz-consent`,
    post: '/blog/zaraz-consent/',
    tags: ['wordpress', 'cloudflare'],
  },
  {
    name: 'GGC',
    description: 'The GGC store at ggc.sh: WooCommerce in a Cloudflare Container behind a Worker.',
    site: 'https://ggc.sh/',
    tags: ['woocommerce', 'wordpress', 'cloudflare'],
  },
  {
    name: 'search-mcp',
    description:
      'A toolkit for Cloudflare AI Search: an MCP server for agents, a streaming /ask Worker with a docs widget, and git-to-R2 corpus sync. It powers the search on this site.',
    repo: `${GH}search-mcp`,
    demo: '/search/',
    language: 'TypeScript',
    tags: ['mcp', 'rag', 'cloudflare', 'ai'],
  },
  {
    name: 'security-audit',
    description: 'Adversarial LLM security audits for GitHub pull requests and repositories, on Workers AI and AI Gateway.',
    repo: `${GH}security-audit`,
    post: '/blog/security-audit/',
    language: 'JavaScript',
    tags: ['ai', 'cloudflare'],
  },
  {
    name: 'Common Thread',
    description:
      'A methodology and reference implementation for sockpuppet attribution from observable behavior, for litigants, journalists and OSINT practitioners. It stops at cluster-level attribution and never identifies natural persons. The hosted service is offline, moving to a container with Hyperdrive.',
    repo: `${GH}common-thread`,
    post: '/blog/common-thread/',
    language: 'TypeScript',
    tags: ['osint', 'ai', 'cloudflare'],
  },
  {
    name: 'The Hollow Grid',
    description:
      'A federated, post-apocalyptic MUD on Cloudflare Workers and Durable Objects. Separate worlds share one Grid. Play at hollow.skyphusion.org and dustfall.skyphusion.org.',
    repo: `${GH}the-hollow-grid`,
    demo: 'https://hollow.skyphusion.org/',
    post: '/blog/the-hollow-grid/',
    language: 'TypeScript',
    tags: ['mud', 'cloudflare', 'durable-objects', 'federation'],
  },
  {
    name: 'Hollow Grid world servers: Go, Python, C, assembly',
    description:
      'Ports of the Grid world server in four languages, each speaking the same wire protocol and passing the shared smoke suite. Their worlds are offline, moving to containers.',
    repo: `${GH}hollow-grid-go`,
    more: [
      { label: 'Python', url: `${GH}hollow-grid-py` },
      { label: 'C', url: `${GH}hollow-grid-c` },
      { label: 'assembly', url: `${GH}hollow-grid-asm` },
    ],
    post: '/blog/hollow-grid-ports/',
    tags: ['mud', 'go', 'federation', 'websockets'],
  },
  {
    name: 'mud-bots',
    description: 'AI players for The Hollow Grid: LLM bots on Workers AI that make moral choices from structured game state.',
    repo: `${GH}mud-bots`,
    post: '/blog/mud-bots/',
    language: 'JavaScript',
    tags: ['mud', 'ai', 'llm'],
  },
  {
    name: 'SidVicious_exe',
    description: 'A punk-rock Discord roadie: Claude, web search, a Vectorize knowledge base, and Workers AI image generation.',
    repo: `${GH}SidVicious_exe`,
    post: '/blog/sidvicious-exe/',
    language: 'JavaScript',
    tags: ['discord', 'ai', 'cloudflare'],
  },
  {
    name: 'A forex trading bot',
    description:
      'We are building a trading bot that trades forex on MetaTrader 4. An exciting project in development; more to come.',
    status: 'in development',
    tags: [],
  },
];
