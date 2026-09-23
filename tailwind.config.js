/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './providers/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563EB',
          light: '#EFF6FF',
        },
        secondary: '#7C3AED',
        background: '#F8FAFC',
        surface: '#FFFFFF',
        foreground: '#1E293B',
        muted: {
          DEFAULT: '#64748B',
          light: '#94A3B8',
        },
        border: '#E2E8F0',
        success: '#22C55E',
        error: '#EF4444',
        warning: '#F59E0B',
        bookmark: '#F59E0B',
      },
    },
  },
  plugins: [],
};
