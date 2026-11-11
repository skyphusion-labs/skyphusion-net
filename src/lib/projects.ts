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
      'Multimodal AI playground on Cloudflare Workers (1.0): public signup with per-user AI Gateway BYOK, ~93 models, chat, voice, RAG, projects, compact, streaming, and durable video/music jobs via Workflows.',
    repo: 'https://github.com/skyphusion-labs/prism',
    demo: 'https://play.skyphusion.org',
    post: '/blog/prism-v1/',
    tags: ['cloudflare', 'ai', 'llm', 'rag', 'workflows'],
  },
  {
    name: 'Prism control plane',
    description:
      'Metered commercial plane for Prism: enroll, plan entitlements, prepaid balance, rate limits, and OpenAI-shaped doors. Does not store prompts. Native iOS/Android talk here.',
    repo: 'https://github.com/skyphusion-labs/prism-control-plane',
    post: '/blog/prism-v1/',
    tags: ['cloudflare', 'ai', 'llm'],
  },
  {
    name: 'Prism for iOS',
    description:
      'Native iOS client for Prism against the control plane: chat, image, video, audio, music, StoreKit credit packs.',
    repo: 'https://github.com/skyphusion-labs/prism-ios',
    post: '/blog/prism-v1/',
    tags: ['cloudflare', 'ai', 'llm', 'ios'],
  },
  {
    name: 'Prism for Android',
    description:
      'Native Android client for Prism against the control plane: same commercial contract as iOS.',
    repo: 'https://github.com/skyphusion-labs/prism-android',
    post: '/blog/prism-v1/',
    tags: ['cloudflare', 'ai', 'llm', 'android'],
  },
  {
    name: 'prism-mcp',
    description:
      'MIT MCP door for the Prism playground: agents get full HTTP /api/* parity (chat, multimodal, RAG, compact, jobs). Session cookie stays on the Worker.',
    repo: 'https://github.com/skyphusion-labs/prism-mcp',
    post: '/blog/prism-v1/',
    tags: ['cloudflare', 'ai', 'llm', 'mcp'],
  },
  {
    name: 'Vivijure',
    description:
      'Self-hosted AI film studio on Cloudflare Workers: planner UI, cast, render orchestration, and a module host. Rent GPU time by the second, run on your own card, call cloud i2v APIs, and keep assembly on CPU containers you host.',
    repo: 'https://github.com/skyphusion-labs/vivijure',
    post: '/blog/vivijure-constellation/',
    tags: ['vivijure', 'ai', 'gpu', 'cloudflare', 'runpod', 'diffusion'],
  },
  {
    name: 'Vivijure Backend',
    description:
      'The datacenter GPU render engine for Vivijure on RunPod: LoRA training, SDXL keyframes, Wan image-to-video, and a live release gate that renders before it promotes.',
    repo: 'https://github.com/skyphusion-labs/vivijure-backend',
    post: '/blog/vivijure-constellation/',
    tags: ['vivijure', 'ai', 'gpu', 'runpod', 'diffusion'],
  },
  {
    name: 'Vivijure Local 12GB',
    description:
      'Own-GPU render door for Vivijure: LTX-Video image-to-video on a single consumer card with a proven 12GB VRAM floor, reached over a Cloudflare tunnel.',
    repo: 'https://github.com/skyphusion-labs/vivijure-local-12gb',
    post: '/blog/vivijure-constellation/',
    tags: ['vivijure', 'ai', 'gpu', 'diffusion'],
  },
  {
    name: 'Vivijure Local 16GB',
    description:
      'The fidelity own-GPU door for Vivijure: CogVideoX-5B-I2V on a single consumer card with a proven 16GB VRAM floor, measured on real silicon.',
    repo: 'https://github.com/skyphusion-labs/vivijure-local-16gb',
    post: '/blog/vivijure-constellation/',
    tags: ['vivijure', 'ai', 'gpu', 'diffusion'],
  },
  {
    name: 'Vivijure MuseTalk',
    description:
      'Lip-sync finish engine for Vivijure: MuseTalk on a RunPod GPU takes a face clip and an audio track and returns a mouth that matches the words.',
    repo: 'https://github.com/skyphusion-labs/vivijure-musetalk',
    post: '/blog/vivijure-constellation/',
    tags: ['vivijure', 'ai', 'gpu', 'lip-sync', 'runpod'],
  },
  {
    name: 'Vivijure Upscale',
    description:
      'Video upscale finish engine for Vivijure: 2x or 4x Real-ESRGAN on PyTorch/CUDA, GPU-bound with streamed frames and NVENC encoding.',
    repo: 'https://github.com/skyphusion-labs/vivijure-upscale',
    post: '/blog/vivijure-constellation/',
    tags: ['vivijure', 'ai', 'gpu', 'runpod'],
  },
  {
    name: 'Vivijure Audio Upscale',
    description:
      'Speech cleanup finish engine for Vivijure: resemble-enhance on a RunPod GPU denoises and restores dialogue before lip-sync, so voices come out clear and full.',
    repo: 'https://github.com/skyphusion-labs/vivijure-audio-upscale',
    post: '/blog/vivijure-constellation/',
    tags: ['vivijure', 'ai', 'gpu', 'runpod'],
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
    name: 'hollow-grid-go',
    description:
      'Rust Choir: Go world-server port of The Hollow Grid. Same smoke suite and wire protocol, offline, moving to containers.',
    repo: 'https://github.com/skyphusion-labs/hollow-grid-go',
    post: '/blog/hollow-grid-ports/',
    tags: ['go', 'mud', 'federation', 'websockets'],
  },
  {
    name: 'hollow-grid-py',
    description:
      'Verdigris Spool: Python world-server port of The Hollow Grid. Conformance-green on the shared smoke suite; offline, moving to containers.',
    repo: 'https://github.com/skyphusion-labs/hollow-grid-py',
    post: '/blog/hollow-grid-ports/',
    tags: ['python', 'mud', 'federation', 'websockets'],
  },
  {
    name: 'hollow-grid-c',
    description:
      'Ferrite Wastes: C world-server port of The Hollow Grid on bare metal, same hub federation contract as the TypeScript and language ports.',
    repo: 'https://github.com/skyphusion-labs/hollow-grid-c',
    post: '/blog/hollow-grid-ports/',
    tags: ['c', 'mud', 'federation'],
  },
  {
    name: 'hollow-grid-asm',
    description:
      'Basalt Relay: x86-64 NASM world-server port of The Hollow Grid. Protocol-first; image builds gated until the NASM 3 / PIE path is clean.',
    repo: 'https://github.com/skyphusion-labs/hollow-grid-asm',
    post: '/blog/hollow-grid-ports/',
    tags: ['assembly', 'mud', 'federation'],
  },
  {
    name: 'mud-bots',
    description:
      'AI inhabitants for The Hollow Grid: open-source models on Workers AI log in like human players, face the game\'s real moral choices, and double as live QA.',
    repo: 'https://github.com/skyphusion-labs/mud-bots',
    post: '/blog/mud-bots/',
    tags: ['mud', 'ai', 'cloudflare', 'llm'],
  },
  {
    name: 'Postern',
    description:
      'Self-hostable mailbox on Cloudflare: send and receive, searchable storage, webmail and IMAP, plus a Go SMTP relay for legacy callers. v1.7.0 pages thread reads, splits organize into its own scope, and lets a read-scoped agent credential read the deployment mailbox.',
    repo: 'https://github.com/skyphusion-labs/postern',
    demo: 'https://demo.posternonline.com/',
    post: '/blog/postern-v1-7/',
    tags: ['cloudflare', 'email', 'smtp', 'go'],
  },
  {
    name: 'Skyphusion AI',
    description:
      'GPL WordPress plugin for Workers AI, AI Gateway, and AI Search on the site owner\'s own Cloudflare account. Visitor search, a WordPress AI Client provider, and optional assistant jobs. Plugin fee is zero (v0.6.3).',
    repo: 'https://github.com/skyphusion-labs/skyphusion-ai',
    post: '/blog/skyphusion-ai/',
    tags: ['cloudflare', 'wordpress', 'woocommerce', 'ai'],
  },
  {
    name: 'Zaraz Consent',
    description:
      'GPL must-use WordPress drop-in that reopens the Cloudflare Zaraz consent modal and reads the cf_consent cookie. It does not gate scripts. Zaraz can gate only Zaraz tools (v0.1.0).',
    repo: 'https://github.com/skyphusion-labs/zaraz-consent',
    post: '/blog/zaraz-consent/',
    tags: ['cloudflare', 'wordpress'],
  },
  {
    name: 'WordPress on Cloudflare',
    description:
      'GPL research matrix and Workers for Platforms framework: many WordPress sites and WooCommerce stores on your own account, provisioned by one command or by a Worker. A cell counts only after a deploy and a test.',
    repo: 'https://github.com/skyphusion-labs/wordpress-on-cloudflare',
    post: '/blog/wordpress-on-cloudflare/',
    tags: ['cloudflare', 'wordpress', 'woocommerce', 'php'],
  },
  {
    name: 'security-audit',
    description:
      'Adversarial LLM security audits for GitHub PRs and repos via Cloudflare Workers AI and AI Gateway. Advisory CI layer with secret redaction and a public/private data boundary.',
    repo: 'https://github.com/skyphusion-labs/security-audit',
    post: '/blog/security-audit/',
    tags: ['cloudflare', 'ai', 'side-project'],
  },
  {
    name: 'search-mcp',
    description:
      'Cloudflare AI Search toolkit: MCP server, streaming /ask Worker, embeddable ask widget, and git-to-R2 corpus sync for docs and public code.',
    repo: 'https://github.com/skyphusion-labs/search-mcp',
    demo: 'https://skyphusion.net/search/',
    tags: ['cloudflare', 'ai', 'mcp', 'rag'],
  },
  {
    name: 'vivijure-local',
    description:
      'Self-hosted Vivijure control panel: Node, SQLite, S3/MinIO, Docker Compose. Same studio API as vivijure-cf without a Cloudflare account.',
    repo: 'https://github.com/skyphusion-labs/vivijure-local',
    post: '/blog/vivijure-run-anywhere/',
    tags: ['vivijure', 'docker', 'self-hosted', 'homelab'],
  },
];
