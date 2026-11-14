import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react(), {
    name: 'preload-aion-scene',
    transformIndexHtml: {
      order: 'post',
      handler(_html, context) {
        const scene = Object.values(context.bundle ?? {}).find(chunk => chunk.type === 'chunk' && chunk.name === 'AionScene')
        return scene ? [{ tag: 'link', attrs: { rel: 'modulepreload', href: `/chronos/${scene.fileName}` }, injectTo: 'head' }] : []
      },
    },
  }],
  base: '/chronos/',
  build: { chunkSizeWarningLimit: 750 },
})
