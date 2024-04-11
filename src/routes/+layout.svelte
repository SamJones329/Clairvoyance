<script>
	import '../app.css';
	import '@fortawesome/fontawesome-free/js/regular.min.js';
	import '@fortawesome/fontawesome-free/js/solid.min.js';
	import '@fortawesome/fontawesome-free/js/fontawesome.min.js';
	import '@fortawesome/fontawesome-free/js/brands.min.js';
	import { onMount } from 'svelte';
	import { initTauriTrajectoryApi } from '$lib/scripts/Trajectory';
	import { page } from '$app/stores';
	import Navbar from '$lib/components/Navbar.svelte';

	onMount(async () => {
		initTauriTrajectoryApi();
	});
</script>

{#if $page.url.pathname !== '/'}
	<Navbar />
{/if}

<slot />
