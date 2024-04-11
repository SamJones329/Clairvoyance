<script lang="ts">
	import { getDefaultAuto } from '$lib/scripts/Trajectory';
	import { onMount } from 'svelte';
	import PathPlanner from './PathPlanner.svelte';

	export let data;

	let project = { autos: [getDefaultAuto()] };
	onMount(() => {
		let projectString = localStorage.getItem(data.project);
		if (projectString) {
			project = JSON.parse(projectString);
		}
	});
</script>

<PathPlanner autos={project.autos} />
