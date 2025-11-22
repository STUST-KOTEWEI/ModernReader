/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {},
  },
  safelist: [
    // Buttons
    'px-4','py-2','rounded-md','bg-indigo-600','hover:bg-indigo-700','text-white','focus:ring-2','focus:ring-offset-2','focus:ring-indigo-500',
    // Layout/typography commonly used on HomePage
    'text-5xl','text-xl','text-lg','font-bold','mb-4','mb-6','mb-8',
    'grid','md:grid-cols-2','lg:grid-cols-3','gap-6','mt-12',
    // Badges
    'px-4','py-2','bg-indigo-100','dark:bg-indigo-900','text-indigo-800','dark:text-indigo-200','rounded-full','text-sm','font-medium',
    // Hero backgrounds
    'bg-gradient-to-br','from-indigo-50','to-purple-50','dark:from-gray-900','dark:to-gray-800',
  ],
  plugins: [],
}
