import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/VNCClient.tsx'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  external: ['react', 'react-dom', '@novnc/novnc'],
  minify: true,
  sourcemap: true,
});