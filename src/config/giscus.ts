/**
 * Giscus comment widget configuration.
 *
 * Prerequisites (one-time):
 * 1. GitHub Discussions enabled on skyphusion-labs/skyphusion-net
 * 2. Install the Giscus app: https://github.com/apps/giscus
 *    Grant access to skyphusion-labs/skyphusion-net
 *
 * IDs from GitHub; verify at https://giscus.app after installing the app.
 */
export const GISCUS_CONFIG = {
  repo: 'skyphusion-labs/skyphusion-net',
  repoId: 'R_kgDOS2ctrA',
  category: 'General',
  categoryId: 'DIC_kwDOS2ctrM4C_5xZ',
  mapping: 'pathname',
  strict: '0',
  reactionsEnabled: '1',
  emitMetadata: '0',
  inputPosition: 'bottom',
  theme: 'noborder_dark',
  lang: 'en',
  loading: 'lazy',
} as const;
