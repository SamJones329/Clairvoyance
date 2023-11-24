<script lang="ts">
	import type { AutoConfig } from '$lib/scripts/Trajectory';
	import Input from '$lib/components/Input.svelte';
	import { parseAndRound } from '$lib/scripts/math';

	export let config: AutoConfig;
	export let expanded: boolean;
</script>

<div class="flex flex-col gap-0 max-w-fit">
	<h2 class="text-lighttext">Auto Config</h2>
	<span class="relative left-1 w-16 h-[2px] bg-zinc-600 rounded-sm" />
</div>

<Input
	type="number"
	name="Max Velocity"
	value={config?.maxVelocity}
	onChange={(ev) => (config.maxVelocity = parseAndRound(ev.currentTarget.value))}
/>

<Input
	type="number"
	name="Max Acceleration"
	value={config?.maxAcceleration}
	onChange={(ev) => (config.maxAcceleration = parseAndRound(ev.currentTarget.value))}
/>

<Input
	type="checkbox"
	name="Reversed"
	value={config?.reversed}
	onChange={(ev) => (config.reversed = ev.currentTarget.checked)}
/>
