import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/VNCClient.tsx'],
  format: ['esm'],
  dts: true,
  splitting: true,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom'],
  noExternal: ['@novnc/novnc'],
  platform: 'browser',
  target: 'es2020',
  esbuildOptions(options) {
    options.define = {
      'global': 'globalThis',
    };
  },
});