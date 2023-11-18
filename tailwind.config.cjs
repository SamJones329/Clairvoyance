/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // styling colors
        primary: '#8B5CF6',
        secondary: '#A78BFA',
        accent: '#B3A1F7',
        info: '#60A5FA',
        link: '#818CF8', // D64AEB
        danger: '#F87171',
        success: '#34D399',
        warning: '#FBBF24',

        // background colors
        back: "#18181b", // zinc-900
        mid: "#27272a", // zinc-800
        top: "#3f3f46", // zinc-700

        // text colors
        darktext: "#0f172a", // slate-800
        blacktext: "#000000", // black
        lighttext: "#cbd5e1", // slate-300
        whitetext: "#ffffff", // white
      }
    },
  },
  plugins: [],
}
