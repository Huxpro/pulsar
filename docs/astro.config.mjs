// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import react from '@astrojs/react';
import { BASE_PATH } from './config.ts';

export default defineConfig({
  site: 'https://huangxuan.me/',
  base: BASE_PATH,
  vite: {
    css: {
      modules: {
        localsConvention: 'camelCase',
        generateScopedName: '[name]__[local]',
      },
    },
    ssr: {
      external: ['react', 'react-dom'],
    },
  },
  integrations: [
    starlight({
      title: 'Lynx Pulsar',
      customCss: [
        './src/styles/index.css',
        './src/content/docs/custom.css',
        // './src/content/docs/legacy-style.css',
        '@fontsource/bebas-neue/400.css',
      ],
      pagination: false,
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/Huxpro/pulsar' },
      ],
      sidebar: [
        {
          label: 'Lynx Pulsar',
          items: [
            { label: 'Get started', slug: 'lynx/overview' },
            { label: 'SDK reference', slug: 'sdk/lynx' },
            { label: 'Run the demo', slug: 'lynx/build-prompt' },
            { label: 'How it works', slug: 'lynx/architecture' },
            { label: 'Vue Lynx port', slug: 'lynx/vue' },
          ],
        },
        {
          label: 'Upstream Pulsar',
          items: [
            {
              label: 'Getting started ↗',
              link: 'https://docs.swmansion.com/pulsar/getting-started',
              attrs: { target: '_blank', rel: 'noopener' },
            },
            {
              label: 'Presets playground ↗',
              link: 'https://docs.swmansion.com/pulsar/presets-playground',
              attrs: { target: '_blank', rel: 'noopener' },
            },
            {
              label: 'iOS SDK ↗',
              link: 'https://docs.swmansion.com/pulsar/sdk/ios',
              attrs: { target: '_blank', rel: 'noopener' },
            },
            {
              label: 'Android SDK ↗',
              link: 'https://docs.swmansion.com/pulsar/sdk/android',
              attrs: { target: '_blank', rel: 'noopener' },
            },
            {
              label: 'React Native SDK ↗',
              link: 'https://docs.swmansion.com/pulsar/sdk/react-native',
              attrs: { target: '_blank', rel: 'noopener' },
            },
          ],
        },
        // {
        //   label: 'Blog',
        //   items: [
        //     { label: 'Table of content', slug: 'blog/table-of-content' },
        //     { label: 'Do I need haptics?', slug: 'blog/why-haptics' },
        //     { label: 'How does haptics works', slug: 'blog/how-does-haptics-works' },
        //   ],
        // },
      ],
      logo: {
        light: './src/assets/logo_label.svg',
        dark: './src/assets/logo_label.svg',
        alt: 'Pulsar Logo',
        replacesTitle: true,
      },
      favicon: '/logo.svg',
      components: {
        ThemeSelect: './src/components/ThemeSelect.astro',
        Head: './src/components/Head.astro',
        PageFrame: './src/components/PageFrame.astro',
      },
    }),
    react(),
  ],
});
