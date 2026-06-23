// // FILE LOCATION: printx_desktop/vite.config.ts

// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
// import electron from 'vite-plugin-electron'
// import renderer from 'vite-plugin-electron-renderer'

// export default defineConfig({
//   root: './',                        // ← index.html is in the project root
//   plugins: [
//     react(),
//     electron([
//       {
//         entry: 'src/main/index.ts',
//         vite: {
//           build: {
//             outDir: 'dist-electron/main',
//           },
//         },
//       },
//       {
//         entry: 'src/preload.ts',
//         vite: {
//           build: {
//             outDir: 'dist-electron',
//           },
//         },
//       },
//     ]),
//     renderer(),
//   ],
//   build: {
//     outDir: 'dist',
//   },
// })

// FILE LOCATION: printx_desktop/vite.config.ts

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    electron([
      {
        entry: 'src/main/index.ts',
        vite: {
          build: { 
            outDir: 'dist-electron/main',
            rollupOptions: {
              external: ['pdf-to-printer', 'electron']
            }
          },
        },
      },
      {
        entry: 'src/preload.ts',
        vite: {
          build: { outDir: 'dist-electron' },
        },
      },
    ]),
    renderer(),   // ← this line is critical
  ],
})