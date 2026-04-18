/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cream': '#F2EAE0',
        'light-blue': '#B4D3D9',
        'light-purple': '#BDA6CE',
        'dark-purple': '#9B8EC7',
      },
    },
  },
  plugins: [],
}