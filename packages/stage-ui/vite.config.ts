import { env } from 'node:process'

import Vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import Unused from 'unplugin-unused/vite'
import Components from 'unplugin-vue-components/vite'
import VueMacros from 'unplugin-vue-macros/vite'
import VueRouter from 'unplugin-vue-router/vite'
import { defineConfig } from 'vite'
import Inspect from 'vite-plugin-inspect'
import Devtools from 'vite-plugin-vue-devtools'
import Layouts from 'vite-plugin-vue-layouts'

export default defineConfig({
  plugins: [
    Inspect(),

    Unused(),

    Devtools(),

    VueMacros({
      defineOptions: false,
      defineModels: false,
      plugins: {
        vue: Vue({
          script: {
            propsDestructure: true,
            defineModel: true,
          },
        }),
      },
    }),

    // https://github.com/posva/unplugin-vue-router
    VueRouter(),

    // https://github.com/antfu/vite-plugin-components
    Components({
      dts: true,
    }),

    // https://github.com/antfu/unocss
    // see uno.config.ts for config
    UnoCSS(),

    Layouts(),
  ],

  // Proxy API requests to local development server
  server: {
    proxy: {
      '/api': {
        target: env.BACKEND_URL ?? 'http://localhost:3000',
        changeOrigin: true,
        // Remove /api prefix when forwarding to target
        rewrite: path => path.replace(/^\/api/, ''),
      },
      '/ws': {
        target: env.BACKEND_URL ?? 'http://localhost:3000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
