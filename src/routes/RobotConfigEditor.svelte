<script lang="ts">
	import type { RobotConfig } from '$lib/scripts/Trajectory';
	import Input from '$lib/components/Input.svelte';
	import { parseAndRound } from '$lib/scripts/math';

	export let config: RobotConfig;
	export let expanded: boolean;
</script>

<Input
	type="number"
	name="Length"
	value={config?.length}
	onChange={(ev) => (config.length = parseAndRound(ev.currentTarget.value))}
/>

<Input
	type="number"
	name="Width"
	value={config?.width}
	onChange={(ev) => (config.width = parseAndRound(ev.currentTarget.value))}
/>

<Input
	type="number"
	name="Track Width"
	value={config?.trackWidth}
	onChange={(ev) => (config.trackWidth = parseAndRound(ev.currentTarget.value))}
/>

<Input
	type="number"
	name="Wheelbase"
	value={config?.wheelbase}
	onChange={(ev) => (config.wheelbase = parseAndRound(ev.currentTarget.value))}
/>
