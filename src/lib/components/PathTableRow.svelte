<script lang="ts">
	import type { SwerveTrajectoryWaypoint } from '$lib/scripts/Trajectory';

	export let row: SwerveTrajectoryWaypoint;
	export let onClickRemoveRow: () => void;
	export let onClickAddRow: () => void;
	export let updateTableRender: () => void;

	function onChangeX(this: HTMLInputElement, ev: Event) {
		row.x = Number((ev.target as HTMLInputElement).value);
		updateTableRender();
	}

	function onChangeY(this: HTMLInputElement, ev: Event) {
		row.y = Number((ev.target as HTMLInputElement).value);
		updateTableRender();
	}

	function onChangeTh(this: HTMLInputElement, ev: Event) {
		row.th = Number((ev.target as HTMLInputElement).value);
		updateTableRender();
	}

	function onChangePsi(this: HTMLInputElement, ev: Event) {
		row.psi = Number((ev.target as HTMLInputElement).value);
		updateTableRender();
	}
</script>

<tr>
	<td class="bg-violet-300 pb-1">
		<button on:click={onClickRemoveRow}>-</button>
		<button on:click={onClickAddRow}>+</button>
	</td>
	<td class="pb-1"><input type="number" class="w-12 ml-1" value={row.x} on:change={onChangeX} /></td
	>
	<td class="bg-violet-300 pb-1"
		><input type="number" class="w-12 ml-1 bg-violet-300" value={row.y} on:change={onChangeY} /></td
	>
	<td class="pb-1"
		><input type="number" class="w-12 ml-1" value={row.th} on:change={onChangeTh} /></td
	>
	<td class="bg-violet-300 pb-1"
		><input
			type="number"
			class="w-12 ml-1 bg-violet-300"
			value={row.psi}
			on:change={onChangePsi}
		/></td
	>
</tr>
