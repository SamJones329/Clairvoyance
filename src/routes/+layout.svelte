<script>
	import '../app.css';
	import '@fortawesome/fontawesome-free/js/regular.min.js';
	import '@fortawesome/fontawesome-free/js/solid.min.js';
	import '@fortawesome/fontawesome-free/js/fontawesome.min.js';
	import { onMount, setContext } from 'svelte';
	import { DetailType, getDefaultAuto, initTauriTrajectoryApi } from '$lib/scripts/Trajectory';
	import { writable } from 'svelte/store';

	onMount(async () => {
		initTauriTrajectoryApi();
	});
</script>

<slot />
