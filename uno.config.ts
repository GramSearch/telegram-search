import {
  defineConfig,
  mergeConfigs,
  presetAttributify,
  presetIcons,
  presetWebFonts,
  presetWind,
} from 'unocss'
import presetAnimations from 'unocss-preset-animations'
import { presetShadcn } from 'unocss-preset-shadcn'

export function sharedUnoConfig() {
  return defineConfig({
    shortcuts: [
      // Keep some useful existing shortcuts
      ['icon-btn', 'text-[0.9em] inline-block cursor-pointer select-none opacity-75 transition duration-200 ease-in-out hover:opacity-100 hover:text-primary !outline-none'],
      // Grid list transitions
      ['grid-list-move', 'transition-all duration-300 ease-in-out'],
      ['grid-list-enter-active', 'transition-all duration-300 ease-in-out'],
      ['grid-list-leave-active', 'transition-all duration-300 ease-in-out absolute'],
      ['grid-list-enter-from', 'opacity-0 translate-y-8'],
      ['grid-list-leave-to', 'opacity-0 translate-y-8'],
      // Fade transitions
      ['fade-enter-active', 'transition-all duration-200 ease-in-out'],
      ['fade-leave-active', 'transition-all duration-200 ease-in-out'],
      ['fade-enter-from', 'opacity-0 scale-80'],
      ['fade-leave-to', 'opacity-0 scale-80'],
    ],
    presets: [
      presetWind(),
      presetAttributify(),
      presetIcons(),
      presetWebFonts({
        provider: 'google',
        fonts: {
          sans: 'Roboto',
        },
      }),
      presetAnimations(),
      presetShadcn({
        color: 'blue',
      }),
    ],
    // Content extraction configuration for shadcn-vue
    content: {
      pipeline: {
        include: [
          // The default patterns
          /\.(vue|svelte|[jt]sx|mdx?|astro|elm|php|phtml|html)($|\?)/,
          // Include js/ts files for shadcn components
          '(components|src|packages)/**/*.{js,ts}',
        ],
      },
    },
    safelist: [
      // Keep existing useful safelisted classes
      'grid-list-move',
      'grid-list-enter-active',
      'grid-list-leave-active',
      'grid-list-enter-from',
      'grid-list-leave-to',
      'fade-enter-active',
      'fade-leave-active',
      'fade-enter-from',
      'fade-leave-to',
    ],
  })
}

export default mergeConfigs([
  sharedUnoConfig(),
])
