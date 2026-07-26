import Inspect from 'vite-plugin-inspect';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import path from 'path'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default { 
  root: resolve(__dirname, './'), 
  base: '/',
   
  build: {
    outDir: '../docs',
    manifest: true,
    emptyOutDir: true,
    target: 'es2020',
    assetsInlineLimit: 100000000,
    rollupOptions: {
      input: {
        main: './index.html'
      },
      output: {
        manualChunks: undefined,
        inlineDynamicImports: true
      }
    }
    
  },
  server: {
    port: 9090,
    hot: true
  },
  css: {
     preprocessorOptions: {
        scss: {
          silenceDeprecations: [
            'import',
            'mixed-decls',
            'color-functions',
            'global-builtin',
          ],
          quietDeps: true,
        },
     },
  },
  plugins: [
    Inspect(), viteSingleFile(),
    {
      name: 'create-nojekyll',
      closeBundle() {
        // Путь берется из настройки build.outDir
        const outDir = path.resolve(__dirname, 'docs') 
        const filePath = path.resolve(outDir, '.nojekyll')
        
        // Проверка существование каталога и создать пустой файл
        if (fs.existsSync(outDir)) {
          fs.writeFileSync(filePath, '')
          console.log('\x1b[32m%s\x1b[0m', '✓ .nojekyll файл успешно создан в каталоге сборки.')
        }
      }
    }
  ],
  optimizeDeps: {
    include: ['lit']
  }
}