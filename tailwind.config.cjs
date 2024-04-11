const defaultTheme = require('tailwindcss/defaultTheme');

const sans = ['"Source Sans 3"', ...defaultTheme.fontFamily.sans];
const serif = ['"Source Serif 4"', ...defaultTheme.fontFamily.serif];
const mono = ['"Source Code Pro"', ...defaultTheme.fontFamily.mono];

/** @type {import('tailwindcss').Config} */
const config = {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	darkMode: 'class',
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

				// use zinc for background colors

				// text colors
				darktext: '#0f172a', // slate-800
				blacktext: '#000000', // black
				lighttext: '#cbd5e1', // slate-300
				whitetext: '#ffffff' // white
			},
			fontFamily: {
				sans,
				serif,
				mono,
				display: serif,
				body: sans,
				code: mono
			}
		}
	},
	plugins: []
};

module.exports = config;
