<script lang="ts">
	import type { Waypoint } from '$lib/scripts/Trajectory';
	import { parseAndRound } from '$lib/scripts/math';

	export let row: Waypoint;
	export let onClickRemoveRow: () => void;
	export let onClickAddRow: () => void;
	export let updateTableRender: () => void;

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

<tr class="relative top-0 left-0">
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

	<div class="relative top-0 left-0">
		<button
			type="button"
			class="-top-1 right-0 absolute w-48 lg:w-64 h-2 hover:bg-opacity-50 hover:bg-green-500"
			on:click={onClickAddRow}
		/>
	</div>
</tr>
