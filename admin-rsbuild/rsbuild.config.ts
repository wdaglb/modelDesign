import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { TanStackRouterRspack } from '@tanstack/router-plugin/rspack';
import { pluginLess } from '@rsbuild/plugin-less';
import { RsdoctorRspackPlugin } from '@rsdoctor/rspack-plugin';
import * as path from 'path';
import Icons from 'unplugin-icons/rspack';

export default defineConfig({
  plugins: [pluginReact(), pluginLess()],

  resolve: {
    alias: {
      '@/': path.resolve(__dirname, './src'),
    },
  },

  html: {
    title: process.env.TITLE,
    template: './index.html',
  },

  performance: {
    // inlineStyles: true,
    preload: true,
  },

  output: {
    cssModules: {
      exportGlobals: true,
    },
  },

  tools: {
    rspack: (_, { prependPlugins, appendPlugins }) => {
      appendPlugins(
        TanStackRouterRspack({
          target: 'react',
          autoCodeSplitting: true,
          routeFileIgnorePrefix: '#',
          routeFileIgnorePattern: 'components',
        }),
      );

      prependPlugins([
        Icons({
          compiler: 'jsx',
          autoInstall: true,
        }),
      ]);

      if (process.env.RSDOCTOR) {
        appendPlugins(new RsdoctorRspackPlugin({}));
      }
    },
  },

  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:9999',
        changeOrigin: true,
        pathRewrite: { '^/api': '' },
      },
    },
  },

  source: {
    define: {
      'process.env.TITLE': JSON.stringify(process.env.TITLE),
    },
  },
});
