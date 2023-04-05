<script lang="ts">
	export let onClickRemoveRow: () => void;
	export let onClickAddRow: () => void;
</script>

<tr class="h-8 bg-violet-500 text-white border-y-2 border-violet-700">
	<td class="pb-1">
		<button on:click={onClickRemoveRow}>-</button>
		<button on:click={onClickAddRow}>+</button>
	</td>
	<td colspan="4"> Breakpoint </td>
</tr>
