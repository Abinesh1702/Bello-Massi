import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import projectDocuments from './vite-plugins/projectDocuments.js'

export default defineConfig({
  plugins: [react(), tailwindcss(), projectDocuments()],
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) return 'charts'
          // Document viewers / ZIP: loaded only when Project Documents previews or exports something.
          if (/node_modules\/(mammoth|jszip|marked|dompurify|pako|lop|bluebird|underscore|xmlbuilder|@xmldom|base64-js|dingbat-to-unicode|lie|immediate|setimmediate|readable-stream|process-nextick-args|core-util-is|inherits|isarray|safe-buffer|string_decoder|util-deprecate|sax|argparse)\//.test(id)) return 'docs-viewer'
          if (id.includes('node_modules')) return 'vendor'
        },
      },
    },
  },
})
