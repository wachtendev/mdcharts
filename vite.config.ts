import { defineConfig } from 'vite'
import { resolve } from 'node:path'

export default defineConfig({
  optimizeDeps: {
    esbuildOptions: { target: 'esnext' },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'mdchart',
      fileName: () => 'mdchart.js',
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        'chart.js',
        'shiki',
        '@shikijs/markdown-it',
        'mermaid',
        'markdown-it-footnote',
        'markdown-it-task-lists',
        'markdown-it-deflist',
        'markdown-it-mathjax3',
        /^chartjs-chart-/,
        /^chartjs-plugin-/,
        /^chartjs-adapter-/,
        'date-fns',
        'world-atlas/countries-110m.json',
        '@sgratzl/chartjs-chart-boxplot',
      ],
    },
  },
})
