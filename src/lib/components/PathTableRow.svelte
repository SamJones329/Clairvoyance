<script lang="ts">
	import type { SwerveTrajectoryWaypoint } from '$lib/scripts/Trajectory';
	import { parseAndRound } from '$lib/scripts/math';
	import ToggleButton from '$lib/components/ToggleButton.svelte';

	export let row: SwerveTrajectoryWaypoint;
	export let onClickRemoveRow: () => void;
	export let onClickAddRow: () => void;
	export let updateTableRender: () => void;
	export let toggleShowPath: null | (() => void) = null;
	export let showPathValue: null | boolean = null;

	function onChangeX(this: HTMLInputElement, ev: Event) {
		row.x = parseAndRound((ev.target as HTMLInputElement).value);
		updateTableRender();
	}

	function onChangeY(this: HTMLInputElement, ev: Event) {
		row.y = parseAndRound((ev.target as HTMLInputElement).value);
		updateTableRender();
	}

	function onChangeTh(this: HTMLInputElement, ev: Event) {
		row.th = parseAndRound((ev.target as HTMLInputElement).value);
		updateTableRender();
	}

	function onChangePsi(this: HTMLInputElement, ev: Event) {
		row.psi = parseAndRound((ev.target as HTMLInputElement).value);
		updateTableRender();
	}
</script>

<tr class="relative">
	<td class="bg-violet-300 pb-1">
		<button type="button" on:click={onClickRemoveRow}>-</button>
	</td>
	<td class="pb-1"
		><input type="text" class="w-8 lg:w-12 ml-1" value={row.x} on:change={onChangeX} /></td
	>
	<td class="bg-violet-300 pb-1"
		><input
			type="text"
			class="w-8 lg:w-12 ml-1 bg-violet-300"
			value={row.y}
			on:change={onChangeY}
		/></td
	>
	<td class="pb-1"
		><input type="text" class="w-8 lg:w-12 ml-1" value={row.th} on:change={onChangeTh} /></td
	>
	<td class="bg-violet-300 pb-1"
		><input
			type="text"
			class="w-8 lg:w-12 ml-1 bg-violet-300"
			value={row.psi}
			on:change={onChangePsi}
		/></td
	>

	{#if toggleShowPath}
		<td class="pb-1 relative w-[1.375rem]">
			<div class="absolute top-1">
				<ToggleButton value={showPathValue ?? false} onClick={toggleShowPath} />
			</div>
		</td>
	{:else}
		<td />
	{/if}
	<button
		type="button"
		class="-top-1 left-0 absolute w-48 lg:w-64 h-2 hover:bg-opacity-50 hover:bg-green-500"
		on:click={onClickAddRow}
	/>
</tr>
