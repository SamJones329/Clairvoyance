<script lang="ts">
	import Input from '$lib/components/Input.svelte';
	import type { Waypoint } from '$lib/scripts/Trajectory';
	import { parseAndRound } from '$lib/scripts/math';

	export let div: HTMLDivElement;
	export let waypoint: Waypoint;
	export let expanded: boolean;
</script>

{#if expanded}
	<div class="flex flex-col gap-0 max-w-min">
		<h2 class="text-lighttext">Waypoint</h2>
		<span class="relative left-1 w-10 h-[2px] bg-zinc-600 rounded-sm" />
	</div>
	<Input
		type="number"
		name="X Position"
		value={waypoint.x}
		onChange={(ev) => (waypoint.x = parseAndRound(ev.currentTarget.value))}
	/>
	<Input
		type="number"
		name="Y Position"
		value={waypoint.y}
		onChange={(ev) => (waypoint.y = parseAndRound(ev.currentTarget.value))}
	/>
	<Input
		type="number"
		name="Heading"
		value={waypoint.th}
		onChange={(ev) => (waypoint.th = parseAndRound(ev.currentTarget.value))}
	/>
	<Input
		type="number"
		name="Orientation"
		value={waypoint.psi}
		onChange={(ev) => (waypoint.psi = parseAndRound(ev.currentTarget.value))}
	/>
{/if}
