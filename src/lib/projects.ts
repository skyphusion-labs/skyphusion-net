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
    demo: 'https://vivijure.skyphusion.org/welcome',
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
      'Self-hostable mailbox on Cloudflare: send and receive, searchable storage, webmail and IMAP, plus a Go SMTP relay for legacy callers.',
    repo: 'https://github.com/skyphusion-labs/postern',
    post: '/blog/postern/',
    tags: ['cloudflare', 'email', 'smtp', 'go'],
  },
];
