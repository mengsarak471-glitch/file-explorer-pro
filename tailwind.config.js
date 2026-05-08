/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'win11-bg': '#0c0c0c',
        'win11-taskbar': '#202020',
        'win11-start': '#1f1f1f',
        'win11-accent': '#0078d4',
      },
      backdropBlur: {
        'mica': '10px',
      },
      backgroundImage: {
        'mica-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
      },
    },
  },
  plugins: [],
}
