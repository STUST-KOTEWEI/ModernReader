import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
  ],
  darkMode: 'media',
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config
