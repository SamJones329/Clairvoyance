<script lang="ts">
	export let onClickRemoveRow: () => void;
	export let onClickAddRow: () => void;
</script>

<tr class="h-8 bg-violet-500 text-white relative">
	<td class="pb-1">
		<button type="button" on:click={onClickRemoveRow}>-</button>
	</td>
	<td colspan="5"> <span class="">Breakpoint</span> </td>
	<button
		type="button"
		class="-top-1 left-0 absolute w-48 lg:w-64 h-2 hover:bg-opacity-50 hover:bg-green-500 z-20"
		on:click={onClickAddRow}
	/>
	<span class="absolute w-48 lg:w-64 h-[0.15rem] bg-violet-700 -top-[0.1rem] left-0 z-10" />
	<span class="absolute w-48 lg:w-64 h-[0.15rem] bg-violet-700 -bottom-[0.1rem] left-0 z-10" />
</tr>
