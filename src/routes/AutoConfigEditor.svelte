<script lang="ts">
	import type { AutoConfig } from '$lib/scripts/Trajectory';
	import Input from '$lib/components/Input.svelte';
	import { parseAndRound } from '$lib/scripts/math';
	import { onMount } from 'svelte';
	import Checkbox from '$lib/components/Checkbox.svelte';

	export let config: AutoConfig;
	export let expanded: boolean;

	onMount(() => console.debug(config));
</script>

<div class="flex flex-col gap-0 max-w-fit">
	<h2 class="text-lighttext">Auto Config</h2>
	<span class="relative left-1 w-16 h-[2px] bg-zinc-600 rounded-sm" />
</div>

<Input
	type="number"
	name="Max Velocity"
	value={config.maxVelocity}
	onChange={(ev) => (config.maxVelocity = parseAndRound(ev.currentTarget.value))}
/>

<Input
	type="number"
	name="Max Acceleration"
	value={config.maxAcceleration}
	onChange={(ev) => (config.maxAcceleration = parseAndRound(ev.currentTarget.value))}
/>

<Checkbox name="Reversed" bind:checked={config.reversed} />
