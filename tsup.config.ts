import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    clean: true,
    external: ['react', 'react-dom', './VNCClient'],
    minify: true,
    sourcemap: true,
  },
  {
    entry: ['src/VNCClient.tsx'],
    format: ['cjs'],
    dts: true,
    external: ['react', 'react-dom'],
    noExternal: ['@novnc/novnc'],
    minify: true,
    sourcemap: true,
  },
]);