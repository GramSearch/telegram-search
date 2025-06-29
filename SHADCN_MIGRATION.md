# Migration to unocss-preset-shadcn

## Overview

This document outlines the migration from `@proj-airi/unocss-preset-chromatic` to `unocss-preset-shadcn` for a more comprehensive UI component library with shadcn-vue compatibility.

## Changes Made

### 1. Dependencies Added

```bash
pnpm add -D -w unocss-preset-animations unocss-preset-shadcn
pnpm add -D -w class-variance-authority clsx tailwind-merge
```

### 2. UnoCSS Configuration Updated

- **File**: `uno.config.ts`
- **Changes**:
  - Replaced `presetChromatic` with `presetShadcn` and `presetAnimations`
  - Updated from `presetWind3()` to `presetWind()`
  - Added content extraction configuration for JS/TS files
  - Removed custom theme animations (now handled by presets)
  - Cleaned up shortcuts to avoid conflicts

### 3. Utility Functions Added

- **File**: `packages/stage-ui/src/lib/utils.ts`
- **Purpose**: Provides the `cn()` function for class name merging
- **Export**: Available via `@tg-search/stage-ui`

```typescript
import { cn } from '@tg-search/stage-ui'
```

### 4. Configuration Files Created

- **`components.json`**: Configuration for shadcn-vue CLI tools
- **`tailwind.config.js`**: Empty config for CLI compatibility

## Usage

### Installing shadcn-vue Components

Now you can use the official shadcn-vue CLI to add components:

```bash
# Install shadcn-vue CLI globally if not already installed
npm install -g shadcn-vue

# Add components
npx shadcn-vue@latest add button
npx shadcn-vue@latest add dialog
npx shadcn-vue@latest add input
```

### Using the cn() Utility

```vue
<script setup lang="ts">
import { cn } from '@tg-search/stage-ui'

const props = defineProps<{
  className?: string
  conditionalClass?: boolean
}>()
</script>

<template>
  <div :class="cn('base-class', conditionalClass && 'conditional-class', className)">
    Content
  </div>
</template>
```

### Theme Colors

The preset is configured with blue as the base color. You can customize this in `uno.config.ts`:

```typescript
presetShadcn({
  color: 'blue', // or 'red', 'green', 'purple', etc.
})
```

## Compatibility

- ✅ Vue 3 components
- ✅ TypeScript support
- ✅ Existing project shortcuts preserved
- ✅ Animation presets included
- ✅ shadcn-vue CLI compatibility

## Preserved Features

The migration preserves existing functionality:
- Grid list transitions
- Fade transitions
- Icon button styles
- Web fonts configuration
- Icon presets

## Next Steps

1. **Add Components**: Start using shadcn-vue components in your project
2. **Customize Theme**: Adjust colors and styling as needed
3. **Test Integration**: Ensure all existing components work correctly
4. **Update Documentation**: Document any new component usage patterns

## Resources

- [unocss-preset-shadcn Documentation](https://github.com/unocss-community/unocss-preset-shadcn)
- [shadcn-vue Documentation](https://shadcn-vue.com/)
- [UnoCSS Documentation](https://unocss.dev/)
