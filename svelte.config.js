import adapter from '@sveltejs/adapter-static';
import preprocess from 'svelte-preprocess';

// SvelteKit Static Adapter Config
/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			// default options are shown
			pages: 'build',
			assets: 'build',
			fallback: null
		}),
		paths: {
			base: '/Clairvoyance',
			relative: true
		}
	},

	preprocess: preprocess({
		postcss: true
	})
};

export default config;
