import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import { boundaryPaths } from './src/tests/test-boundaries-manifest.js';

/**
 * ramify-agent runs its own test toolchain. This config keeps vitest, started
 * from `ramify-agent/`, from picking up the toolkit's configuration while the agent
 * still lives inside the ramify.ts repository. Node owners' tests run in
 * Node; the web module's tests run in jsdom. The projects under
 * subs/harness/fixtures/ are test data, never test source. The web project
 * deduplicates
 * React and inlines `ramify.ts` and `@xyflow/react`, so the packaged canvas
 * resolves the web module's React rather than the linked checkout's copy.
 */
export const nodeDiscovery = {
  environment: 'node' as const,
  include: ['src/tests/**/*.test.ts', 'subs/**/src/**/*.test.ts'],
  exclude: ['subs/web/**', 'subs/harness/fixtures/**', '**/src/tmp/**', '**/tests/helpers/**/*.test.ts'],
};
export const webDiscovery = {
  environment: 'jsdom' as const,
  include: ['subs/web/src/**/*.test.{ts,tsx}'],
  exclude: ['subs/harness/fixtures/**', '**/src/tmp/**'],
};
export default defineConfig(async () => {
  const root = process.cwd();
  const paths = await boundaryPaths(root, nodeDiscovery, webDiscovery);
  return {
    test: {
      projects: [
        { test: { name: 'boundaries', environment: 'node', setupFiles: ['src/tests/vitest-test-lock.ts', 'src/tests/vitest-boundary-processes.ts'], include: paths, exclude: ['subs/harness/fixtures/**', '**/src/tmp/**'] } },
        {
          test: {
            name: 'node',
            ...nodeDiscovery,
            setupFiles: ['src/tests/vitest-test-lock.ts', 'src/tests/vitest-process-guard.ts', 'subs/harness/src/tests/helpers/mock-session-store.setup.ts'],
            exclude: [...nodeDiscovery.exclude, ...paths],
          },
        },
        {
          plugins: [react()],
          resolve: { dedupe: ['react', 'react-dom'] },
          test: {
            name: 'web',
            ...webDiscovery,
            setupFiles: ['src/tests/vitest-test-lock.ts', 'src/tests/vitest-process-guard.ts'],
            // React Flow's store imports React too: zustand is inlined with it,
            // and the CommonJS selector shim zustand imports is prebundled, since
            // an inlined CommonJS file would still require the checkout's React.
            server: { deps: { inline: ['ramify.ts', '@xyflow/react', 'zustand'] } },
            deps: { optimizer: { client: { enabled: true, include: ['use-sync-external-store/shim/with-selector.js'] } } },
          },
        },
      ],
    },
  };
});
