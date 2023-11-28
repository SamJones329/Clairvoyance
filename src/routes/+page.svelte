<script lang="ts">
	import PathsDrawer from './PathsDrawer.svelte';
	import PathCanvas from './PathCanvas.svelte';
	import { getDefaultAuto, type Auto } from '$lib/scripts/Trajectory';

	let auto: Auto = getDefaultAuto();
	$: console.log('+page.svelte', auto);
</script>

<div class="bg-violet-900 text-white flex items-center justify-between h-10 lg:h-20">
	<h1 class="m-4 text-xl lg:text-3xl">Clairvoyance</h1>
	<span class="text-violet-300 m-4">Samuel Jones</span>
</div>

<div class="relative flex">
	<PathsDrawer bind:auto />

	<div class="overflow-scroll max-h-screen-minus-title p-8">
		<PathCanvas bind:auto />
	</div>
</div>
