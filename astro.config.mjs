import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://0712121.xyz',
  output: 'static',
  devToolbar: {
    enabled: false,
  },
  integrations: [sitemap()],
  build: {
    format: 'directory',
  },
});
