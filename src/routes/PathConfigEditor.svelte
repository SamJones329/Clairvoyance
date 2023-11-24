<script lang="ts">
	import type { PathConfig } from '$lib/scripts/Trajectory';
	import Input from '$lib/components/Input.svelte';
	import { parseAndRound } from '$lib/scripts/math';

	export let config: PathConfig;
	export let expanded: boolean;
</script>

<div class="flex flex-col gap-0 max-w-fit">
	<h2 class="text-lighttext">Path Config</h2>
	<span class="relative left-1 w-16 h-[2px] bg-zinc-600 rounded-sm" />
</div>

<Input
	type="number"
	name="Start Velocity"
	value={config.startVelocity}
	placeholder="Not set"
	onChange={(ev) =>
		(config.startVelocity =
			ev.currentTarget.value.length === 0 ? undefined : parseAndRound(ev.currentTarget.value))}
/>

<Input
	type="checkbox"
	name="End Velocity"
	value={config.endVelocity}
	placeholder="Not set"
	onChange={(ev) =>
		(config.endVelocity =
			ev.currentTarget.value.length === 0 ? undefined : parseAndRound(ev.currentTarget.value))}
/>

<Input
	type="number"
	name="Max Velocity"
	value={config.maxVelocity}
	placeholder="Not set"
	onChange={(ev) =>
		(config.maxVelocity =
			ev.currentTarget.value.length === 0 ? undefined : parseAndRound(ev.currentTarget.value))}
/>

<Input
	type="number"
	name="Max Velocity"
	value={config.maxVelocity}
	placeholder="Not set"
	onChange={(ev) =>
		(config.maxVelocity =
			ev.currentTarget.value.length === 0 ? undefined : parseAndRound(ev.currentTarget.value))}
/>

<Input
	type="checkbox"
	name="Reversed"
	value={config.reversed}
	onChange={(ev) =>
		(config.reversed = ev.currentTarget.value.length === 0 ? undefined : ev.currentTarget.checked)}
/>
